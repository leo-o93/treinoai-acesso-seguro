
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MessageCircle, Phone, Clock, ExternalLink } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AIConversation } from '@/lib/database'
import { useNavigate } from 'react-router-dom'

const TrainerAIMessages: React.FC = () => {
  const navigate = useNavigate()

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['trainerai-messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('message_type', 'user')
        .like('session_id', 'whatsapp_%')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      return data as AIConversation[]
    },
    refetchInterval: 10000
  })

  const { data: stats } = useQuery({
    queryKey: ['trainerai-stats-overview'],
    queryFn: async () => {
      const { data: unread, error: unreadError } = await supabase
        .from('ai_conversations')
        .select('id')
        .eq('message_type', 'user')
        .eq('read_status', 'unread')
        .like('session_id', 'whatsapp_%')

      const { data: pending, error: pendingError } = await supabase
        .from('ai_conversations')
        .select('id')
        .eq('message_type', 'user')
        .eq('response_status', 'pending')
        .like('session_id', 'whatsapp_%')

      if (unreadError || pendingError) throw unreadError || pendingError

      return {
        unreadCount: unread.length,
        pendingCount: pending.length
      }
    },
    refetchInterval: 30000
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Mensagens WhatsApp - TrainerAI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const getPhoneNumber = (sessionId: string) => {
    return sessionId.replace('whatsapp_', '').replace('@c.us', '')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-500" />
            Mensagens WhatsApp - TrainerAI
          </div>
          <div className="flex items-center gap-2">
            {stats && (
              <>
                {stats.unreadCount > 0 && (
                  <Badge variant="destructive">{stats.unreadCount} não lidas</Badge>
                )}
                {stats.pendingCount > 0 && (
                  <Badge variant="default">{stats.pendingCount} pendentes</Badge>
                )}
              </>
            )}
            <Button
              size="sm"
              onClick={() => navigate('/operator')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir Dashboard
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhuma mensagem recebida ainda</p>
            <p className="text-sm">As mensagens do WhatsApp aparecerão aqui</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {messages.map((message) => {
              const context = message.context as any
              const phone = getPhoneNumber(message.session_id)

              return (
                <div
                  key={message.id}
                  className="border rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-green-500" />
                      <span className="font-medium text-sm">{phone}</span>
                      <div className="flex gap-1">
                        {message.read_status === 'unread' && (
                          <Badge variant="destructive" className="text-xs">Não lida</Badge>
                        )}
                        {message.response_status === 'pending' && (
                          <Badge variant="default" className="text-xs">Pendente</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {format(new Date(message.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </div>
                  </div>
                  
                  <div className="text-gray-800 text-sm leading-relaxed">
                    {message.content}
                  </div>
                </div>
              )
            })}
            
            {messages.length >= 10 && (
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => navigate('/operator')}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Ver todas as mensagens
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default TrainerAIMessages
