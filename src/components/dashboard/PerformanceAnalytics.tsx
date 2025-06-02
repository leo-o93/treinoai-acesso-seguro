
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useQuery } from '@tanstack/react-query'
import { getStravaActivities, getWeeklyStats } from '@/lib/database'
import { useAuth } from '@/hooks/useAuth'
import { TrendingUp, TrendingDown, Target, Calendar, Activity } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { format, subDays, eachDayOfInterval } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const PerformanceAnalytics: React.FC = () => {
  const { user } = useAuth()

  const { data: activities } = useQuery({
    queryKey: ['strava-activities-analytics', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      return await getStravaActivities(user.id, 30) // Últimas 30 atividades
    },
    enabled: !!user?.id
  })

  const { data: weeklyStats } = useQuery({
    queryKey: ['weekly-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      return await getWeeklyStats(user.id)
    },
    enabled: !!user?.id
  })

  // Processar dados para gráficos
  const processChartData = () => {
    if (!activities || activities.length === 0) return []

    const last14Days = eachDayOfInterval({
      start: subDays(new Date(), 13),
      end: new Date()
    })

    return last14Days.map(day => {
      const dayActivities = activities.filter(activity => {
        const activityDate = new Date(activity.start_date)
        return activityDate.toDateString() === day.toDateString()
      })

      const totalDistance = dayActivities.reduce((sum, activity) => sum + (activity.distance || 0), 0) / 1000 // em km
      const totalCalories = dayActivities.reduce((sum, activity) => sum + (activity.calories || 0), 0)
      const totalTime = dayActivities.reduce((sum, activity) => sum + (activity.moving_time || 0), 0) / 60 // em minutos

      return {
        date: format(day, 'dd/MM', { locale: ptBR }),
        distance: Math.round(totalDistance * 10) / 10,
        calories: totalCalories,
        time: Math.round(totalTime),
        activities: dayActivities.length
      }
    })
  }

  const chartData = processChartData()

  // Calcular tendências
  const calculateTrend = (data: any[], key: string) => {
    if (data.length < 2) return 'stable'
    
    const recent = data.slice(-7).reduce((sum, item) => sum + (item[key] || 0), 0) / 7
    const previous = data.slice(-14, -7).reduce((sum, item) => sum + (item[key] || 0), 0) / 7
    
    if (recent > previous * 1.1) return 'up'
    if (recent < previous * 0.9) return 'down'
    return 'stable'
  }

  const distanceTrend = calculateTrend(chartData, 'distance')
  const caloriesTrend = calculateTrend(chartData, 'calories')

  // Estatísticas resumidas
  const totalDistance = chartData.reduce((sum, day) => sum + day.distance, 0)
  const totalCalories = chartData.reduce((sum, day) => sum + day.calories, 0)
  const totalActivities = chartData.reduce((sum, day) => sum + day.activities, 0)
  const avgDistance = totalActivities > 0 ? totalDistance / totalActivities : 0

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Distância (14 dias)</p>
                <p className="text-2xl font-bold">{totalDistance.toFixed(1)} km</p>
              </div>
              <div className="flex items-center gap-1">
                {distanceTrend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
                {distanceTrend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
                {distanceTrend === 'stable' && <Target className="w-4 h-4 text-gray-500" />}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Calorias Queimadas</p>
                <p className="text-2xl font-bold">{totalCalories.toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-1">
                {caloriesTrend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
                {caloriesTrend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
                {caloriesTrend === 'stable' && <Target className="w-4 h-4 text-gray-500" />}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Atividades</p>
                <p className="text-2xl font-bold">{totalActivities}</p>
              </div>
              <Activity className="w-4 h-4 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Distância Média</p>
                <p className="text-2xl font-bold">{avgDistance.toFixed(1)} km</p>
              </div>
              <Target className="w-4 h-4 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Distância */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Evolução da Distância (Últimos 14 dias)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                formatter={(value: any, name: string) => [
                  `${value} km`, 
                  'Distância'
                ]}
                labelFormatter={(label) => `Data: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="distance" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Calorias */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-orange-500" />
            Calorias Queimadas por Dia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                formatter={(value: any, name: string) => [
                  `${value} cal`, 
                  'Calorias'
                ]}
                labelFormatter={(label) => `Data: ${label}`}
              />
              <Bar 
                dataKey="calories" 
                fill="#f97316"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Estatísticas da Semana */}
      {weeklyStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-500" />
              Resumo da Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{weeklyStats.totalWorkouts}</div>
                <div className="text-sm text-gray-600">Treinos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{(weeklyStats.totalDistance / 1000).toFixed(1)} km</div>
                <div className="text-sm text-gray-600">Distância</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{weeklyStats.totalCalories.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Calorias</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{Math.round(weeklyStats.totalTime / 60)}h</div>
                <div className="text-sm text-gray-600">Tempo Total</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Insights e Recomendações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {distanceTrend === 'up' && (
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-800">
                  Excelente! Sua distância semanal está aumentando. Continue assim!
                </span>
              </div>
            )}
            
            {distanceTrend === 'down' && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
                <TrendingDown className="w-4 h-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">
                  Sua distância diminuiu esta semana. Que tal aumentar gradualmente?
                </span>
              </div>
            )}

            {totalActivities < 3 && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <Target className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-800">
                  Tente manter pelo menos 3 atividades por semana para melhores resultados.
                </span>
              </div>
            )}

            {avgDistance > 5 && (
              <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                <Badge className="bg-purple-100 text-purple-800">Parabéns!</Badge>
                <span className="text-sm text-purple-800">
                  Sua distância média por treino está excelente ({avgDistance.toFixed(1)}km)!
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PerformanceAnalytics
