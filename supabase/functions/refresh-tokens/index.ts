
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
    console.log('=== REFRESH TOKENS ===')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Buscar tokens que expiram em até 1 hora
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    
    const { data: expiredIntegrations, error } = await supabase
      .from('user_integrations')
      .select('*')
      .lt('expires_at', oneHourFromNow)
      .not('refresh_token', 'is', null)

    if (error) {
      console.error('Erro ao buscar tokens expirados:', error)
      return new Response(
        JSON.stringify({ error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const refreshResults = []

    for (const integration of expiredIntegrations || []) {
      console.log(`Tentando refresh do token ${integration.provider} para usuário ${integration.user_id}`)
      
      try {
        if (integration.provider === 'google') {
          const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              client_id: '852850023522-rol2lqofflhmr4chdem3drtga8ahvm78.apps.googleusercontent.com',
              client_secret: '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',
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
              refreshResults.push({
                integration_id: integration.id,
                provider: integration.provider,
                status: 'success',
                new_expires_at: newExpiresAt.toISOString()
              })
              console.log(`Token Google refreshed com sucesso para ${integration.user_id}`)
            } else {
              refreshResults.push({
                integration_id: integration.id,
                provider: integration.provider,
                status: 'database_error',
                error: updateError.message
              })
            }
          } else {
            const errorData = await refreshResponse.json()
            refreshResults.push({
              integration_id: integration.id,
              provider: integration.provider,
              status: 'refresh_failed',
              error: errorData.error_description || errorData.error
            })
          }
        } else if (integration.provider === 'strava') {
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
              refreshResults.push({
                integration_id: integration.id,
                provider: integration.provider,
                status: 'success',
                new_expires_at: newExpiresAt.toISOString()
              })
              console.log(`Token Strava refreshed com sucesso para ${integration.user_id}`)
            } else {
              refreshResults.push({
                integration_id: integration.id,
                provider: integration.provider,
                status: 'database_error',
                error: updateError.message
              })
            }
          } else {
            const errorData = await refreshResponse.json()
            refreshResults.push({
              integration_id: integration.id,
              provider: integration.provider,
              status: 'refresh_failed',
              error: errorData.error_description || errorData.error
            })
          }
        }
      } catch (refreshError) {
        console.error(`Erro ao fazer refresh do token ${integration.provider}:`, refreshError)
        refreshResults.push({
          integration_id: integration.id,
          provider: integration.provider,
          status: 'error',
          error: refreshError.message
        })
      }
    }

    return new Response(
      JSON.stringify({
        message: `Processados ${expiredIntegrations?.length || 0} tokens`,
        results: refreshResults
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Erro no refresh de tokens:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
