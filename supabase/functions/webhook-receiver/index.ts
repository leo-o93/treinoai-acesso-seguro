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
      console.log('=== WEBHOOK TRAINERAI RECEBIDO ===')
      
      let body;
      try {
        const bodyText = await req.text()
        console.log('Body RAW:', bodyText)
        
        if (!bodyText.trim()) {
          throw new Error('Body vazio recebido')
        }
        
        body = JSON.parse(bodyText)
        console.log('Body PARSED:', JSON.stringify(body, null, 2))
      } catch (parseError) {
        console.error('ERRO ao fazer parse do JSON:', parseError)
        
        await supabaseClient
          .from('webhook_logs')
          .insert({
            source: 'trainerai_whatsapp_n8n',
            event_type: 'parse_error',
            payload: {
              error: 'JSON parse failed',
              parse_error: parseError.message,
              url_pathname: url.pathname
            },
            processed: false,
            error_message: `JSON parse error: ${parseError.message}`
          })
        
        return new Response(
          JSON.stringify({ 
            error: 'Invalid JSON',
            details: parseError.message
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Extrair dados das mensagens
      const userMessage = body.userMessage || body.message
      const aiResponse = body.aiResponse || body.response || body.conversation
      const remoteJid = body.remoteJid
      const instancia = body.instancia

      console.log('=== DADOS EXTRAÍDOS ===')
      console.log('User Message:', userMessage)
      console.log('AI Response:', aiResponse)
      console.log('RemoteJid:', remoteJid)
      console.log('Instancia:', instancia)

      // Validar campos obrigatórios
      if (!userMessage || !remoteJid) {
        console.error('Campos obrigatórios ausentes')
        return new Response(
          JSON.stringify({ 
            error: 'Missing required fields: userMessage and remoteJid',
            received: { userMessage: !!userMessage, remoteJid: !!remoteJid }
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Extrair telefone e categorizar mensagem
      const phone = remoteJid.replace('@c.us', '').replace('@s.whatsapp.net', '')
      const sessionId = `whatsapp_${phone}`
      
      // Categorizar tipo de pergunta baseado no conteúdo
      const messageCategory = categorizeMessage(userMessage)
      
      console.log('Phone extracted:', phone)
      console.log('Session ID:', sessionId)
      console.log('Message Category:', messageCategory)

      // Buscar user_id baseado no telefone do WhatsApp
      let userId = null
      try {
        console.log('=== BUSCANDO USUÁRIO POR TELEFONE ===')
        const { data: userProfile, error: userError } = await supabaseClient
          .from('user_profiles')
          .select('user_id')
          .eq('whatsapp_phone', phone)
          .maybeSingle()

        if (userError) {
          console.error('Erro ao buscar usuário por telefone:', userError)
        } else if (userProfile) {
          userId = userProfile.user_id
          console.log('Usuário encontrado:', userId)
        } else {
          console.log('Usuário não encontrado para telefone:', phone)
          // Usar fallback user_id para desenvolvimento/teste
          userId = '48a7ab75-4bae-4b6b-8ae5-bce83d5ba595'
          console.log('Usando fallback user_id:', userId)
          
          // Tentar atualizar o perfil com o telefone
          try {
            await supabaseClient
              .from('user_profiles')
              .update({ whatsapp_phone: phone })
              .eq('user_id', userId)
            console.log('Telefone WhatsApp atualizado no perfil do usuário')
          } catch (updateError) {
            console.error('Erro ao atualizar telefone no perfil:', updateError)
          }
        }
      } catch (error) {
        console.error('Erro ao buscar user_id:', error)
        // Usar fallback user_id para desenvolvimento/teste
        userId = '48a7ab75-4bae-4b6b-8ae5-bce83d5ba595'
        console.log('Usando fallback user_id devido ao erro:', userId)
      }

      // Inicializar variáveis para dados extraídos
      let extractedEvents = []
      let extractedActivities = []

      // Salvar mensagem do usuário
      const { data: conversationData, error: conversationError } = await supabaseClient
        .from('ai_conversations')
        .insert({
          session_id: sessionId,
          message_type: 'user',
          content: userMessage,
          whatsapp_phone: phone,
          user_id: userId,
          context: {
            source: 'whatsapp',
            remoteJid,
            instancia,
            category: messageCategory,
            ai_response: aiResponse,
            processed_at: new Date().toISOString()
          }
        })
        .select()
        .single()

      if (conversationError) {
        console.error('Erro ao salvar conversa:', conversationError)
        throw conversationError
      }

      console.log('Conversa salva:', conversationData)

      // Salvar resposta da IA se fornecida
      if (aiResponse) {
        // Tentar extrair eventos estruturados da resposta da IA
        if (userId) {
          try {
            extractedEvents = await extractStructuredEvents(aiResponse, userId, supabaseClient)
            console.log('Eventos extraídos:', extractedEvents.length)
          } catch (eventError) {
            console.error('Erro ao extrair eventos:', eventError)
          }

          // NOVO: Tentar extrair atividades do Strava da resposta da IA
          try {
            extractedActivities = await extractStravaActivities(aiResponse, userId, supabaseClient)
            console.log('Atividades Strava extraídas:', extractedActivities.length)
          } catch (activityError) {
            console.error('Erro ao extrair atividades Strava:', activityError)
          }
        }

        const { data: responseData, error: responseError } = await supabaseClient
          .from('ai_responses')
          .insert({
            session_id: sessionId,
            conversation_id: conversationData.id,
            response: aiResponse,
            operator_id: null
          })
          .select()
          .single()

        if (responseError) {
          console.error('Erro ao salvar resposta:', responseError)
        } else {
          console.log('Resposta da IA salva:', responseData)
          
          // Marcar conversa como respondida
          await supabaseClient
            .from('ai_conversations')
            .update({ 
              response_status: 'responded',
              updated_at: new Date().toISOString()
            })
            .eq('id', conversationData.id)
        }
      }

      // Log do webhook
      await supabaseClient
        .from('webhook_logs')
        .insert({
          source: 'trainerai_whatsapp_n8n',
          event_type: 'message_processed',
          payload: {
            userMessage,
            aiResponse,
            remoteJid,
            instancia,
            phone,
            category: messageCategory,
            userId,
            extractedEventsCount: extractedEvents?.length || 0,
            extractedActivitiesCount: extractedActivities?.length || 0,
            processed_at: new Date().toISOString()
          },
          processed: true,
          user_id: userId
        })

      // Retornar resposta de sucesso
      const response = {
        success: true,
        phone: phone,
        conversation_id: conversationData.id,
        category: messageCategory,
        user_id: userId,
        extracted_events: extractedEvents?.length || 0,
        extracted_activities: extractedActivities?.length || 0,
        timestamp: new Date().toISOString()
      }

      console.log('Resposta final:', response)

      return new Response(
        JSON.stringify(response),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Handle existing webhook functionality for other routes
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
    
    // Log de erro geral
    try {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )
      
      const url = new URL(req.url)
      const source = url.pathname.endsWith('/trainerai') ? 'trainerai_whatsapp_n8n' : 'webhook_general_error'
      
      await supabaseClient
        .from('webhook_logs')
        .insert({
          source: source,
          event_type: 'system_error',
          payload: {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            url_pathname: url.pathname
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
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// NOVA FUNÇÃO: Extrair atividades do Strava da resposta da IA
async function extractStravaActivities(aiResponse: string, userId: string, supabaseClient: any) {
  const activities = []
  
  console.log('=== INICIANDO EXTRAÇÃO DE ATIVIDADES STRAVA ===')
  console.log('AI Response length:', aiResponse.length)
  
  // Regex patterns para extrair atividades do Strava das respostas da IA
  const activityPattern = /\d+\.\s\*\*(.*?)\*\*\s*\n\s*-\s\*\*Data:\*\*\s(.*?)\n\s*-\s\*\*Distância:\*\*\s(.*?)\s*km\s*\n\s*-\s\*\*Tempo em Movimento:\*\*\s(.*?)\n\s*-\s\*\*Ganho de Elevação:\*\*\s(.*?)\s*m/g
  
  let match
  let matchCount = 0
  while ((match = activityPattern.exec(aiResponse)) !== null) {
    matchCount++
    const [, name, dateStr, distanceStr, timeStr, elevationStr] = match
    
    console.log(`Atividade ${matchCount} encontrada:`, { name, dateStr, distanceStr, timeStr, elevationStr })
    
    try {
      // Parse da data
      const startDate = parsePortugueseDate(dateStr.trim())
      
      // Parse da distância (remover vírgulas e converter para metros)
      const distance = parseFloat(distanceStr.replace(',', '.')) * 1000
      
      // Parse do tempo (converter para segundos)
      const movingTime = parsePortugueseTime(timeStr.trim())
      
      // Parse da elevação
      const totalElevationGain = parseFloat(elevationStr.replace(',', '.'))
      
      // Gerar ID único para a atividade baseado nos dados
      const stravaActivityId = `extracted_${Date.now()}_${matchCount}`
      
      const activityData = {
        user_id: userId,
        strava_activity_id: stravaActivityId,
        name: name.trim(),
        type: 'Run', // Assumir corrida por padrão
        distance: distance,
        moving_time: movingTime,
        elapsed_time: movingTime,
        total_elevation_gain: totalElevationGain,
        start_date: startDate.toISOString(),
        achievement_count: 0,
        kudos_count: 0
      }
      
      console.log('Dados da atividade para salvar:', activityData)
      
      const { data: savedActivity, error } = await supabaseClient
        .from('strava_activities')
        .upsert(activityData, { onConflict: 'strava_activity_id' })
        .select()
        .single()
      
      if (error) {
        console.error('Erro ao salvar atividade:', error)
      } else {
        console.log('Atividade salva com sucesso:', savedActivity)
        activities.push(savedActivity)
      }
    } catch (error) {
      console.error('Erro ao processar atividade:', error)
    }
  }
  
  console.log(`=== EXTRAÇÃO DE ATIVIDADES COMPLETA: ${activities.length} atividades salvas ===`)
  return activities
}

// Função auxiliar para converter data em português para Date
function parsePortugueseDate(dateStr: string): Date {
  // Ex: "31 de Maio de 2025"
  const months = {
    'janeiro': 0, 'fevereiro': 1, 'março': 2, 'abril': 3,
    'maio': 4, 'junho': 5, 'julho': 6, 'agosto': 7,
    'setembro': 8, 'outubro': 9, 'novembro': 10, 'dezembro': 11
  }
  
  const match = dateStr.match(/(\d+)\s+de\s+(\w+)\s+de\s+(\d+)/)
  if (match) {
    const day = parseInt(match[1])
    const month = months[match[2].toLowerCase()]
    const year = parseInt(match[3])
    return new Date(year, month, day)
  }
  
  // Fallback para hoje
  return new Date()
}

// Função auxiliar para converter tempo em português para segundos
function parsePortugueseTime(timeStr: string): number {
  // Ex: "1h 14m 39s" ou "54m 44s"
  let totalSeconds = 0
  
  const hourMatch = timeStr.match(/(\d+)h/)
  if (hourMatch) {
    totalSeconds += parseInt(hourMatch[1]) * 3600
  }
  
  const minMatch = timeStr.match(/(\d+)m/)
  if (minMatch) {
    totalSeconds += parseInt(minMatch[1]) * 60
  }
  
  const secMatch = timeStr.match(/(\d+)s/)
  if (secMatch) {
    totalSeconds += parseInt(secMatch[1])
  }
  
  return totalSeconds
}

// Função para extrair eventos estruturados da resposta da IA
async function extractStructuredEvents(aiResponse: string, userId: string, supabaseClient: any) {
  const events = []
  
  console.log('=== INICIANDO EXTRAÇÃO DE EVENTOS ===')
  console.log('AI Response length:', aiResponse.length)
  
  // Regex patterns para extrair eventos estruturados
  const eventPattern = /\d+\.\s\*\*(.*?)\*\*\s*\n\s*-\s\*\*Horário:\*\*\s(.*?)\n\s*-\s\*\*Descrição:\*\*(.*?)(?:\n\s*-\s\[Link do Evento\]\((.*?)\))?/g
  
  let match
  let matchCount = 0
  while ((match = eventPattern.exec(aiResponse)) !== null) {
    matchCount++
    const [, title, timeRange, description, eventLink] = match
    
    console.log(`Evento ${matchCount} encontrado:`, { title, timeRange, description, eventLink })
    
    // Parse do horário
    const timeMatch = timeRange.match(/(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})/)
    if (!timeMatch) {
      console.log('Não foi possível fazer parse do horário:', timeRange)
      continue
    }
    
    const [, startHour, startMin, endHour, endMin] = timeMatch
    
    // Criar datas para hoje (ou próximo dia baseado no contexto)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    
    // Determinar se é para hoje ou amanhã baseado no contexto
    const targetDate = aiResponse.includes('amanhã') || aiResponse.includes('terça') ? tomorrow : today
    
    const startTime = new Date(targetDate)
    startTime.setHours(parseInt(startHour), parseInt(startMin), 0, 0)
    
    const endTime = new Date(targetDate)
    endTime.setHours(parseInt(endHour), parseInt(endMin), 0, 0)
    
    // Determinar tipo do evento
    const eventType = categorizeEventType(title.trim(), description.trim())
    
    const eventData = {
      user_id: userId,
      title: title.trim(),
      description: description.trim(),
      event_type: eventType,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      status: 'scheduled',
      google_event_id: extractEventIdFromLink(eventLink)
    }
    
    console.log('Dados do evento para salvar:', eventData)
    
    try {
      const { data: savedEvent, error } = await supabaseClient
        .from('calendar_events')
        .insert(eventData)
        .select()
        .single()
      
      if (error) {
        console.error('Erro ao salvar evento:', error)
      } else {
        console.log('Evento salvo com sucesso:', savedEvent)
        events.push(savedEvent)
      }
    } catch (error) {
      console.error('Erro ao processar evento:', error)
    }
  }
  
  console.log(`=== EXTRAÇÃO COMPLETA: ${events.length} eventos salvos ===`)
  return events
}

// Função para categorizar tipo de evento
function categorizeEventType(title: string, description: string): string {
  const titleLower = title.toLowerCase()
  const descLower = description.toLowerCase()
  
  // Detectar treinos
  if (titleLower.includes('treino') || 
      descLower.includes('agachamento') || 
      descLower.includes('flexão') || 
      descLower.includes('remada') ||
      descLower.includes('exerc') ||
      descLower.includes('academia')) {
    return 'workout'
  }
  
  // Detectar refeições
  if (titleLower.includes('café') || 
      titleLower.includes('almoço') || 
      titleLower.includes('jantar') || 
      titleLower.includes('lanche') ||
      titleLower.includes('ceia') ||
      descLower.includes('carne') ||
      descLower.includes('arroz') ||
      descLower.includes('fruta')) {
    return 'meal'
  }
  
  return 'general'
}

// Função para extrair ID do evento do Google Calendar
function extractEventIdFromLink(eventLink: string): string | null {
  if (!eventLink) return null
  
  const match = eventLink.match(/eid=([^&\s]+)/)
  return match ? match[1] : null
}

// Função para categorizar mensagens
function categorizeMessage(message: string): string {
  const lowerMessage = message.toLowerCase()
  
  if (lowerMessage.includes('treino') || lowerMessage.includes('exerc') || lowerMessage.includes('academia')) {
    return 'treino'
  }
  
  if (lowerMessage.includes('dieta') || lowerMessage.includes('alimenta') || lowerMessage.includes('nutri') || lowerMessage.includes('comida')) {
    return 'nutricao'
  }
  
  if (lowerMessage.includes('agenda') || lowerMessage.includes('horario') || lowerMessage.includes('quando') || lowerMessage.includes('calendario')) {
    return 'agendamento'
  }
  
  if (lowerMessage.includes('strava') || lowerMessage.includes('atividade') || lowerMessage.includes('corrida') || lowerMessage.includes('performance')) {
    return 'strava'
  }
  
  return 'geral'
}

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
      whatsapp_phone: data.whatsapp_phone,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    })

  if (error) throw error
}
