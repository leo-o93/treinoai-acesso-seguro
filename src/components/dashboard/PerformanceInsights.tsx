
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Zap, Award } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { getStravaActivities } from '@/lib/database'

interface PerformanceInsight {
  id: string
  type: 'improvement' | 'decline' | 'milestone' | 'suggestion'
  title: string
  description: string
  value: string
  trend: number // -1 a 1, onde 1 é muito positivo
  icon: React.ReactNode
  color: string
}

const PerformanceInsights: React.FC = () => {
  const { user } = useAuth()
  const [insights, setInsights] = useState<PerformanceInsight[]>([])

  const { data: activities = [] } = useQuery({
    queryKey: ['performance-insights', user?.id],
    queryFn: () => getStravaActivities(user!.id, 30),
    enabled: !!user?.id
  })

  useEffect(() => {
    generateInsights()
  }, [activities])

  const generateInsights = () => {
    if (activities.length < 2) {
      setInsights([])
      return
    }

    const insightList: PerformanceInsight[] = []

    // Análise de pace (últimas 5 vs 5 anteriores)
    const recent = activities.slice(0, 5)
    const previous = activities.slice(5, 10)

    if (recent.length >= 3 && previous.length >= 3) {
      const recentAvgPace = recent
        .filter(a => a.average_speed && a.distance)
        .reduce((sum, a) => sum + (a.average_speed || 0), 0) / recent.length

      const previousAvgPace = previous
        .filter(a => a.average_speed && a.distance)
        .reduce((sum, a) => sum + (a.average_speed || 0), 0) / previous.length

      const paceChange = ((recentAvgPace - previousAvgPace) / previousAvgPace) * 100

      if (Math.abs(paceChange) > 5) {
        insightList.push({
          id: 'pace-trend',
          type: paceChange > 0 ? 'improvement' : 'decline',
          title: paceChange > 0 ? 'Velocidade em alta! 🚀' : 'Atenção ao ritmo 📉',
          description: `Sua velocidade média ${paceChange > 0 ? 'aumentou' : 'diminuiu'} ${Math.abs(paceChange).toFixed(1)}% comparado aos treinos anteriores`,
          value: `${paceChange > 0 ? '+' : ''}${paceChange.toFixed(1)}%`,
          trend: paceChange > 0 ? 0.8 : -0.6,
          icon: paceChange > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />,
          color: paceChange > 0 ? 'text-green-600' : 'text-orange-600'
        })
      }
    }

    // Análise de distância
    const totalDistance = activities.reduce((sum, a) => sum + (a.distance || 0), 0)
    if (totalDistance > 50) {
      insightList.push({
        id: 'distance-milestone',
        type: 'milestone',
        title: 'Marco de distância! 🎯',
        description: `Você já percorreu ${totalDistance.toFixed(1)}km! Continue assim para manter o momentum.`,
        value: `${totalDistance.toFixed(1)}km`,
        trend: 0.9,
        icon: <Award className="w-4 h-4" />,
        color: 'text-purple-600'
      })
    }

    // Análise de consistência
    const last7Days = activities.filter(a => {
      const activityDate = new Date(a.start_date)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return activityDate >= weekAgo
    })

    const consistencyScore = Math.min(last7Days.length / 3, 1) // 3 treinos por semana = 100%
    
    if (consistencyScore >= 0.8) {
      insightList.push({
        id: 'consistency-high',
        type: 'improvement',
        title: 'Consistência excelente! ⭐',
        description: `${last7Days.length} treinos nos últimos 7 dias. Sua disciplina está pagando dividendos!`,
        value: `${Math.round(consistencyScore * 100)}%`,
        trend: 0.9,
        icon: <Zap className="w-4 h-4" />,
        color: 'text-emerald-600'
      })
    } else if (consistencyScore < 0.4) {
      insightList.push({
        id: 'consistency-low',
        type: 'suggestion',
        title: 'Vamos retomar o ritmo? 💪',
        description: `Apenas ${last7Days.length} treinos esta semana. Que tal estabelecer uma meta de 3-4 treinos?`,
        value: `${Math.round(consistencyScore * 100)}%`,
        trend: -0.4,
        icon: <TrendingDown className="w-4 h-4" />,
        color: 'text-blue-600'
      })
    }

    // Análise de calorias
    const avgCalories = activities
      .filter(a => a.calories)
      .reduce((sum, a) => sum + (a.calories || 0), 0) / activities.filter(a => a.calories).length

    if (avgCalories > 400) {
      insightList.push({
        id: 'calories-good',
        type: 'improvement',
        title: 'Queima de calorias eficiente! 🔥',
        description: `Média de ${Math.round(avgCalories)} calorias por treino. Excelente intensidade!`,
        value: `${Math.round(avgCalories)} cal`,
        trend: 0.7,
        icon: <Zap className="w-4 h-4" />,
        color: 'text-red-600'
      })
    }

    // Análise de frequência cardíaca (se disponível)
    const activitiesWithHR = activities.filter(a => a.average_heartrate)
    if (activitiesWithHR.length >= 3) {
      const avgHR = activitiesWithHR.reduce((sum, a) => sum + (a.average_heartrate || 0), 0) / activitiesWithHR.length
      
      insightList.push({
        id: 'heartrate-analysis',
        type: 'milestone',
        title: 'Monitoramento cardíaco ativo 💗',
        description: `FC média de ${Math.round(avgHR)} bpm. Continue monitorando para otimizar seus treinos.`,
        value: `${Math.round(avgHR)} bpm`,
        trend: 0.6,
        icon: <TrendingUp className="w-4 h-4" />,
        color: 'text-pink-600'
      })
    }

    setInsights(insightList)
  }

  const getInsightBackground = (type: string) => {
    switch (type) {
      case 'improvement': return 'bg-green-50 border-green-200'
      case 'decline': return 'bg-orange-50 border-orange-200'
      case 'milestone': return 'bg-purple-50 border-purple-200'
      case 'suggestion': return 'bg-blue-50 border-blue-200'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  const getInsightBadgeColor = (type: string) => {
    switch (type) {
      case 'improvement': return 'bg-green-100 text-green-800 border-green-300'
      case 'decline': return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'milestone': return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'suggestion': return 'bg-blue-100 text-blue-800 border-blue-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  if (insights.length === 0) return null

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-500" />
          Insights de Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className={`p-4 rounded-lg border ${getInsightBackground(insight.type)} transition-all hover:shadow-md`}
            >
              <div className="flex items-start gap-3">
                <div className={`${insight.color} mt-1`}>
                  {insight.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={`font-semibold ${insight.color}`}>
                      {insight.title}
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${insight.color}`}>
                        {insight.value}
                      </span>
                      <Badge variant="outline" className={getInsightBadgeColor(insight.type)}>
                        {insight.type}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm">
                    {insight.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t text-center">
          <p className="text-sm text-gray-600">
            Insights baseados nos últimos {activities.length} treinos
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default PerformanceInsights
