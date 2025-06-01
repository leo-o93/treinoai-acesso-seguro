
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Phone, Clock } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AIConversation } from '@/lib/database'

const TrainerAIMessages: React.FC = () => {
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['trainerai-messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('message_type', 'user')
        .like('session_id', 'whatsapp_%')
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      return data as AIConversation[]
    },
    refetchInterval: 10000 // Atualizar a cada 10 segundos
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-green-500" />
          Mensagens WhatsApp - TrainerAI
          <Badge variant="secondary">{messages.length}</Badge>
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
              // Parse context safely
              const context = message.context as any
              const phone = context?.phone || 'Número não identificado'
              const messageType = context?.type || 'text'
              const dateTime = context?.date_time || message.created_at

              return (
                <div
                  key={message.id}
                  className="border rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-green-500" />
                      <span className="font-medium text-sm">
                        {phone}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {messageType}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {format(new Date(message.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </div>
                  </div>
                  
                  <div className="text-gray-800 text-sm leading-relaxed">
                    {message.content}
                  </div>

                  {dateTime && dateTime !== message.created_at && (
                    <div className="mt-2 text-xs text-gray-400">
                      Enviado em: {format(new Date(dateTime), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default TrainerAIMessages
