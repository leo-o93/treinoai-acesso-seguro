
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { MessageCircle, TrendingUp, Clock, Target, Activity, Utensils, Calendar as CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface CategoryStats {
  treino: number
  nutricao: number
  agendamento: number
  strava: number
  geral: number
}

const WhatsAppInsights: React.FC = () => {
  const { data: insights, isLoading } = useQuery({
    queryKey: ['whatsapp-insights'],
    queryFn: async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

      // Buscar mensagens da última semana
      const { data: messages, error } = await supabase
        .from('ai_conversations')
        .select('content, context, created_at')
        .eq('message_type', 'user')
        .like('session_id', 'whatsapp_%')
        .gte('created_at', oneWeekAgo.toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error

      // Análise de categorias
      const categories: CategoryStats = {
        treino: 0,
        nutricao: 0,
        agendamento: 0,
        strava: 0,
        geral: 0
      }

      // Análise por horário (0-23)
      const hourlyActivity = new Array(24).fill(0)
      
      // Última atividade
      let lastActivity = null

      messages?.forEach(message => {
        const category = message.context?.category || 'geral'
        if (category in categories) {
          categories[category as keyof CategoryStats]++
        }
        
        // Contar atividade por hora
        const hour = new Date(message.created_at).getHours()
        hourlyActivity[hour]++
        
        // Primeira mensagem (mais recente)
        if (!lastActivity) {
          lastActivity = message.created_at
        }
      })

      // Encontrar horário de pico
      const peakHour = hourlyActivity.indexOf(Math.max(...hourlyActivity))
      
      return {
        totalMessages: messages?.length || 0,
        todayMessages: messages?.filter(m => 
          new Date(m.created_at) >= today
        ).length || 0,
        categories,
        peakHour,
        lastActivity,
        weeklyTrend: messages?.length > 0 ? 'up' : 'stable'
      }
    },
    refetchInterval: 60000 // Atualizar a cada minuto
  })

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'treino': return <Activity className="w-4 h-4" />
      case 'nutricao': return <Utensils className="w-4 h-4" />
      case 'agendamento': return <CalendarIcon className="w-4 h-4" />
      case 'strava': return <TrendingUp className="w-4 h-4" />
      default: return <MessageCircle className="w-4 h-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'treino': return 'bg-orange-50 text-orange-700 border-orange-200'
      case 'nutricao': return 'bg-green-50 text-green-700 border-green-200'
      case 'agendamento': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'strava': return 'bg-purple-50 text-purple-700 border-purple-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const formatCategoryName = (category: string) => {
    switch (category) {
      case 'treino': return 'Treinos'
      case 'nutricao': return 'Nutrição'
      case 'agendamento': return 'Agendamentos'
      case 'strava': return 'Performance'
      default: return 'Geral'
    }
  }

  if (isLoading) {
    return (
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-500" />
            Engajamento WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-gray-200 rounded-lg"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-16 bg-gray-200 rounded-lg"></div>
              <div className="h-16 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!insights || insights.totalMessages === 0) {
    return (
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-500" />
            Engajamento WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="font-medium mb-2">Aguardando interações</p>
            <p className="text-sm">
              Os insights de engajamento aparecerão quando houver conversas via WhatsApp
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const topCategories = Object.entries(insights.categories)
    .filter(([_, count]) => count > 0)
    .sort(([_, a], [__, b]) => b - a)
    .slice(0, 3)

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-500" />
            Engajamento WhatsApp
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            {insights.totalMessages} mensagens (7d)
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Métricas principais */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 border rounded-lg bg-gradient-to-r from-blue-50 to-blue-100">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Hoje</span>
            </div>
            <div className="text-xl font-bold text-blue-800">
              {insights.todayMessages}
            </div>
            <p className="text-xs text-blue-700">mensagens</p>
          </div>
          
          <div className="p-3 border rounded-lg bg-gradient-to-r from-purple-50 to-purple-100">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">Pico</span>
            </div>
            <div className="text-xl font-bold text-purple-800">
              {insights.peakHour}h
            </div>
            <p className="text-xs text-purple-700">mais ativo</p>
          </div>
        </div>

        {/* Categorias principais */}
        {topCategories.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900">Temas mais consultados</h4>
            <div className="space-y-2">
              {topCategories.map(([category, count]) => (
                <div key={category} className="flex items-center justify-between p-2 border rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(category)}
                    <span className="text-sm font-medium">
                      {formatCategoryName(category)}
                    </span>
                  </div>
                  <Badge variant="outline" className={getCategoryColor(category)}>
                    {count}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Última atividade */}
        {insights.lastActivity && (
          <div className="p-3 border rounded-lg bg-green-50">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-900">Última interação</span>
            </div>
            <p className="text-xs text-green-700">
              {format(new Date(insights.lastActivity), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default WhatsAppInsights
