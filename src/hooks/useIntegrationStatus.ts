
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export const useIntegrationStatus = (provider: 'google' | 'strava') => {
  const { data: integration, isLoading, refetch } = useQuery({
    queryKey: ['integration-status', provider],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('provider', provider)
        .maybeSingle()

      if (error) {
        console.error(`Erro ao buscar status da integração ${provider}:`, error)
        throw error
      }

      return data
    }
  })

  return {
    integration,
    isLoading,
    refetch,
    isConnected: !!integration,
    isExpired: integration && integration.expires_at && new Date(integration.expires_at) < new Date()
  }
}
