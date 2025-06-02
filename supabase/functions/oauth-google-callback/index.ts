
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
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state') // user_id
    const error = url.searchParams.get('error')

    console.log('=== CALLBACK GOOGLE OAUTH ===')
    console.log('Timestamp:', new Date().toISOString())
    console.log('Code presente:', !!code)
    console.log('State (user_id):', state)
    console.log('Error:', error)
    console.log('URL completa:', req.url)

    if (error) {
      console.error('Erro do Google OAuth:', error)
      const errorDetails = url.searchParams.get('error_description') || ''
      console.error('Descrição do erro:', errorDetails)
      
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `/integracoes?error=${encodeURIComponent(error)}&details=${encodeURIComponent(errorDetails)}`
        }
      })
    }

    if (!code || !state) {
      console.error('Code ou state ausente - Code:', !!code, 'State:', !!state)
      return new Response(null, {
        status: 302,
        headers: {
          'Location': '/integracoes?error=invalid_callback'
        }
      })
    }

    // Verificar se GOOGLE_CLIENT_SECRET está configurado
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')
    if (!clientSecret) {
      console.error('GOOGLE_CLIENT_SECRET not configured')
      return new Response(null, {
        status: 302,
        headers: {
          'Location': '/integracoes?error=configuration_error'
        }
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Configurações para troca de tokens
    const clientId = '948364531614-k0u8vg4k72v7s6hb4dqriqb0tec5qksl.apps.googleusercontent.com'
    const redirectUri = 'https://shhkccidqvvrwgxlyvqq.supabase.co/functions/v1/oauth-google-callback'

    console.log('=== TROCANDO CODE POR TOKENS ===')
    console.log('Client ID:', clientId)
    console.log('Redirect URI:', redirectUri)
    
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok) {
      console.error('Erro ao trocar code por token:', tokenData)
      console.error('Status:', tokenResponse.status)
      console.error('Response headers:', Object.fromEntries(tokenResponse.headers.entries()))
      
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `/integracoes?error=token_exchange_failed&details=${encodeURIComponent(tokenData.error_description || tokenData.error || 'Unknown error')}`
        }
      })
    }

    console.log('=== TOKENS OBTIDOS COM SUCESSO ===')
    console.log('Access token presente:', !!tokenData.access_token)
    console.log('Refresh token presente:', !!tokenData.refresh_token)
    console.log('Expires in:', tokenData.expires_in)
    console.log('Scope:', tokenData.scope)

    // Calcular data de expiração
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000))

    console.log('=== SALVANDO INTEGRAÇÃO NO BANCO ===')
    console.log('User ID:', state)
    console.log('Expires at:', expiresAt.toISOString())

    // Salvar integração no banco
    const { error: dbError } = await supabase
      .from('user_integrations')
      .upsert({
        user_id: state,
        provider: 'google',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: expiresAt.toISOString(),
        scope: tokenData.scope,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,provider'
      })

    if (dbError) {
      console.error('Erro ao salvar integração:', dbError)
      return new Response(null, {
        status: 302,
        headers: {
          'Location': '/integracoes?error=database_error'
        }
      })
    }

    console.log('=== INTEGRAÇÃO GOOGLE SALVA COM SUCESSO ===')

    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/integracoes?success=google_connected'
      }
    })
  } catch (error) {
    console.error('=== ERRO GERAL NO CALLBACK ===')
    console.error('Error:', error)
    console.error('Stack trace:', error.stack)
    
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/integracoes?error=internal_error'
      }
    })
  }
})
