
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { sessionId, message, conversationId } = await req.json()

    console.log('=== SEND RESPONSE FUNCTION ===')
    console.log('Session ID:', sessionId)
    console.log('Message:', message)
    console.log('Conversation ID:', conversationId)

    // Validar dados
    if (!sessionId || !message || !conversationId) {
      console.error('Dados inválidos:', { sessionId, message, conversationId })
      return new Response(
        JSON.stringify({ error: 'sessionId, message e conversationId são obrigatórios' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Inicializar Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Configuração Supabase faltando')
      return new Response(
        JSON.stringify({ error: 'Configuração do servidor incompleta' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Extrair número do WhatsApp do sessionId
    const phoneNumber = sessionId.replace('whatsapp_', '').replace('@c.us', '')
    
    console.log('Phone number extracted:', phoneNumber)

    // Preparar payload para n8n
    const n8nPayload = {
      phone: phoneNumber,
      message: message,
      sessionId: sessionId,
      conversationId: conversationId,
      timestamp: new Date().toISOString()
    }

    console.log('N8N Payload:', n8nPayload)

    // Enviar para n8n (substitua pela URL real do seu webhook n8n)
    const n8nWebhookUrl = Deno.env.get('N8N_SEND_MESSAGE_WEBHOOK_URL')
    
    if (!n8nWebhookUrl) {
      console.warn('N8N_SEND_MESSAGE_WEBHOOK_URL não configurada, simulando envio...')
      
      // Simular sucesso para teste
      await supabase
        .from('ai_responses')
        .update({ 
          delivery_status: 'delivered',
          delivery_attempts: 1,
          last_attempt_at: new Date().toISOString()
        })
        .eq('conversation_id', conversationId)
        .eq('session_id', sessionId)

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Resposta processada (modo simulação)',
          phoneNumber 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Enviar para n8n
    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(n8nPayload)
    })

    console.log('N8N Response status:', n8nResponse.status)

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text()
      console.error('Erro ao enviar para n8n:', errorText)
      
      // Atualizar status de erro
      await supabase
        .from('ai_responses')
        .update({ 
          delivery_status: 'failed',
          delivery_attempts: 1,
          last_attempt_at: new Date().toISOString(),
          error_message: `N8N Error: ${n8nResponse.status} - ${errorText}`
        })
        .eq('conversation_id', conversationId)
        .eq('session_id', sessionId)

      return new Response(
        JSON.stringify({ 
          error: 'Falha ao enviar via n8n', 
          details: errorText 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Sucesso - atualizar status
    await supabase
      .from('ai_responses')
      .update({ 
        delivery_status: 'delivered',
        delivery_attempts: 1,
        last_attempt_at: new Date().toISOString()
      })
      .eq('conversation_id', conversationId)
      .eq('session_id', sessionId)

    console.log('Resposta enviada com sucesso via n8n')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Resposta enviada com sucesso',
        phoneNumber 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Erro na function send-response:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
