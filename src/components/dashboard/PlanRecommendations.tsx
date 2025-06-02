
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Lightbulb, TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { getStravaActivities } from '@/lib/database'
import { supabase } from '@/integrations/supabase/client'
import { WeeklyFeedback } from '@/types/weekly-feedback'

interface Recommendation {
  id: string
  type: 'training' | 'nutrition' | 'recovery' | 'goal'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  actionable: boolean
  implemented?: boolean
  insights: string[]
}

const PlanRecommendations: React.FC = () => {
  const { user } = useAuth()
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])

  const { data: activities } = useQuery({
    queryKey: ['recommendations-activities', user?.id],
    queryFn: () => getStravaActivities(user!.id, 21),
    enabled: !!user?.id
  })

  const { data: weeklyFeedbacks } = useQuery({
    queryKey: ['recommendations-feedbacks', user?.id],
    queryFn: async (): Promise<WeeklyFeedback[]> => {
      if (!user?.id) return []
      
      const { data, error } = await supabase
        .from('weekly_feedback' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('week_start', { ascending: false })
        .limit(4)
      
      if (error) throw error
      return (data as any[]) as WeeklyFeedback[]
    },
    enabled: !!user?.id
  })

  const { data: profile } = useQuery({
    queryKey: ['recommendations-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      
      if (error) throw error
      return data
    },
    enabled: !!user?.id
  })

  useEffect(() => {
    generateRecommendations()
  }, [activities, weeklyFeedbacks, profile])

  const generateRecommendations = () => {
    if (!activities || !profile) return

    const recs: Recommendation[] = []

    // Análise de consistência
    const last7Days = activities.filter(a => {
      const activityDate = new Date(a.start_date)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return activityDate >= weekAgo
    })

    const expectedWeekly = profile.frequencia_semanal || 3
    const actualWeekly = last7Days.length

    if (actualWeekly < expectedWeekly * 0.7) {
      recs.push({
        id: 'consistency-low',
        type: 'training',
        priority: 'high',
        title: 'Melhorar Consistência',
        description: `Você realizou ${actualWeekly} treinos esta semana, mas sua meta é ${expectedWeekly}. Vamos ajustar para manter o progresso?`,
        actionable: true,
        insights: [
          'Treinos mais curtos podem ajudar a manter a consistência',
          'Considere dividir treinos longos em sessões menores',
          'Estabeleça horários fixos para criar o hábito'
        ]
      })
    }

    // Análise de intensidade
    const avgDistance = activities.slice(0, 10)
      .reduce((sum, a) => sum + (a.distance || 0), 0) / 10

    const recentDistance = last7Days
      .reduce((sum, a) => sum + (a.distance || 0), 0) / Math.max(last7Days.length, 1)

    if (recentDistance > avgDistance * 1.3) {
      recs.push({
        id: 'intensity-high',
        type: 'recovery',
        priority: 'medium',
        title: 'Atenção à Recuperação',
        description: 'Sua intensidade aumentou significativamente. É importante equilibrar com dias de recuperação.',
        actionable: true,
        insights: [
          'Inclua pelo menos 1-2 dias de recuperação ativa',
          'Monitore sinais de fadiga excessiva',
          'Considere treinos de baixa intensidade'
        ]
      })
    }

    // Análise de feedback
    if (weeklyFeedbacks && weeklyFeedbacks.length > 0) {
      const lastFeedback = weeklyFeedbacks[0]
      
      if (lastFeedback.energy_level <= 4) {
        recs.push({
          id: 'energy-low',
          type: 'nutrition',
          priority: 'high',
          title: 'Otimizar Energia',
          description: 'Seus níveis de energia estão baixos. Vamos revisar sua alimentação e recuperação?',
          actionable: true,
          insights: [
            'Verifique se está consumindo carboidratos suficientes',
            'Hidratação adequada é fundamental',
            'Qualidade do sono afeta diretamente a energia'
          ]
        })
      }

      if (lastFeedback.difficulty_level >= 8) {
        recs.push({
          id: 'difficulty-high',
          type: 'training',
          priority: 'medium',
          title: 'Ajustar Intensidade',
          description: 'Os treinos estão muito desafiadores. Vamos encontrar o equilíbrio ideal?',
          actionable: true,
          insights: [
            'Progressão gradual é mais eficaz que saltos grandes',
            'Incluir mais aquecimento e alongamento',
            'Considere reduzir 10-15% da intensidade temporariamente'
          ]
        })
      }
    }

    // Análise de progresso
    const last14Days = activities.slice(0, 14)
    const previous14Days = activities.slice(14, 28)

    if (last14Days.length > 0 && previous14Days.length > 0) {
      const recentPace = last14Days
        .filter(a => a.average_speed)
        .reduce((sum, a) => sum + (a.average_speed || 0), 0) / last14Days.length

      const previousPace = previous14Days
        .filter(a => a.average_speed)
        .reduce((sum, a) => sum + (a.average_speed || 0), 0) / previous14Days.length

      if (recentPace > previousPace * 1.05) {
        recs.push({
          id: 'progress-good',
          type: 'goal',
          priority: 'low',
          title: 'Progresso Positivo!',
          description: 'Sua velocidade média melhorou! Continue assim para manter o momentum.',
          actionable: false,
          insights: [
            'Mantenha a consistência atual',
            'Considere estabelecer uma nova meta',
            'Documente o que está funcionando bem'
          ]
        })
      }
    }

    setRecommendations(recs)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'training': return <TrendingUp className="w-4 h-4" />
      case 'nutrition': return <Lightbulb className="w-4 h-4" />
      case 'recovery': return <Clock className="w-4 h-4" />
      case 'goal': return <CheckCircle className="w-4 h-4" />
      default: return <AlertTriangle className="w-4 h-4" />
    }
  }

  if (recommendations.length === 0) {
    return (
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6 text-center">
          <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
          <h3 className="font-semibold text-gray-900 mb-2">Tudo certo!</h3>
          <p className="text-gray-600">
            Não há recomendações urgentes no momento. Continue assim!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          Recomendações Inteligentes
        </CardTitle>
        <p className="text-sm text-gray-600">
          Baseadas na sua performance e feedback recente
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className={`p-4 rounded-lg border ${getPriorityColor(rec.priority)}`}
            >
              <div className="flex items-start gap-3">
                <div className={rec.priority === 'high' ? 'text-red-600' : rec.priority === 'medium' ? 'text-orange-600' : 'text-green-600'}>
                  {getTypeIcon(rec.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">
                        {rec.type}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getPriorityColor(rec.priority)}`}
                      >
                        {rec.priority}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">{rec.description}</p>
                  
                  {rec.insights.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-600">Insights:</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {rec.insights.map((insight, idx) => (
                          <li key={idx} className="flex items-start gap-1">
                            <span className="text-gray-400">•</span>
                            <span>{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {rec.actionable && (
                    <Button variant="outline" size="sm" className="mt-3">
                      Implementar Sugestão
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default PlanRecommendations
