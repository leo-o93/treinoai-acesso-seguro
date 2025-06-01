
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Calendar, Activity, Brain, Clock, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ToolActivity {
  id: string
  tool: string
  action: string
  user_message: string
  phone: string
  timestamp: string
  success: boolean
}

const AIToolsMonitor: React.FC = () => {
  // Buscar atividades recentes das ferramentas IA
  const { data: toolActivities = [], isLoading } = useQuery({
    queryKey: ['ai-tools-activities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('message_type', 'user')
        .like('session_id', 'whatsapp_%')
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      // Processar dados para identificar uso das ferramentas
      return data.map(conversation => {
        const context = conversation.context as any
        const phone = context?.phone || 'Não identificado'
        const message = conversation.content.toLowerCase()
        
        let tool = 'CONHECIMENTO-IA'
        let action = 'Consulta geral'
        
        if (message.includes('agenda') || message.includes('treino') || message.includes('dieta')) {
          tool = 'AGENDAMENTO-Treino-Dietas'
          if (message.includes('criar') || message.includes('agendar')) {
            action = 'Criar evento'
          } else if (message.includes('cancelar')) {
            action = 'Cancelar evento'
          } else if (message.includes('alterar') || message.includes('modificar')) {
            action = 'Modificar evento'
          } else if (message.includes('buscar') || message.includes('ver')) {
            action = 'Consultar eventos'
          } else {
            action = 'Gerenciar agenda'
          }
        } else if (message.includes('strava') || message.includes('corrida') || message.includes('pace') || message.includes('km')) {
          tool = 'INFORMAÇÕES-Strava'
          if (message.includes('buscar') || message.includes('ver')) {
            action = 'Consultar treinos'
          } else if (message.includes('estatística') || message.includes('dados')) {
            action = 'Analisar dados'
          } else {
            action = 'Informações de treino'
          }
        }

        return {
          id: conversation.id,
          tool,
          action,
          user_message: conversation.content,
          phone,
          timestamp: conversation.created_at,
          success: true // Assumimos sucesso se chegou até aqui
        } as ToolActivity
      })
    },
    refetchInterval: 15000 // Atualizar a cada 15 segundos
  })

  const getToolIcon = (tool: string) => {
    switch (tool) {
      case 'AGENDAMENTO-Treino-Dietas': return <Calendar className="w-4 h-4 text-blue-500" />
      case 'INFORMAÇÕES-Strava': return <Activity className="w-4 h-4 text-orange-500" />
      case 'CONHECIMENTO-IA': return <Brain className="w-4 h-4 text-purple-500" />
      default: return <Brain className="w-4 h-4 text-gray-500" />
    }
  }

  const getToolColor = (tool: string) => {
    switch (tool) {
      case 'AGENDAMENTO-Treino-Dietas': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'INFORMAÇÕES-Strava': return 'bg-orange-50 text-orange-700 border-orange-200'
      case 'CONHECIMENTO-IA': return 'bg-purple-50 text-purple-700 border-purple-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  // Estatísticas das ferramentas
  const toolStats = {
    agendamento: toolActivities.filter(a => a.tool === 'AGENDAMENTO-Treino-Dietas').length,
    strava: toolActivities.filter(a => a.tool === 'INFORMAÇÕES-Strava').length,
    conhecimento: toolActivities.filter(a => a.tool === 'CONHECIMENTO-IA').length
  }

  if (isLoading) {
    return (
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Monitor de Ferramentas IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-500" />
          Monitor de Ferramentas IA
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            {toolActivities.length} atividades
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estatísticas rápidas */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 border rounded-lg bg-blue-50">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-900">Agendamento</span>
            </div>
            <div className="text-lg font-bold text-blue-800">{toolStats.agendamento}</div>
          </div>
          
          <div className="p-3 border rounded-lg bg-orange-50">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium text-orange-900">Strava</span>
            </div>
            <div className="text-lg font-bold text-orange-800">{toolStats.strava}</div>
          </div>
          
          <div className="p-3 border rounded-lg bg-purple-50">
            <div className="flex items-center gap-2 mb-1">
              <Brain className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium text-purple-900">Conhecimento</span>
            </div>
            <div className="text-lg font-bold text-purple-800">{toolStats.conhecimento}</div>
          </div>
        </div>

        {/* Atividades recentes */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          <h4 className="font-medium text-gray-900 text-sm">Atividades Recentes</h4>
          
          {toolActivities.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <Brain className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhuma atividade registrada</p>
              <p className="text-sm">As atividades das ferramentas IA aparecerão aqui</p>
            </div>
          ) : (
            toolActivities.map((activity) => (
              <div key={activity.id} className="p-3 border rounded-lg bg-white hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getToolIcon(activity.tool)}
                    <Badge variant="outline" className={getToolColor(activity.tool)}>
                      {activity.tool}
                    </Badge>
                    <span className="text-sm font-medium text-gray-700">{activity.action}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {format(new Date(activity.timestamp), 'dd/MM HH:mm', { locale: ptBR })}
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 mb-1">
                  📱 {activity.phone}
                </div>
                
                <div className="text-sm text-gray-800 bg-gray-50 p-2 rounded">
                  "{activity.user_message}"
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default AIToolsMonitor
