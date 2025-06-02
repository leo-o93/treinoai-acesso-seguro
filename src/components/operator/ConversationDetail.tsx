
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Phone, Clock, Send, User, Bot, CheckCircle2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { getConversationsBySession, markConversationAsRead, sendOperatorResponse } from '@/lib/database'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { getCurrentUser } from '@/lib/getCurrentUser'

interface ConversationDetailProps {
  conversationId: string
  onResponseSent: () => void
}

export const ConversationDetail: React.FC<ConversationDetailProps> = ({
  conversationId,
  onResponseSent
}) => {
  const [response, setResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    getCurrentUser().then(setCurrentUser)
  }, [])

  const { data: conversation, isLoading: conversationLoading } = useQuery({
    queryKey: ['conversation-detail', conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select(`
          *,
          ai_responses(*)
        `)
        .eq('id', conversationId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!conversationId
  })

  const { data: sessionMessages = [] } = useQuery({
    queryKey: ['session-messages', conversation?.session_id],
    queryFn: () => getConversationsBySession(conversation!.session_id),
    enabled: !!conversation?.session_id
  })

  // Marcar como lida quando visualizar
  useEffect(() => {
    if (conversation && conversation.read_status === 'unread' && currentUser) {
      markConversationAsRead(conversationId, currentUser.id)
        .catch(console.error)
    }
  }, [conversation, conversationId, currentUser])

  const handleSendResponse = async () => {
    if (!response.trim() || !conversation) return

    setIsLoading(true)
    try {
      // Usar um operador padrão se não tiver currentUser
      const operatorId = currentUser?.id || '00000000-0000-0000-0000-000000000000'
      
      await sendOperatorResponse({
        session_id: conversation.session_id,
        response: response.trim(),
        conversation_id: conversationId,
        operator_id: operatorId
      })

      // Chamar edge function para enviar via n8n
      const { error: functionError } = await supabase.functions.invoke('send-response', {
        body: {
          sessionId: conversation.session_id,
          message: response.trim(),
          conversationId: conversationId
        }
      })

      if (functionError) {
        console.error('Erro ao enviar via n8n:', functionError)
        toast.error('Resposta salva, mas houve erro no envio via WhatsApp')
      } else {
        toast.success('Resposta enviada com sucesso!')
      }

      setResponse('')
      onResponseSent()
    } catch (error) {
      console.error('Erro ao enviar resposta:', error)
      toast.error('Erro ao enviar resposta')
    } finally {
      setIsLoading(false)
    }
  }

  if (conversationLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!conversation) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          Conversa não encontrada
        </CardContent>
      </Card>
    )
  }

  const getPhoneNumber = (sessionId: string) => {
    return sessionId.replace('whatsapp_', '').replace('@c.us', '')
  }

  const allMessages = [...sessionMessages, ...(conversation.ai_responses || [])]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-green-500" />
            {getPhoneNumber(conversation.session_id)}
          </div>
          <div className="flex gap-2">
            <Badge variant={conversation.read_status === 'unread' ? 'destructive' : 'secondary'}>
              {conversation.read_status === 'unread' ? 'Não lida' : 'Lida'}
            </Badge>
            <Badge variant={conversation.response_status === 'pending' ? 'default' : 'secondary'}>
              {conversation.response_status === 'pending' ? 'Pendente' : 'Respondida'}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 space-y-4 mb-4 max-h-96 overflow-y-auto">
          {allMessages.map((message) => {
            const isUserMessage = 'content' in message
            const isResponse = 'response' in message

            return (
              <div
                key={message.id}
                className={`flex ${isUserMessage ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isUserMessage
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-blue-500 text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {isUserMessage ? (
                      <User className="w-3 h-3" />
                    ) : (
                      <Bot className="w-3 h-3" />
                    )}
                    <span className="text-xs font-medium">
                      {isUserMessage ? 'Cliente' : 'Operador'}
                    </span>
                  </div>
                  <p className="text-sm">
                    {isUserMessage ? message.content : message.response}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs opacity-75">
                      {format(new Date(message.created_at), 'HH:mm', { locale: ptBR })}
                    </span>
                    {isResponse && (
                      <CheckCircle2 className="w-3 h-3" />
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Response Input */}
        <div className="space-y-3 border-t pt-4">
          <Textarea
            placeholder="Digite sua resposta..."
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            className="min-h-20"
            disabled={isLoading}
          />
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">
              {response.length}/1000 caracteres
            </span>
            <Button
              onClick={handleSendResponse}
              disabled={!response.trim() || isLoading}
              className="flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {isLoading ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
