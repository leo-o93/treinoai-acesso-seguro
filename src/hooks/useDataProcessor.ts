
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { dataProcessor, ProcessedData } from '@/services/dataProcessor'
import { supabase } from '@/integrations/supabase/client'

interface UseDataProcessorReturn {
  data: ProcessedData | null
  isLoading: boolean
  error: string | null
  refreshData: () => Promise<void>
}

export const useDataProcessor = (): UseDataProcessorReturn => {
  const { user } = useAuth()
  const [data, setData] = useState<ProcessedData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const processData = async () => {
    if (!user?.id) return

    setIsLoading(true)
    setError(null)

    try {
      const processedData = await dataProcessor.processUserData(user.id)
      setData(processedData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar dados')
      console.error('Erro no processamento de dados:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshData = async () => {
    await processData()
  }

  // Processar dados inicialmente
  useEffect(() => {
    if (user?.id) {
      processData()
    }
  }, [user?.id])

  // Escutar mudanças em tempo real
  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel('data-processor-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_conversations'
        },
        (payload) => {
          if (payload.new && typeof payload.new === 'object' && 'user_id' in payload.new && payload.new.user_id === user.id) {
            // Aguardar um pouco para garantir que os dados relacionados foram salvos
            setTimeout(() => {
              processData()
            }, 2000)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'strava_activities'
        },
        (payload) => {
          if (payload.new && typeof payload.new === 'object' && 'user_id' in payload.new && payload.new.user_id === user.id) {
            processData()
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calendar_events'
        },
        (payload) => {
          if (payload.new && typeof payload.new === 'object' && 'user_id' in payload.new && payload.new.user_id === user.id) {
            processData()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  return {
    data,
    isLoading,
    error,
    refreshData
  }
}
