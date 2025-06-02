
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Phone, Clock, MessageCircle, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AIConversation } from '@/lib/database'

interface ConversationListProps {
  conversations: (AIConversation & { ai_responses?: any[] })[]
  isLoading: boolean
  selectedConversation: string | null
  onSelectConversation: (id: string) => void
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  isLoading,
  selectedConversation,
  onSelectConversation
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Conversas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const getPhoneNumber = (sessionId: string) => {
    return sessionId.replace('whatsapp_', '').replace('@c.us', '')
  }

  const getStatusColor = (conversation: AIConversation) => {
    if (conversation.read_status === 'unread') return 'bg-red-500'
    if (conversation.response_status === 'pending') return 'bg-yellow-500'
    if (conversation.response_status === 'responded') return 'bg-green-500'
    return 'bg-gray-500'
  }

  const getStatusText = (conversation: AIConversation) => {
    if (conversation.read_status === 'unread') return 'Não lida'
    if (conversation.response_status === 'pending') return 'Pendente'
    if (conversation.response_status === 'responded') return 'Respondida'
    return 'Nova'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Conversas
          </span>
          <Badge variant="secondary">{conversations.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {conversations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhuma conversa encontrada</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
                className={`
                  border rounded-lg p-3 cursor-pointer transition-all duration-200
                  hover:bg-gray-50 hover:border-blue-300
                  ${selectedConversation === conversation.id 
                    ? 'bg-blue-50 border-blue-500' 
                    : 'bg-white border-gray-200'
                  }
                `}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-green-500" />
                    <span className="font-medium text-sm">
                      {getPhoneNumber(conversation.session_id)}
                    </span>
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(conversation)}`}></div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {getStatusText(conversation)}
                  </Badge>
                </div>
                
                <div className="text-gray-800 text-sm leading-relaxed mb-2 line-clamp-2">
                  {conversation.content}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {format(new Date(conversation.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                  </div>
                  {conversation.ai_responses && conversation.ai_responses.length > 0 && (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="w-3 h-3" />
                      {conversation.ai_responses.length} resposta(s)
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
