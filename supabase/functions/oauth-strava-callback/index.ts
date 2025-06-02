
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

    console.log('=== CALLBACK STRAVA OAUTH ===')
    console.log('Code:', code ? 'presente' : 'ausente')
    console.log('State (user_id):', state)
    console.log('Error:', error)

    if (error) {
      console.error('Erro do Strava OAuth:', error)
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

    // Trocar o code por tokens
    const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: '133623',
        client_secret: Deno.env.get('STRAVA_CLIENT_SECRET') ?? '',
        code,
        grant_type: 'authorization_code',
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
    console.log('Athlete ID:', tokenData.athlete?.id)

    // Calcular data de expiração
    const expiresAt = new Date(tokenData.expires_at * 1000)

    // Salvar integração no banco
    const { error: dbError } = await supabase
      .from('user_integrations')
      .upsert({
        user_id: state,
        provider: 'strava',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: expiresAt.toISOString(),
        athlete_id: tokenData.athlete?.id?.toString(),
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

    console.log('Integração Strava salva com sucesso')

    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/integracoes?success=strava_connected'
      }
    })
  } catch (error) {
    console.error('Erro no oauth-strava-callback:', error)
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/integracoes?error=internal_error'
      }
    })
  }
})
