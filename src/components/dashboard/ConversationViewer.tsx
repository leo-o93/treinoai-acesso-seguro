
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MessageCircle, Bot, User, Phone, Calendar, Activity, Utensils } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Conversation {
  id: string
  userMessage: string
  aiResponse: string
  timestamp: string
  category: string
  extractedData?: {
    workouts?: number
    meals?: number
    events?: number
  }
}

interface ConversationViewerProps {
  conversations: Conversation[]
  isLoading: boolean
}

const ConversationViewer: React.FC<ConversationViewerProps> = ({ 
  conversations, 
  isLoading 
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Conversas Processadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'agenda_treino':
        return <Calendar className="w-4 h-4 text-blue-500" />
      case 'strava_atividades':
        return <Activity className="w-4 h-4 text-orange-500" />
      case 'dieta_nutricao':
        return <Utensils className="w-4 h-4 text-green-500" />
      default:
        return <MessageCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'agenda_treino':
        return 'Treino & Agenda'
      case 'strava_atividades':
        return 'Atividades'
      case 'dieta_nutricao':
        return 'Nutrição'
      default:
        return 'Conversa Geral'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'agenda_treino':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'strava_atividades':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'dieta_nutricao':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-emerald-500" />
            Conversas Processadas
          </div>
          <Badge variant="secondary">{conversations.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {conversations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhuma conversa processada ainda</p>
            <p className="text-sm">As conversas do WhatsApp aparecerão aqui após serem processadas</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className="border rounded-lg p-4 space-y-3 bg-white hover:bg-gray-50 transition-colors"
              >
                {/* Header da Conversa */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">WhatsApp</span>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getCategoryColor(conversation.category)}`}
                    >
                      <div className="flex items-center gap-1">
                        {getCategoryIcon(conversation.category)}
                        {getCategoryLabel(conversation.category)}
                      </div>
                    </Badge>
                  </div>
                  <span className="text-xs text-gray-500">
                    {format(new Date(conversation.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </span>
                </div>

                {/* Mensagem do Usuário */}
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <div className="flex items-start gap-2">
                    <User className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <span className="text-xs font-medium text-blue-700">Usuário</span>
                      <p className="text-sm text-blue-900 mt-1">{conversation.userMessage}</p>
                    </div>
                  </div>
                </div>

                {/* Resposta da IA */}
                <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                  <div className="flex items-start gap-2">
                    <Bot className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <span className="text-xs font-medium text-emerald-700">TrainerAI</span>
                      <p className="text-sm text-emerald-900 mt-1 line-clamp-3">
                        {conversation.aiResponse}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dados Extraídos */}
                {conversation.extractedData && (
                  <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
                    <span className="text-xs text-gray-600">Dados processados:</span>
                    {conversation.extractedData.workouts && (
                      <Badge variant="outline" className="text-xs">
                        {conversation.extractedData.workouts} treinos
                      </Badge>
                    )}
                    {conversation.extractedData.meals && (
                      <Badge variant="outline" className="text-xs">
                        {conversation.extractedData.meals} refeições
                      </Badge>
                    )}
                    {conversation.extractedData.events && (
                      <Badge variant="outline" className="text-xs">
                        {conversation.extractedData.events} eventos
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ConversationViewer
