
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-key',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    
    // Handle TrainerAI webhook from n8n
    if (url.pathname.endsWith('/trainerai')) {
      const authHeader = req.headers.get('x-webhook-key')
      if (authHeader !== Deno.env.get('TRAINERAI_WEBHOOK_KEY')) {
        console.error('Unauthorized TrainerAI webhook attempt')
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { 
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      const body = await req.json()
      console.log('TrainerAI webhook received - Full payload:', JSON.stringify(body, null, 2))

      // Extract data based on n8n structure
      // n8n typically sends data in different formats, let's handle multiple possibilities
      let messageData;
      
      if (Array.isArray(body)) {
        // If n8n sends an array of items
        messageData = body[0] || body;
      } else if (body.data) {
        // If n8n wraps data in a 'data' property
        messageData = body.data;
      } else {
        // Direct object
        messageData = body;
      }

      console.log('Extracted message data:', JSON.stringify(messageData, null, 2))

      // Try to extract WhatsApp message information
      const remoteJid = messageData.remoteJid || messageData.from || messageData.phone || messageData.number;
      const message = messageData.message || messageData.content || messageData.text || messageData.body;
      const type = messageData.type || messageData.messageType || 'text';
      const date_time = messageData.date_time || messageData.timestamp || messageData.time || new Date().toISOString();

      console.log('Processed fields:', { remoteJid, message, type, date_time });

      if (!remoteJid || !message) {
        console.error('Missing required fields. Available fields:', Object.keys(messageData));
        return new Response(
          JSON.stringify({ 
            error: 'Missing required fields: remoteJid/from/phone and message/content/text',
            received_fields: Object.keys(messageData),
            full_payload: messageData
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Extract phone number from remoteJid
      const phone = remoteJid.replace('@whatsapp.net', '').replace('@s.whatsapp.net', '').replace('@c.us', '');

      // Log the webhook with full context
      const { data: logData, error: logError } = await supabaseClient
        .from('webhook_logs')
        .insert({
          source: 'trainerai_whatsapp_n8n',
          event_type: 'message_received',
          payload: {
            original_payload: body,
            processed_data: {
              remoteJid,
              message,
              type,
              date_time,
              phone
            }
          },
          processed: false
        })
        .select()

      if (logError) {
        console.error('Error logging webhook:', logError)
      } else {
        console.log('Webhook logged:', logData)
      }

      // Save to ai_conversations
      const { data: conversationData, error: conversationError } = await supabaseClient
        .from('ai_conversations')
        .insert({
          session_id: `whatsapp_${phone}`,
          message_type: 'user',
          content: message,
          context: {
            source: 'whatsapp_n8n',
            phone,
            remoteJid,
            type,
            date_time,
            n8n_webhook_id: url.pathname,
            original_payload: messageData
          }
        })
        .select()

      if (conversationError) {
        console.error('Error saving TrainerAI conversation:', conversationError)
        return new Response(
          JSON.stringify({ 
            error: 'Failed to save conversation',
            details: conversationError.message 
          }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Mark webhook as processed
      if (logData && logData[0]) {
        await supabaseClient
          .from('webhook_logs')
          .update({ processed: true })
          .eq('id', logData[0].id)
      }

      console.log('TrainerAI webhook processed successfully')
      
      // Resposta estruturada para o n8n
      const response = {
        success: true,
        message: 'Webhook processed successfully',
        data: {
          conversation_id: conversationData?.[0]?.id,
          session_id: `whatsapp_${phone}`,
          phone: phone,
          processed_at: new Date().toISOString(),
          message_content: message,
          message_type: type
        },
        webhook_info: {
          source: 'trainerai_whatsapp_n8n',
          webhook_path: url.pathname,
          processed_fields: {
            remoteJid,
            message,
            type,
            date_time,
            phone
          }
        }
      }

      return new Response(
        JSON.stringify(response),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Handle existing webhook functionality
    const body = await req.json()
    const { source, eventType, data, userId } = body

    console.log('Webhook received:', { source, eventType, userId })

    // Log do webhook
    await supabaseClient
      .from('webhook_logs')
      .insert({
        user_id: userId,
        source,
        event_type: eventType,
        payload: data,
        processed: false
      })

    // Processar dados baseado no source e eventType
    switch (source) {
      case 'strava':
        await processStravaData(supabaseClient, userId, data)
        break
      case 'training_plan':
        await processTrainingPlan(supabaseClient, userId, data)
        break
      case 'nutrition_plan':
        await processNutritionPlan(supabaseClient, userId, data)
        break
      case 'calendar':
        await processCalendarEvent(supabaseClient, userId, data)
        break
      case 'ai_conversation':
        await processAIConversation(supabaseClient, userId, data)
        break
      case 'user_profile':
        await processUserProfile(supabaseClient, userId, data)
        break
    }

    // Marcar webhook como processado
    await supabaseClient
      .from('webhook_logs')
      .update({ processed: true })
      .eq('user_id', userId)
      .eq('source', source)
      .eq('event_type', eventType)

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook processed successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function processStravaData(supabaseClient: any, userId: string, data: any) {
  const { error } = await supabaseClient
    .from('strava_activities')
    .upsert({
      user_id: userId,
      strava_activity_id: data.id.toString(),
      name: data.name,
      type: data.type,
      distance: data.distance ? data.distance / 1000 : null, // Convert to km
      moving_time: data.moving_time,
      elapsed_time: data.elapsed_time,
      total_elevation_gain: data.total_elevation_gain,
      average_speed: data.average_speed,
      max_speed: data.max_speed,
      average_heartrate: data.average_heartrate,
      max_heartrate: data.max_heartrate,
      calories: data.calories,
      start_date: data.start_date,
      achievement_count: data.achievement_count || 0,
      kudos_count: data.kudos_count || 0
    }, {
      onConflict: 'strava_activity_id'
    })

  if (error) throw error
}

async function processTrainingPlan(supabaseClient: any, userId: string, data: any) {
  const { error } = await supabaseClient
    .from('training_plans')
    .insert({
      user_id: userId,
      title: data.title,
      description: data.description,
      duration_weeks: data.duration_weeks,
      difficulty_level: data.difficulty_level,
      plan_data: data.plan_data,
      status: data.status || 'active',
      created_by_ai: true
    })

  if (error) throw error
}

async function processNutritionPlan(supabaseClient: any, userId: string, data: any) {
  const { error } = await supabaseClient
    .from('nutrition_plans')
    .insert({
      user_id: userId,
      title: data.title,
      description: data.description,
      daily_calories: data.daily_calories,
      macros: data.macros,
      meal_plan: data.meal_plan,
      restrictions: data.restrictions,
      status: data.status || 'active',
      created_by_ai: true
    })

  if (error) throw error
}

async function processCalendarEvent(supabaseClient: any, userId: string, data: any) {
  const { error } = await supabaseClient
    .from('calendar_events')
    .upsert({
      user_id: userId,
      google_event_id: data.google_event_id,
      title: data.title,
      description: data.description,
      event_type: data.event_type,
      start_time: data.start_time,
      end_time: data.end_time,
      location: data.location,
      status: data.status || 'scheduled'
    }, {
      onConflict: 'google_event_id'
    })

  if (error) throw error
}

async function processAIConversation(supabaseClient: any, userId: string, data: any) {
  const { error } = await supabaseClient
    .from('ai_conversations')
    .insert({
      user_id: userId,
      session_id: data.session_id,
      message_type: data.message_type,
      content: data.content,
      context: data.context
    })

  if (error) throw error
}

async function processUserProfile(supabaseClient: any, userId: string, data: any) {
  const { error } = await supabaseClient
    .from('user_profiles')
    .upsert({
      user_id: userId,
      name: data.name,
      objective: data.objective,
      deadline: data.deadline,
      weight: data.weight,
      height: data.height,
      age: data.age,
      food_preferences: data.food_preferences,
      restrictions: data.restrictions,
      training_frequency: data.training_frequency,
      experience_level: data.experience_level,
      strava_connected: data.strava_connected,
      strava_athlete_id: data.strava_athlete_id,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    })

  if (error) throw error
}
