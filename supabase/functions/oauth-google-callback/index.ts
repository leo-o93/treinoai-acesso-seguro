
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
    console.log('Code:', code ? 'presente' : 'ausente')
    console.log('State (user_id):', state)
    console.log('Error:', error)

    if (error) {
      console.error('Erro do Google OAuth:', error)
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `/integracoes?error=${encodeURIComponent(error)}`
        }
      })
    }

    if (!code || !state) {
      console.error('Code ou state ausente')
      return new Response(null, {
        status: 302,
        headers: {
          'Location': '/integracoes?error=invalid_callback'
        }
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Trocar o code por tokens com URL corrigida
    const baseUrl = req.url.includes('localhost') ? 'http://localhost:54321' : 'https://shhkccidqvvrwgxlyvqq.supabase.co'
    const redirectUri = `${baseUrl}/functions/v1/oauth-google-callback`
    
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: '948364531614-k0u8vg4k72v7s6hb4dqriqb0tec5qksl.apps.googleusercontent.com',
        client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '',
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok) {
      console.error('Erro ao trocar code por token:', tokenData)
      return new Response(null, {
        status: 302,
        headers: {
          'Location': '/integracoes?error=token_exchange_failed'
        }
      })
    }

    console.log('Tokens obtidos com sucesso')

    // Calcular data de expiração
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000))

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

    console.log('Integração Google salva com sucesso')

    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/integracoes?success=google_connected'
      }
    })
  } catch (error) {
    console.error('Erro no oauth-google-callback:', error)
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/integracoes?error=internal_error'
      }
    })
  }
})
