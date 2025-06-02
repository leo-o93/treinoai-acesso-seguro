
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { message, remoteJid, instancia, conversation } = await req.json()

    console.log('=== PROCESSANDO MENSAGEM WHATSAPP ===')
    console.log('Message:', message)
    console.log('RemoteJid:', remoteJid)
    console.log('Instancia:', instancia)
    console.log('Conversation:', conversation)

    // Extrair número de telefone
    const phone = remoteJid.replace('@c.us', '').replace('@s.whatsapp.net', '')
    const sessionId = `whatsapp_${phone}`

    console.log('Phone extracted:', phone)
    console.log('Session ID:', sessionId)

    // Salvar mensagem do usuário
    const { data: conversationData, error: conversationError } = await supabaseClient
      .from('ai_conversations')
      .insert({
        session_id: sessionId,
        message_type: 'user',
        content: message,
        whatsapp_phone: phone,
        user_id: null,
        context: {
          source: 'whatsapp',
          remoteJid,
          instancia,
          conversation,
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

    // Buscar histórico de conversas para contexto
    const { data: historyData } = await supabaseClient
      .from('ai_conversations')
      .select('content, message_type, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(10)

    // Processar com IA (OpenAI)
    let aiResponse = "Obrigado pela mensagem! Sou o TrainerAI, seu assistente pessoal de treino e nutrição. Como posso ajudá-lo hoje?"

    if (Deno.env.get('OPENAI_API_KEY')) {
      try {
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: `Você é o TrainerAI, um assistente especializado em treinos e nutrição via WhatsApp. 
                Seja amigável, motivador e forneça conselhos práticos sobre exercícios, alimentação e bem-estar.
                Mantenha as respostas concisas e adequadas para WhatsApp (máximo 200 caracteres quando possível).
                Sempre incentive hábitos saudáveis e consultas com profissionais quando necessário.`
              },
              ...historyData?.slice(0, 5).reverse().map(h => ({
                role: h.message_type === 'user' ? 'user' : 'assistant',
                content: h.content
              })) || [],
              {
                role: 'user',
                content: message
              }
            ],
            max_tokens: 200,
            temperature: 0.7
          })
        })

        if (openaiResponse.ok) {
          const openaiData = await openaiResponse.json()
          aiResponse = openaiData.choices[0]?.message?.content || aiResponse
          console.log('Resposta da OpenAI:', aiResponse)
        } else {
          console.error('Erro na OpenAI:', await openaiResponse.text())
        }
      } catch (openaiError) {
        console.error('Erro ao processar com OpenAI:', openaiError)
      }
    } else {
      console.log('OPENAI_API_KEY não configurada, usando resposta padrão')
    }

    // Salvar resposta da IA
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
      throw responseError
    }

    // Marcar conversa como respondida
    await supabaseClient
      .from('ai_conversations')
      .update({ 
        response_status: 'responded',
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationData.id)

    console.log('Resposta da IA salva:', responseData)

    // Retornar resposta estruturada para o n8n
    const response = {
      success: true,
      phone: phone,
      message: aiResponse,
      conversation_id: conversationData.id,
      response_id: responseData.id,
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

  } catch (error) {
    console.error('Erro no processamento:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
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
