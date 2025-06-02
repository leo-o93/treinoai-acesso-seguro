
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface Integration {
  id: string
  provider: string
  expires_at: string | null
  created_at: string
  updated_at: string
  athlete_id: string | null
  scope: string | null
  status: 'active' | 'expired'
}

export const useIntegrationsAPI = (userId?: string) => {
  const queryClient = useQueryClient()

  // Listar integrações do usuário
  const {
    data: integrations,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['integrations-api', userId],
    queryFn: async () => {
      if (!userId) return []
      
      const { data, error } = await supabase.functions.invoke('api-integrations', {
        body: null,
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (error) {
        console.error('Erro ao buscar integrações:', error)
        throw new Error('Erro ao carregar integrações')
      }

      return data as Integration[]
    },
    enabled: !!userId
  })

  // Desconectar integração
  const disconnectMutation = useMutation({
    mutationFn: async ({ provider }: { provider: string }) => {
      if (!userId) throw new Error('User ID is required')

      const { data, error } = await supabase.functions.invoke('api-integrations', {
        body: null,
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (error) {
        throw new Error('Erro ao desconectar integração')
      }

      return data
    },
    onSuccess: (_, { provider }) => {
      queryClient.invalidateQueries({ queryKey: ['integrations-api', userId] })
      queryClient.invalidateQueries({ queryKey: ['user-integrations'] })
      toast.success(`${provider === 'google' ? 'Google Calendar' : 'Strava'} desconectado com sucesso`)
    },
    onError: (error) => {
      console.error('Erro ao desconectar:', error)
      toast.error('Erro ao desconectar integração')
    }
  })

  // Refresh de tokens
  const refreshTokensMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('refresh-tokens')

      if (error) {
        throw new Error('Erro ao atualizar tokens')
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations-api', userId] })
      queryClient.invalidateQueries({ queryKey: ['user-integrations'] })
      toast.success('Tokens atualizados com sucesso')
    },
    onError: (error) => {
      console.error('Erro ao atualizar tokens:', error)
      toast.error('Erro ao atualizar tokens')
    }
  })

  return {
    integrations: integrations || [],
    isLoading,
    error,
    refetch,
    disconnect: disconnectMutation.mutate,
    isDisconnecting: disconnectMutation.isPending,
    refreshTokens: refreshTokensMutation.mutate,
    isRefreshing: refreshTokensMutation.isPending
  }
}
