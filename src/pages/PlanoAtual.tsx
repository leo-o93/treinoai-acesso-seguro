
import React from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { useDataProcessor } from '@/hooks/useDataProcessor'
import { supabase } from '@/integrations/supabase/client'
import Navbar from '@/components/layout/Navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Calendar, Clock, Dumbbell, Utensils, TrendingUp, CheckCircle, BarChart3, Activity, AlertCircle } from 'lucide-react'
import { format, startOfWeek, addDays, isToday, isTomorrow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'

const PlanoAtual: React.FC = () => {
  const { user } = useAuth()
  const { data: processedData, isLoading: dataLoading } = useDataProcessor()

  const { data: planoAtual, isLoading } = useQuery({
    queryKey: ['current-plan', user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      
      const { data, error } = await supabase
        .from('training_plans_history')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) throw error
      return data
    },
    enabled: !!user?.id
  })

  const { data: nutritionPlan } = useQuery({
    queryKey: ['nutrition-plan', user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      
      const { data, error } = await supabase
        .from('nutrition_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) throw error
      return data
    },
    enabled: !!user?.id
  })

  if (isLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
        <Navbar />
        <div className="container mx-auto p-6 max-w-6xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Dados reais de aderência baseados nas atividades do Strava
  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
  
  const adherenceData = diasSemana.map((dia, index) => {
    const activitiesToday = processedData?.stravaActivities.filter(activity => 
      new Date(activity.date).getDay() === index &&
      new Date(activity.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ) || []
    
    const eventsToday = processedData?.calendarEvents.filter(event =>
      new Date(event.startTime).getDay() === index &&
      new Date(event.startTime) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) &&
      event.type === 'workout'
    ) || []
    
    return {
      dia,
      planejado: eventsToday.length || (index % 2 === 0 ? 1 : 0), // Dias alternados como exemplo
      realizado: activitiesToday.length,
      aderencia: activitiesToday.length > 0 ? 100 : 0
    }
  })

  // Distribuição real de tipos de treino baseada no Strava
  const tipoTreinoData = React.useMemo(() => {
    if (!processedData?.stravaActivities.length) {
      return [
        { name: 'Sem dados', value: 100, color: '#e5e7eb' }
      ]
    }

    const typeCount = processedData.stravaActivities.reduce((acc, activity) => {
      const type = activity.type
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const total = processedData.stravaActivities.length
    const colors = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6']
    
    return Object.entries(typeCount).map(([name, count], index) => ({
      name: name === 'Run' ? 'Corrida' : 
            name === 'Ride' ? 'Ciclismo' : 
            name === 'Walk' ? 'Caminhada' : name,
      value: (count / total) * 100,
      color: colors[index % colors.length]
    }))
  }, [processedData])

  // Dados nutricionais reais
  const nutritionData = processedData?.nutritionPlans.length > 0 ? 
    processedData.nutritionPlans[0].meals.map(meal => ({
      refeicao: meal.name,
      calorias: meal.calories,
      proteina: Math.round(meal.calories * 0.25 / 4),
      carbs: Math.round(meal.calories * 0.5 / 4)
    })) : []

  const planData = planoAtual?.plan_data ? 
    (typeof planoAtual.plan_data === 'string' ? JSON.parse(planoAtual.plan_data) : planoAtual.plan_data) 
    : null

  // Dados de performance semanal real
  const weeklyPerformanceData = React.useMemo(() => {
    if (!processedData?.stravaActivities.length) return []

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return date
    })

    return last7Days.map((date, index) => {
      const dayActivities = processedData.stravaActivities.filter(activity => {
        const activityDate = new Date(activity.date)
        return activityDate.toDateString() === date.toDateString()
      })

      return {
        dia: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
        distancia: dayActivities.reduce((sum, a) => sum + a.distance, 0),
        tempo: dayActivities.reduce((sum, a) => sum + a.duration, 0),
        calorias: dayActivities.reduce((sum, a) => sum + a.calories, 0)
      }
    })
  }, [processedData])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <Navbar />
      
      <div className="container mx-auto p-6 max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Meu Plano Atual</h1>
            <p className="text-gray-600">
              Dados reais extraídos das conversas e atividades do Strava
            </p>
          </div>
          <div className="flex items-center gap-2">
            {processedData && (
              <>
                <Badge variant="outline" className="text-emerald-600">
                  <Activity className="w-4 h-4 mr-1" />
                  {processedData.stravaActivities.length} Atividades
                </Badge>
                <Badge variant="outline" className="text-blue-600">
                  <Calendar className="w-4 h-4 mr-1" />
                  {processedData.calendarEvents.length} Eventos
                </Badge>
              </>
            )}
          </div>
        </div>

        {/* Status do Plano */}
        {planData ? (
          <Card className="bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                  <div>
                    <span className="font-medium text-emerald-800">
                      Plano Ativo Identificado
                    </span>
                    <p className="text-sm text-emerald-700">
                      Objetivo: {planData.objetivo || 'Melhoria geral da condição física'}
                    </p>
                  </div>
                </div>
                <div className="text-sm text-emerald-700">
                  Criado em: {format(new Date(planoAtual.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
                <div>
                  <span className="font-medium text-yellow-800">
                    Nenhum Plano Ativo Detectado
                  </span>
                  <p className="text-sm text-yellow-700">
                    Continue conversando com o TrainerAI para gerar seu plano personalizado
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Aderência Semanal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {processedData ? Math.round(processedData.metrics.adherenceScore) : 0}%
              </div>
              <Progress value={processedData ? processedData.metrics.adherenceScore : 0} className="h-2 mt-2" />
              <p className="text-xs text-gray-500 mt-1">Meta: 80%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Consistência</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {processedData ? Math.round(processedData.metrics.consistencyScore) : 0}%
              </div>
              <Progress value={processedData ? processedData.metrics.consistencyScore : 0} className="h-2 mt-2" />
              <p className="text-xs text-gray-500 mt-1">Última semana</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Distância Semanal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {processedData ? processedData.metrics.weeklyProgress.totalDistance.toFixed(1) : 0}km
              </div>
              <p className="text-xs text-gray-500 mt-1">Últimos 7 dias</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Tempo Ativo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {processedData ? Math.round(processedData.metrics.weeklyProgress.totalTime) : 0}min
              </div>
              <p className="text-xs text-gray-500 mt-1">Esta semana</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos de Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                Performance Semanal Real
              </CardTitle>
            </CardHeader>
            <CardContent>
              {weeklyPerformanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={weeklyPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="dia" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="distancia" fill="#3b82f6" name="Distância (km)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Dados aparecerão conforme atividades forem registradas</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-orange-500" />
                Distribuição dos Treinos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={tipoTreinoData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name} ${value.toFixed(0)}%`}
                  >
                    {tipoTreinoData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Agenda Semanal Real */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-500" />
              Agenda da Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
              {diasSemana.map((dia, index) => {
                const today = new Date()
                const dayDate = new Date()
                dayDate.setDate(today.getDate() - today.getDay() + index)
                
                const eventsToday = processedData?.calendarEvents.filter(event => {
                  const eventDate = new Date(event.startTime)
                  return eventDate.toDateString() === dayDate.toDateString()
                }) || []

                const activitiesToday = processedData?.stravaActivities.filter(activity => {
                  const activityDate = new Date(activity.date)
                  return activityDate.toDateString() === dayDate.toDateString()
                }) || []

                const isCurrentDay = isToday(dayDate)
                const isTomorrowDay = isTomorrow(dayDate)

                return (
                  <Card key={index} className={`border-2 ${
                    isCurrentDay ? 'border-emerald-300 bg-emerald-50' : 
                    isTomorrowDay ? 'border-blue-300 bg-blue-50' : 
                    'border-gray-100'
                  }`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center justify-between">
                        <span>{dia}</span>
                        <span className="text-xs text-gray-500">
                          {format(dayDate, 'dd/MM')}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {/* Eventos Agendados */}
                        {eventsToday.map((event, eventIndex) => (
                          <div key={eventIndex} className="p-2 bg-blue-50 rounded text-xs">
                            <div className="flex items-center gap-1 mb-1">
                              <Calendar className="w-3 h-3 text-blue-500" />
                              <span className="font-medium">{event.title}</span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-600">
                              <Clock className="w-3 h-3" />
                              <span>{format(new Date(event.startTime), 'HH:mm')}</span>
                            </div>
                          </div>
                        ))}

                        {/* Atividades Realizadas */}
                        {activitiesToday.map((activity, activityIndex) => (
                          <div key={activityIndex} className="p-2 bg-emerald-50 rounded text-xs">
                            <div className="flex items-center gap-1 mb-1">
                              <CheckCircle className="w-3 h-3 text-emerald-500" />
                              <span className="font-medium">{activity.name}</span>
                            </div>
                            <div className="text-gray-600">
                              {activity.distance > 0 && (
                                <span>{activity.distance.toFixed(1)}km • </span>
                              )}
                              <span>{activity.duration.toFixed(0)}min</span>
                            </div>
                          </div>
                        ))}

                        {eventsToday.length === 0 && activitiesToday.length === 0 && (
                          <div className="text-center py-4 text-gray-400">
                            <Calendar className="w-6 h-6 mx-auto mb-1" />
                            <span className="text-xs">
                              {isCurrentDay ? 'Hoje' : isTomorrowDay ? 'Amanhã' : 'Livre'}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Plano Nutricional Real */}
        {nutritionData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-green-500" />
                Plano Nutricional Extraído
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={nutritionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="refeicao" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="calorias" fill="#22c55e" name="Calorias" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Próximos Objetivos */}
        {processedData?.metrics.nextGoals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                Próximos Objetivos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {processedData.metrics.nextGoals.map((goal, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{index + 1}</span>
                    </div>
                    <span className="text-sm font-medium text-emerald-800">{goal}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default PlanoAtual
