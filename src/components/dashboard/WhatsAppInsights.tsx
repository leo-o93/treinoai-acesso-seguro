
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { MessageCircle, Bot, Calendar, TrendingUp, Smartphone, Clock } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const WhatsAppInsights: React.FC = () => {
  const { user } = useAuth()

  const { data: insights, isLoading } = useQuery({
    queryKey: ['whatsapp-insights', user?.id],
    queryFn: async () => {
      // Buscar estatísticas das conversas
      const { data: conversations, error: convError } = await supabase
        .from('ai_conversations')
        .select('*')
        .order('created_at', { ascending: false })

      if (convError) throw convError

      // Buscar eventos extraídos das conversas (incluindo hardcoded user_id para teste)
      const testUserId = '550e8400-e29b-41d4-a716-446655440000'
      const { data: extractedEvents, error: eventsError } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', testUserId)
        .order('created_at', { ascending: false })

      if (eventsError) throw eventsError

      // Buscar logs do webhook para estatísticas mais detalhadas
      const { data: webhookLogs, error: logsError } = await supabase
        .from('webhook_logs')
        .select('*')
        .eq('source', 'trainerai_whatsapp_n8n')
        .order('created_at', { ascending: false })
        .limit(100)

      if (logsError) throw logsError

      // Calcular estatísticas
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const todayConversations = conversations?.filter(conv => 
        new Date(conv.created_at) >= today
      ) || []

      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      
      const weekConversations = conversations?.filter(conv => 
        new Date(conv.created_at) >= weekAgo
      ) || []

      // Contar eventos extraídos por tipo
      const eventsByType = extractedEvents?.reduce((acc: any, event) => {
        acc[event.event_type] = (acc[event.event_type] || 0) + 1
        return acc
      }, {}) || {}

      // Estatísticas dos logs do webhook
      const successfulLogs = webhookLogs?.filter(log => log.processed && !log.error_message) || []
      const errorLogs = webhookLogs?.filter(log => log.error_message) || []

      return {
        totalConversations: conversations?.length || 0,
        todayConversations: todayConversations.length,
        weekConversations: weekConversations.length,
        extractedEvents: extractedEvents?.length || 0,
        eventsByType,
        lastConversation: conversations?.[0]?.created_at,
        successfulWebhooks: successfulLogs.length,
        errorWebhooks: errorLogs.length,
        totalWebhookLogs: webhookLogs?.length || 0
      }
    },
    refetchInterval: 30000, // 30 segundos
  })

  if (isLoading) {
    return (
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-green-500" />
            WhatsApp Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getEventTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      workout: 'Treinos',
      meal: 'Refeições',
      general: 'Outros'
    }
    return labels[type] || type
  }

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'workout': return '🏋️'
      case 'meal': return '🍽️'
      default: return '📅'
    }
  }

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-green-500" />
          WhatsApp Insights
          {insights?.extractedEvents > 0 && (
            <Badge variant="outline" className="bg-green-50 text-green-700">
              {insights.extractedEvents} eventos
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estatísticas principais */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {insights?.totalConversations || 0}
            </div>
            <p className="text-xs text-blue-700">Conversas Total</p>
          </div>
          
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {insights?.extractedEvents || 0}
            </div>
            <p className="text-xs text-green-700">Eventos Extraídos</p>
          </div>
        </div>

        {/* Atividade recente */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-blue-500" />
            <span className="font-medium">Hoje:</span>
            <span>{insights?.todayConversations || 0} conversas</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="font-medium">Esta semana:</span>
            <span>{insights?.weekConversations || 0} conversas</span>
          </div>
        </div>

        {/* Tipos de eventos extraídos */}
        {insights?.eventsByType && Object.keys(insights.eventsByType).length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-2">✨ Eventos Criados:</h4>
            <div className="space-y-1">
              {Object.entries(insights.eventsByType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                  <span className="flex items-center gap-1">
                    <span>{getEventTypeIcon(type)}</span>
                    {getEventTypeLabel(type)}:
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {count as number}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status da integração */}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1">
              <Bot className="w-3 h-3" />
              Status n8n:
            </span>
            <span className={`font-medium ${insights?.successfulWebhooks > 0 ? 'text-green-600' : 'text-gray-500'}`}>
              {insights?.successfulWebhooks > 0 ? '✅ Ativo' : '⏳ Aguardando'}
            </span>
          </div>
          
          {insights?.errorWebhooks > 0 && (
            <div className="text-xs text-red-600 mt-1">
              ⚠️ {insights.errorWebhooks} erros detectados
            </div>
          )}
        </div>

        {!insights?.totalConversations && (
          <div className="text-center py-4 text-gray-500">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Nenhuma conversa no WhatsApp ainda</p>
            <p className="text-xs text-gray-400">
              Envie uma mensagem via n8n para começar
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default WhatsAppInsights
