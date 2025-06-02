
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
    console.log('=== INICIANDO OAUTH GOOGLE ===')
    console.log('Timestamp:', new Date().toISOString())
    console.log('Request URL:', req.url)
    console.log('Request method:', req.method)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('Authorization header missing')
      return new Response(
        JSON.stringify({ error: 'Authorization header missing' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (userError || !user) {
      console.error('Invalid user:', userError)
      return new Response(
        JSON.stringify({ error: 'Invalid user' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('User authenticated:', user.id)

    // Verificar se GOOGLE_CLIENT_SECRET está configurado
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')
    if (!clientSecret) {
      console.error('GOOGLE_CLIENT_SECRET not configured')
      return new Response(
        JSON.stringify({ error: 'Google OAuth not properly configured. Please contact support.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Configurações do Google OAuth
    const clientId = '948364531614-k0u8vg4k72v7s6hb4dqriqb0tec5qksl.apps.googleusercontent.com'
    const redirectUri = 'https://shhkccidqvvrwgxlyvqq.supabase.co/functions/v1/oauth-google-callback'
    const scope = 'https://www.googleapis.com/auth/calendar'
    const state = user.id

    console.log('=== CONFIGURAÇÕES OAUTH ===')
    console.log('Client ID:', clientId)
    console.log('Redirect URI:', redirectUri)
    console.log('Scope:', scope)
    console.log('State (User ID):', state)

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', scope)
    authUrl.searchParams.set('access_type', 'offline')
    authUrl.searchParams.set('prompt', 'consent')
    authUrl.searchParams.set('state', state)

    console.log('Auth URL gerada:', authUrl.toString())

    return new Response(
      JSON.stringify({ 
        authUrl: authUrl.toString(),
        debug: {
          clientId,
          redirectUri,
          scope,
          state
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Erro no oauth-google-start:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
