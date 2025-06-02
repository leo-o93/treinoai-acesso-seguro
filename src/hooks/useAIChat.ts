
import { useState, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/hooks/use-toast'

interface Message {
  id: string
  content: string
  type: 'user' | 'ai'
  timestamp: Date
}

interface UseAIChatReturn {
  messages: Message[]
  isLoading: boolean
  sendMessage: (message: string) => Promise<void>
  clearMessages: () => void
}

export const useAIChat = (sessionId?: string): UseAIChatReturn => {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = useCallback(async (messageContent: string) => {
    if (!user || !messageContent.trim() || isLoading) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: messageContent,
      type: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      const { data, error } = await supabase.functions.invoke('ai-agent-openai', {
        body: {
          message: messageContent,
          userId: user.id,
          sessionId: sessionId || `web-${user.id}`
        }
      })

      if (error) throw error

      if (data?.success && data?.response) {
        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          content: data.response,
          type: 'ai',
          timestamp: new Date()
        }

        setMessages(prev => [...prev, aiMessage])
      } else {
        throw new Error(data?.error || 'Erro desconhecido na resposta da IA')
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a mensagem. Tente novamente.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }, [user, sessionId, isLoading])

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages
  }
}
