
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
      const expectedKey = Deno.env.get('TRAINERAI_WEBHOOK_KEY')
      
      console.log('=== WEBHOOK TRAINERAI DEBUG START ===')
      console.log('Headers recebidos:', Object.fromEntries(req.headers.entries()))
      console.log('x-webhook-key recebido:', authHeader)
      console.log('x-webhook-key esperado:', expectedKey ? 'CONFIGURADO' : 'NÃO CONFIGURADO')
      console.log('URL pathname:', url.pathname)
      console.log('Método:', req.method)
      
      if (authHeader !== expectedKey) {
        console.error('ERRO: Webhook key não confere!')
        console.error('Recebido:', authHeader)
        console.error('Esperado:', expectedKey)
        
        // Log do erro no banco
        await supabaseClient
          .from('webhook_logs')
          .insert({
            source: 'trainerai_whatsapp_n8n',
            event_type: 'authentication_error',
            payload: {
              error: 'Invalid webhook key',
              received_key: authHeader,
              headers: Object.fromEntries(req.headers.entries())
            },
            processed: false,
            error_message: 'Unauthorized - Invalid webhook key'
          })
        
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { 
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      console.log('✅ Autenticação OK - Processando body...')
      
      let body;
      let bodyText = '';
      
      try {
        bodyText = await req.text()
        console.log('Body RAW recebido:', bodyText)
        
        if (!bodyText.trim()) {
          throw new Error('Body vazio')
        }
        
        body = JSON.parse(bodyText)
        console.log('Body PARSED:', JSON.stringify(body, null, 2))
      } catch (parseError) {
        console.error('ERRO ao fazer parse do JSON:', parseError)
        
        // Log do erro de parsing
        await supabaseClient
          .from('webhook_logs')
          .insert({
            source: 'trainerai_whatsapp_n8n',
            event_type: 'parse_error',
            payload: {
              error: 'JSON parse failed',
              raw_body: bodyText,
              parse_error: parseError.message
            },
            processed: false,
            error_message: `JSON parse error: ${parseError.message}`
          })
        
        return new Response(
          JSON.stringify({ 
            error: 'Invalid JSON',
            details: parseError.message,
            received_body: bodyText
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      console.log('=== PROCESSANDO DADOS ===')
      
      // Processar dados com múltiplos fallbacks
      let messageData = body;
      
      // Se n8n enviar array, pegar primeiro item
      if (Array.isArray(body) && body.length > 0) {
        messageData = body[0];
        console.log('Detectado array, usando primeiro item:', messageData)
      }
      
      // Se tiver propriedade 'data', usar ela
      if (messageData.data) {
        messageData = messageData.data;
        console.log('Detectada propriedade data, usando:', messageData)
      }
      
      // Se tiver propriedade 'json', usar ela (comum no n8n)
      if (messageData.json) {
        messageData = messageData.json;
        console.log('Detectada propriedade json, usando:', messageData)
      }

      console.log('Dados finais para processamento:', JSON.stringify(messageData, null, 2))

      // Tentar extrair informações com múltiplos campos possíveis
      const extractField = (obj: any, possibleFields: string[]) => {
        for (const field of possibleFields) {
          if (obj && obj[field] !== undefined && obj[field] !== null && obj[field] !== '') {
            console.log(`Campo '${field}' encontrado:`, obj[field])
            return obj[field]
          }
        }
        console.log(`Nenhum dos campos ${possibleFields.join(', ')} encontrado em:`, obj)
        return null
      }

      const remoteJid = extractField(messageData, ['remoteJid', 'from', 'phone', 'number', 'jid', 'phoneNumber'])
      const message = extractField(messageData, ['message', 'content', 'text', 'body', 'msg', 'messageContent'])
      const type = extractField(messageData, ['type', 'messageType', 'msgType']) || 'text'
      const date_time = extractField(messageData, ['date_time', 'timestamp', 'time', 'datetime', 'createdAt']) || new Date().toISOString()

      console.log('=== CAMPOS EXTRAÍDOS ===')
      console.log('remoteJid:', remoteJid)
      console.log('message:', message)
      console.log('type:', type)
      console.log('date_time:', date_time)

      // Validar campos obrigatórios
      if (!remoteJid && !message) {
        console.error('ERRO: Campos obrigatórios não encontrados')
        console.error('Campos disponíveis no messageData:', Object.keys(messageData))
        
        await supabaseClient
          .from('webhook_logs')
          .insert({
            source: 'trainerai_whatsapp_n8n',
            event_type: 'validation_error',
            payload: {
              error: 'Missing required fields',
              available_fields: Object.keys(messageData),
              full_payload: body,
              processed_data: messageData
            },
            processed: false,
            error_message: 'Missing required fields: remoteJid/from/phone and message/content/text'
          })
        
        return new Response(
          JSON.stringify({ 
            error: 'Missing required fields: remoteJid/from/phone and message/content/text',
            received_fields: Object.keys(messageData),
            full_payload: body,
            processed_data: messageData
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Extrair número de telefone
      let phone = 'unknown'
      if (remoteJid) {
        phone = remoteJid.toString().replace('@whatsapp.net', '').replace('@s.whatsapp.net', '').replace('@c.us', '')
      }

      console.log('Phone extraído:', phone)
      console.log('=== SALVANDO NO BANCO ===')

      // Log detalhado do webhook
      const logData = {
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
          },
          debug_info: {
            headers: Object.fromEntries(req.headers.entries()),
            url_pathname: url.pathname,
            timestamp: new Date().toISOString(),
            body_type: Array.isArray(body) ? 'array' : typeof body,
            fields_found: Object.keys(messageData)
          }
        },
        processed: false
      }

      const { data: insertLogData, error: logError } = await supabaseClient
        .from('webhook_logs')
        .insert(logData)
        .select()

      if (logError) {
        console.error('ERRO ao salvar log:', logError)
      } else {
        console.log('✅ Log salvo:', insertLogData)
      }

      // Salvar na tabela ai_conversations se tiver mensagem
      let conversationData = null
      if (message) {
        console.log('Salvando conversa...')
        
        const { data: convData, error: conversationError } = await supabaseClient
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
              original_payload: messageData,
              debug_timestamp: new Date().toISOString()
            }
          })
          .select()

        if (conversationError) {
          console.error('ERRO ao salvar conversa:', conversationError)
        } else {
          console.log('✅ Conversa salva:', convData)
          conversationData = convData
        }
      }

      // Marcar webhook como processado
      if (insertLogData && insertLogData[0]) {
        await supabaseClient
          .from('webhook_logs')
          .update({ processed: true })
          .eq('id', insertLogData[0].id)
      }

      console.log('=== WEBHOOK PROCESSADO COM SUCESSO ===')
      
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
          message_type: type,
          webhook_log_id: insertLogData?.[0]?.id
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
        },
        debug_info: {
          original_payload_type: Array.isArray(body) ? 'array' : typeof body,
          fields_extracted: Object.keys(messageData),
          authentication: 'success'
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
    console.error('=== ERRO GERAL NO WEBHOOK ===')
    console.error('Error:', error)
    console.error('Stack:', error.stack)
    
    // Log de erro geral
    try {
      await supabaseClient
        .from('webhook_logs')
        .insert({
          source: 'trainerai_whatsapp_n8n',
          event_type: 'system_error',
          payload: {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
          },
          processed: false,
          error_message: `System error: ${error.message}`
        })
    } catch (logError) {
      console.error('Erro ao salvar log de erro:', logError)
    }
    
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
