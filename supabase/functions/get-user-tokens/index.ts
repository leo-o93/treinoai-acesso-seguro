
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
    const userId = url.searchParams.get('user_id')
    const provider = url.searchParams.get('provider')

    console.log('=== GET USER TOKENS ===')
    console.log('User ID:', userId)
    console.log('Provider:', provider)

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'user_id parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let query = supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', userId)

    if (provider) {
      query = query.eq('provider', provider)
    }

    const { data: integrations, error } = await query

    if (error) {
      console.error('Erro ao buscar integrações:', error)
      return new Response(
        JSON.stringify({ error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar e refresh tokens expirados se necessário
    const refreshedIntegrations = []

    for (const integration of integrations || []) {
      let currentIntegration = integration

      // Verificar se o token está expirado
      if (integration.expires_at && new Date(integration.expires_at) < new Date()) {
        console.log(`Token expirado para ${integration.provider}, tentando refresh...`)
        
        try {
          if (integration.provider === 'google' && integration.refresh_token) {
            const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                client_id: '948364531614-k0u8vg4k72v7s6hb4dqriqb0tec5qksl.apps.googleusercontent.com',
                client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '',
                refresh_token: integration.refresh_token,
                grant_type: 'refresh_token',
              }),
            })

            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json()
              const newExpiresAt = new Date(Date.now() + (refreshData.expires_in * 1000))

              const { error: updateError } = await supabase
                .from('user_integrations')
                .update({
                  access_token: refreshData.access_token,
                  expires_at: newExpiresAt.toISOString(),
                  updated_at: new Date().toISOString()
                })
                .eq('id', integration.id)

              if (!updateError) {
                currentIntegration = {
                  ...integration,
                  access_token: refreshData.access_token,
                  expires_at: newExpiresAt.toISOString()
                }
                console.log('Token Google refreshed com sucesso')
              }
            }
          } else if (integration.provider === 'strava' && integration.refresh_token) {
            const refreshResponse = await fetch('https://www.strava.com/oauth/token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                client_id: '133623',
                client_secret: Deno.env.get('STRAVA_CLIENT_SECRET') ?? '',
                refresh_token: integration.refresh_token,
                grant_type: 'refresh_token',
              }),
            })

            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json()
              const newExpiresAt = new Date(refreshData.expires_at * 1000)

              const { error: updateError } = await supabase
                .from('user_integrations')
                .update({
                  access_token: refreshData.access_token,
                  refresh_token: refreshData.refresh_token,
                  expires_at: newExpiresAt.toISOString(),
                  updated_at: new Date().toISOString()
                })
                .eq('id', integration.id)

              if (!updateError) {
                currentIntegration = {
                  ...integration,
                  access_token: refreshData.access_token,
                  refresh_token: refreshData.refresh_token,
                  expires_at: newExpiresAt.toISOString()
                }
                console.log('Token Strava refreshed com sucesso')
              }
            }
          }
        } catch (refreshError) {
          console.error(`Erro ao fazer refresh do token ${integration.provider}:`, refreshError)
        }
      }

      refreshedIntegrations.push(currentIntegration)
    }

    // Remover campos sensíveis se necessário (opcional)
    const safeIntegrations = refreshedIntegrations.map(integration => ({
      id: integration.id,
      user_id: integration.user_id,
      provider: integration.provider,
      access_token: integration.access_token, // Necessário para as APIs
      expires_at: integration.expires_at,
      athlete_id: integration.athlete_id,
      scope: integration.scope,
      created_at: integration.created_at,
      updated_at: integration.updated_at
    }))

    return new Response(
      JSON.stringify(safeIntegrations),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Erro no get-user-tokens:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
