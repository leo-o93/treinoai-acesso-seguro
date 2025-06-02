
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
        .eq('user_id', user?.id || '')
        .order('created_at', { ascending: false })

      if (convError) throw convError

      // Buscar eventos extraídos das conversas
      const { data: extractedEvents, error: eventsError } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user?.id || '')
        .not('google_event_id', 'is', null)
        .order('created_at', { ascending: false })

      if (eventsError) throw eventsError

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

      // Categorizar conversas
      const categories = conversations?.reduce((acc: any, conv) => {
        const category = (conv.context as any)?.category || 'geral'
        acc[category] = (acc[category] || 0) + 1
        return acc
      }, {}) || {}

      // Eventos por tipo
      const eventsByType = extractedEvents?.reduce((acc: any, event) => {
        acc[event.event_type] = (acc[event.event_type] || 0) + 1
        return acc
      }, {}) || {}

      return {
        totalConversations: conversations?.length || 0,
        todayConversations: todayConversations.length,
        weekConversations: weekConversations.length,
        extractedEvents: extractedEvents?.length || 0,
        categories,
        eventsByType,
        lastConversation: conversations?.[0]?.created_at,
        responseRate: conversations?.filter(c => c.response_status === 'responded').length || 0
      }
    },
    enabled: !!user?.id,
    refetchInterval: 60000, // 1 minuto
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

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      treino: 'bg-orange-100 text-orange-800',
      nutricao: 'bg-green-100 text-green-800',
      agendamento: 'bg-blue-100 text-blue-800',
      strava: 'bg-purple-100 text-purple-800',
      geral: 'bg-gray-100 text-gray-800'
    }
    return colors[category] || colors.geral
  }

  const getEventTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      workout: 'Treinos',
      meal: 'Refeições',
      general: 'Outros'
    }
    return labels[type] || type
  }

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-green-500" />
          WhatsApp Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estatísticas principais */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {insights?.totalConversations || 0}
            </div>
            <p className="text-xs text-blue-700">Total de Conversas</p>
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

        {/* Categorias de conversas */}
        {insights?.categories && Object.keys(insights.categories).length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-2">Categorias:</h4>
            <div className="flex flex-wrap gap-1">
              {Object.entries(insights.categories).map(([category, count]) => (
                <Badge 
                  key={category} 
                  variant="outline" 
                  className={getCategoryColor(category)}
                >
                  {category}: {count as number}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Tipos de eventos */}
        {insights?.eventsByType && Object.keys(insights.eventsByType).length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-2">Eventos Criados:</h4>
            <div className="space-y-1">
              {Object.entries(insights.eventsByType).map(([type, count]) => (
                <div key={type} className="flex justify-between text-sm">
                  <span>{getEventTypeLabel(type)}:</span>
                  <span className="font-medium">{count as number}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Taxa de resposta */}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1">
              <Bot className="w-3 h-3" />
              Taxa de Resposta:
            </span>
            <span className="font-medium text-green-600">
              {insights?.totalConversations ? 
                Math.round((insights.responseRate / insights.totalConversations) * 100) : 0}%
            </span>
          </div>
        </div>

        {!insights?.totalConversations && (
          <div className="text-center py-4 text-gray-500">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Nenhuma conversa no WhatsApp ainda</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default WhatsAppInsights
