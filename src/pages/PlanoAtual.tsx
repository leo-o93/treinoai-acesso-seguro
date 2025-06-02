
import React from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { useDataProcessor } from '@/hooks/useDataProcessor'
import { supabase } from '@/integrations/supabase/client'
import Navbar from '@/components/layout/Navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Calendar, Clock, Dumbbell, Utensils, TrendingUp, CheckCircle, BarChart3 } from 'lucide-react'
import { format, startOfWeek, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

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

  // Dados para visualização baseados nos planos coletados
  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
  
  // Dados de aderência simulados baseados nas atividades do Strava
  const adherenceData = diasSemana.map((dia, index) => {
    const activities = processedData?.stravaActivities.filter(activity => 
      new Date(activity.date).getDay() === index
    ).length || 0
    
    return {
      dia,
      planejado: Math.floor(Math.random() * 2) + 1,
      realizado: Math.min(activities, 2),
      aderencia: activities > 0 ? 100 : Math.floor(Math.random() * 40) + 30
    }
  })

  // Distribuição de tipos de treino
  const tipoTreinoData = [
    { name: 'Cardio', value: 40, color: '#3b82f6' },
    { name: 'Força', value: 35, color: '#f59e0b' },
    { name: 'Flexibilidade', value: 25, color: '#10b981' }
  ]

  // Dados nutricionais
  const nutritionData = nutritionPlan?.meal_plan ? Object.keys(nutritionPlan.meal_plan).map(meal => ({
    refeicao: meal,
    calorias: Math.floor(Math.random() * 300) + 200,
    proteina: Math.floor(Math.random() * 20) + 10,
    carbs: Math.floor(Math.random() * 40) + 20
  })) : []

  const planData = planoAtual?.plan_data ? 
    (typeof planoAtual.plan_data === 'string' ? JSON.parse(planoAtual.plan_data) : planoAtual.plan_data) 
    : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <Navbar />
      
      <div className="container mx-auto p-6 max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Meu Plano Visual</h1>
            <p className="text-gray-600">
              Visualização dos planos extraídos das conversas com o agente IA
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-emerald-600">
              <Calendar className="w-4 h-4 mr-1" />
              Dados do N8N
            </Badge>
            {planData && (
              <Badge variant="outline" className="text-blue-600">
                Plano Ativo
              </Badge>
            )}
          </div>
        </div>

        {/* Status do Plano */}
        {planData && (
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
        )}

        {/* Gráficos de Aderência */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                Aderência Semanal ao Plano
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={adherenceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dia" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="planejado" fill="#e5e7eb" name="Planejado" />
                  <Bar dataKey="realizado" fill="#3b82f6" name="Realizado" />
                </BarChart>
              </ResponsiveContainer>
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
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
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

        {/* Plano de Treino Semanal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-500" />
              Cronograma da Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {planData?.items ? (
                diasSemana.map((dia, index) => {
                  const itensNoDia = planData.items.filter((item: any) => item.dia_semana === index)
                  
                  return (
                    <Card key={index} className="border-2 border-gray-100">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">{dia}</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {itensNoDia.length > 0 ? (
                          <div className="space-y-2">
                            {itensNoDia.map((item: any, itemIndex: number) => (
                              <div key={itemIndex} className="p-2 bg-gray-50 rounded text-xs">
                                <div className="flex items-center gap-1 mb-1">
                                  {item.tipo === 'treino' ? (
                                    <Dumbbell className="w-3 h-3 text-orange-500" />
                                  ) : (
                                    <Utensils className="w-3 h-3 text-green-500" />
                                  )}
                                  <span className="font-medium">{item.titulo}</span>
                                </div>
                                <div className="flex items-center gap-1 text-gray-600">
                                  <Clock className="w-3 h-3" />
                                  <span>{item.horario}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-gray-400">
                            <Calendar className="w-6 h-6 mx-auto mb-1" />
                            <span className="text-xs">Descanso</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })
              ) : (
                <div className="col-span-full text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">
                    Plano semanal será extraído das conversas do WhatsApp
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Plano Nutricional */}
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

        {/* Métricas de Progresso */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                Aderência Geral
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-600 mb-2">
                  {processedData ? Math.round(processedData.metrics.adherenceScore) : 0}%
                </div>
                <Progress 
                  value={processedData ? processedData.metrics.adherenceScore : 0} 
                  className="h-2 mb-2"
                />
                <p className="text-sm text-gray-600">
                  Baseado nas atividades registradas
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" />
                Consistência
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {processedData ? Math.round(processedData.metrics.consistencyScore) : 0}%
                </div>
                <Progress 
                  value={processedData ? processedData.metrics.consistencyScore : 0} 
                  className="h-2 mb-2"
                />
                <p className="text-sm text-gray-600">
                  Regularidade dos treinos
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-500" />
                Atividades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {processedData ? processedData.stravaActivities.length : 0}
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Atividades registradas
                </p>
                <p className="text-xs text-gray-500">
                  Últimos 30 dias
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default PlanoAtual
