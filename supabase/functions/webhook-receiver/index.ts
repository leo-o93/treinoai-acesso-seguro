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

      // Verificar se é uma mensagem MCP
      if (body.mcp_version && body.type && body.source) {
        console.log('=== MENSAGEM MCP DETECTADA ===')
        return await processMCPMessage(body, supabaseClient)
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

    // Handle MCP messages from frontend
    if (url.pathname.includes('/mcp') || (await req.json()).source === 'trainerai_frontend') {
      const body = await req.json()
      console.log('=== MENSAGEM MCP DO FRONTEND ===')
      return await processMCPMessage(body.data, supabaseClient)
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

// ===== FUNÇÕES AUXILIARES =====

// Função para categorizar mensagens do WhatsApp
function categorizeMessage(message: string): string {
  const lowerMessage = message.toLowerCase()
  
  // Palavras-chave para agenda/treino
  const agendaKeywords = ['agenda', 'treino', 'exercício', 'academia', 'corrida', 'amanhã', 'hoje', 'semana']
  
  // Palavras-chave para dieta/nutrição
  const dietaKeywords = ['dieta', 'comida', 'comer', 'refeição', 'café', 'almoço', 'jantar', 'lanche', 'alimentação']
  
  // Palavras-chave para Strava
  const stravaKeywords = ['strava', 'corrida', 'pace', 'km', 'quilômetros', 'atividade', 'exercício físico']
  
  // Verificar categoria
  if (agendaKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return 'agenda_treino'
  } else if (dietaKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return 'dieta_nutricao'
  } else if (stravaKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return 'strava_atividades'
  }
  
  return 'conversa_geral'
}

// Função para extrair eventos estruturados da resposta da IA
async function extractStructuredEvents(aiResponse: string, userId: string, supabaseClient: any): Promise<any[]> {
  const events: any[] = []
  
  try {
    // Buscar padrões de horário e eventos na resposta
    const eventPatterns = [
      /(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\s*(.+?)(?=\n|$)/g,
      /\*\*(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\*\*\s*(.+?)(?=\n|$)/g
    ]
    
    for (const pattern of eventPatterns) {
      let match
      while ((match = pattern.exec(aiResponse)) !== null) {
        const startTime = match[1]
        const endTime = match[2]
        const description = match[3].replace(/\*\*/g, '').trim()
        
        if (description.length > 5) { // Validar se a descrição não está vazia
          // Criar data para hoje + horário
          const today = new Date()
          const tomorrow = new Date(today)
          tomorrow.setDate(tomorrow.getDate() + 1)
          
          const [startHour, startMinute] = startTime.split(':')
          const [endHour, endMinute] = endTime.split(':')
          
          const startDateTime = new Date(tomorrow)
          startDateTime.setHours(parseInt(startHour), parseInt(startMinute), 0, 0)
          
          const endDateTime = new Date(tomorrow)
          endDateTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0)
          
          // Determinar tipo de evento
          let eventType = 'meal'
          if (description.toLowerCase().includes('treino') || description.toLowerCase().includes('exercício')) {
            eventType = 'workout'
          }
          
          const eventData = {
            user_id: userId,
            title: description.substring(0, 100), // Limitar título
            description: description,
            event_type: eventType,
            start_time: startDateTime.toISOString(),
            end_time: endDateTime.toISOString(),
            status: 'scheduled'
          }
          
          // Salvar no banco
          const { data: savedEvent, error } = await supabaseClient
            .from('calendar_events')
            .insert(eventData)
            .select()
            .single()
          
          if (!error && savedEvent) {
            events.push(savedEvent)
            console.log('Evento salvo:', savedEvent.title)
          } else {
            console.error('Erro ao salvar evento:', error)
          }
        }
      }
    }
  } catch (error) {
    console.error('Erro ao extrair eventos:', error)
  }
  
  return events
}

// Função para extrair atividades Strava da resposta da IA
async function extractStravaActivities(aiResponse: string, userId: string, supabaseClient: any): Promise<any[]> {
  const activities: any[] = []
  
  try {
    // Buscar padrões de atividades físicas
    const activityPatterns = [
      /corrida|correr|running/gi,
      /pace|ritmo/gi,
      /km|quilômetros|distância/gi,
      /treino|workout|exercício/gi
    ]
    
    const hasActivityMention = activityPatterns.some(pattern => pattern.test(aiResponse))
    
    if (hasActivityMention) {
      // Extrair métricas se disponíveis
      const distanceMatch = aiResponse.match(/(\d+(?:\.\d+)?)\s*km/i)
      const paceMatch = aiResponse.match(/(\d+:\d+)\s*(?:min\/km|pace)/i)
      const timeMatch = aiResponse.match(/(\d+)\s*min/i)
      
      if (distanceMatch || paceMatch || timeMatch) {
        const activityData = {
          user_id: userId,
          strava_activity_id: `extracted_${Date.now()}`,
          name: 'Atividade extraída da conversa',
          type: 'Run',
          start_date: new Date().toISOString(),
          distance: distanceMatch ? parseFloat(distanceMatch[1]) * 1000 : null, // Converter para metros
          moving_time: timeMatch ? parseInt(timeMatch[1]) * 60 : null, // Converter para segundos
          average_speed: null,
          calories: null
        }
        
        // Calcular pace se disponível
        if (paceMatch && distanceMatch) {
          const [minutes, seconds] = paceMatch[1].split(':')
          const paceInSeconds = parseInt(minutes) * 60 + parseInt(seconds)
          const distanceKm = parseFloat(distanceMatch[1])
          activityData.average_speed = distanceKm / (paceInSeconds / 60) // km/h
        }
        
        // Salvar no banco
        const { data: savedActivity, error } = await supabaseClient
          .from('strava_activities')
          .insert(activityData)
          .select()
          .single()
        
        if (!error && savedActivity) {
          activities.push(savedActivity)
          console.log('Atividade Strava salva:', savedActivity.name)
        } else {
          console.error('Erro ao salvar atividade Strava:', error)
        }
      }
    }
  } catch (error) {
    console.error('Erro ao extrair atividades Strava:', error)
  }
  
  return activities
}

// Nova função para processar mensagens MCP
async function processMCPMessage(mcpMessage: any, supabaseClient: any) {
  try {
    console.log('Processando mensagem MCP:', JSON.stringify(mcpMessage, null, 2))

    // Validar estrutura MCP
    if (!mcpMessage.mcp_version || !mcpMessage.type || !mcpMessage.session_id) {
      throw new Error('Estrutura MCP inválida: campos obrigatórios ausentes')
    }

    // Processar baseado no tipo de mensagem
    let processedData = null
    switch (mcpMessage.type) {
      case 'new_plan':
        processedData = await processMCPNewPlan(mcpMessage, supabaseClient)
        break
      case 'progress_update':
        processedData = await processMCPProgressUpdate(mcpMessage, supabaseClient)
        break
      case 'feedback_request':
        processedData = await processMCPFeedbackRequest(mcpMessage, supabaseClient)
        break
      case 'plan_adjustment':
        processedData = await processMCPPlanAdjustment(mcpMessage, supabaseClient)
        break
      case 'system_notification':
        processedData = await processMCPSystemNotification(mcpMessage, supabaseClient)
        break
      default:
        console.log('Tipo MCP não implementado:', mcpMessage.type)
        processedData = { message: 'Tipo de mensagem MCP recebido mas não processado' }
    }

    // Log da mensagem MCP
    await supabaseClient
      .from('webhook_logs')
      .insert({
        source: `mcp_${mcpMessage.source === 'trainerai-frontend' ? 'outbound' : 'inbound'}`,
        event_type: `mcp_${mcpMessage.type}`,
        payload: {
          mcp_message: mcpMessage,
          processed_data: processedData,
          processed_at: new Date().toISOString()
        },
        processed: true
      })

    return new Response(
      JSON.stringify({
        success: true,
        mcp_version: mcpMessage.mcp_version,
        type: mcpMessage.type,
        processed: true,
        data: processedData,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Erro ao processar mensagem MCP:', error)
    
    // Log do erro MCP
    await supabaseClient
      .from('webhook_logs')
      .insert({
        source: 'mcp_error',
        event_type: 'mcp_processing_error',
        payload: {
          mcp_message: mcpMessage,
          error: error.message,
          timestamp: new Date().toISOString()
        },
        processed: false,
        error_message: error.message
      })

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        mcp_version: mcpMessage.mcp_version || 'unknown',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

// Processadores específicos para tipos MCP
async function processMCPNewPlan(mcpMessage: any, supabaseClient: any) {
  console.log('Processando novo plano MCP:', mcpMessage.payload)
  
  const userId = await getUserIdFromSession(mcpMessage.session_id, supabaseClient)
  const payload = mcpMessage.payload

  let savedEvents = []

  // Processar plano de treino
  if (payload.workout && Array.isArray(payload.workout)) {
    for (const workout of payload.workout) {
      const { data: eventData } = await supabaseClient
        .from('calendar_events')
        .insert({
          user_id: userId,
          title: workout.summary,
          description: workout.description,
          event_type: 'workout',
          start_time: workout.date,
          end_time: new Date(new Date(workout.date).getTime() + (workout.duration_minutes || 60) * 60000).toISOString(),
          status: 'scheduled'
        })
        .select()
        .single()

      if (eventData) savedEvents.push(eventData)
    }
  }

  // Processar plano de dieta
  if (payload.diet && Array.isArray(payload.diet)) {
    for (const meal of payload.diet) {
      const { data: eventData } = await supabaseClient
        .from('calendar_events')
        .insert({
          user_id: userId,
          title: meal.summary,
          description: meal.description,
          event_type: 'meal',
          start_time: meal.date,
          end_time: new Date(new Date(meal.date).getTime() + 30 * 60000).toISOString(),
          status: 'scheduled'
        })
        .select()
        .single()

      if (eventData) savedEvents.push(eventData)
    }
  }

  return {
    message: 'Novo plano processado via MCP',
    events_created: savedEvents.length,
    user_id: userId
  }
}

async function processMCPProgressUpdate(mcpMessage: any, supabaseClient: any) {
  console.log('Processando atualização de progresso MCP:', mcpMessage.payload)
  
  const userId = await getUserIdFromSession(mcpMessage.session_id, supabaseClient)
  const payload = mcpMessage.payload

  // Marcar atividades como completadas
  if (payload.completed && Array.isArray(payload.completed)) {
    for (const completedActivity of payload.completed) {
      await supabaseClient
        .from('calendar_events')
        .update({ status: 'completed' })
        .eq('user_id', userId)
        .eq('start_time', completedActivity)
    }
  }

  // Salvar feedback se fornecido
  if (payload.feedback) {
    await supabaseClient
      .from('weekly_feedback')
      .insert({
        user_id: userId,
        week_start: new Date().toISOString().split('T')[0],
        feedback_text: payload.feedback,
        adherence_score: payload.rating || 5,
        energy_level: payload.rating || 5,
        difficulty_level: payload.rating || 5
      })
  }

  return {
    message: 'Progresso atualizado via MCP',
    completed_count: payload.completed?.length || 0,
    has_feedback: !!payload.feedback
  }
}

async function processMCPFeedbackRequest(mcpMessage: any, supabaseClient: any) {
  console.log('Processando solicitação de feedback MCP:', mcpMessage.payload)
  
  return {
    message: 'Solicitação de feedback processada via MCP',
    plan_type: mcpMessage.payload.plan_type,
    request_time: mcpMessage.payload.request_time
  }
}

async function processMCPPlanAdjustment(mcpMessage: any, supabaseClient: any) {
  console.log('Processando ajuste de plano MCP:', mcpMessage.payload)
  
  const userId = await getUserIdFromSession(mcpMessage.session_id, supabaseClient)
  const payload = mcpMessage.payload

  // Salvar ajustes solicitados
  if (payload.feedback) {
    await supabaseClient
      .from('weekly_feedback')
      .insert({
        user_id: userId,
        week_start: new Date().toISOString().split('T')[0],
        feedback_text: payload.feedback,
        plan_adjustments: payload.adjustments_requested?.join(', '),
        adherence_score: 5,
        energy_level: 5,
        difficulty_level: 5
      })
  }

  return {
    message: 'Ajuste de plano processado via MCP',
    adjustments: payload.adjustments_requested || [],
    user_id: userId
  }
}

async function processMCPSystemNotification(mcpMessage: any, supabaseClient: any) {
  console.log('Processando notificação do sistema MCP:', mcpMessage.payload)
  
  return {
    message: 'Notificação do sistema processada via MCP',
    notification: mcpMessage.payload
  }
}

async function getUserIdFromSession(sessionId: string, supabaseClient: any): Promise<string> {
  try {
    const phone = sessionId.replace('whatsapp_', '').replace('@c.us', '').replace('@s.whatsapp.net', '')
    
    const { data: profile } = await supabaseClient
      .from('user_profiles')
      .select('user_id')
      .eq('whatsapp_phone', phone)
      .single()

    return profile?.user_id || '48a7ab75-4bae-4b6b-8ae5-bce83d5ba595' // fallback
  } catch (error) {
    console.error('Erro ao buscar user_id:', error)
    return '48a7ab75-4bae-4b6b-8ae5-bce83d5ba595' // fallback
  }
}

async function processStravaData(supabaseClient: any, userId: string, data: any) {
  // Implementar processamento de dados Strava
  console.log('Processing Strava data for user:', userId, data)
}

async function processTrainingPlan(supabaseClient: any, userId: string, data: any) {
  // Implementar processamento de plano de treino
  console.log('Processing training plan for user:', userId, data)
}

async function processNutritionPlan(supabaseClient: any, userId: string, data: any) {
  // Implementar processamento de plano nutricional
  console.log('Processing nutrition plan for user:', userId, data)
}

async function processCalendarEvent(supabaseClient: any, userId: string, data: any) {
  // Implementar processamento de evento de calendário
  console.log('Processing calendar event for user:', userId, data)
}

async function processAIConversation(supabaseClient: any, userId: string, data: any) {
  // Implementar processamento de conversa com IA
  console.log('Processing AI conversation for user:', userId, data)
}

async function processUserProfile(supabaseClient: any, userId: string, data: any) {
  // Implementar processamento de perfil de usuário
  console.log('Processing user profile for user:', userId, data)
}
