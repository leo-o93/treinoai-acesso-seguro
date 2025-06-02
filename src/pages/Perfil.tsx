
import React from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { useDataProcessor } from '@/hooks/useDataProcessor'
import { supabase } from '@/integrations/supabase/client'
import Navbar from '@/components/layout/Navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { User, Target, Activity, Calendar, TrendingUp, Heart, AlertCircle } from 'lucide-react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const Perfil: React.FC = () => {
  const { user } = useAuth()
  const { data: processedData, isLoading: dataLoading } = useDataProcessor()

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile', user?.id],
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

  const { data: goals } = useQuery({
    queryKey: ['user-goals', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      
      const { data, error } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    },
    enabled: !!user?.id
  })

  if (isLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
        <Navbar />
        <div className="container mx-auto p-6 max-w-6xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Dados reais de progresso baseados no Strava
  const progressData = processedData?.stravaActivities.slice(0, 10).reverse().map((activity, index) => ({
    day: `${index + 1}`,
    distancia: activity.distance,
    pace: activity.pace,
    velocidade: activity.averageSpeed,
    calorias: activity.calories
  })) || []

  const goalProgressData = goals.map(goal => ({
    goal: goal.goal_type,
    progress: goal.current_value || 0,
    target: goal.target_value || 100,
    percentage: Math.min(((goal.current_value || 0) / (goal.target_value || 100)) * 100, 100)
  }))

  // Calcular estatísticas do perfil
  const calculateProfileCompleteness = () => {
    if (!profile) return 0
    
    const fields = [
      profile.age, profile.altura || profile.height, 
      profile.peso || profile.weight, profile.objetivo || profile.objective,
      profile.frequencia_semanal || profile.training_frequency,
      profile.experience_level
    ]
    
    const filledFields = fields.filter(field => field !== null && field !== undefined).length
    return (filledFields / fields.length) * 100
  }

  const profileCompleteness = calculateProfileCompleteness()

  // Calcular IMC
  const calculateBMI = () => {
    const weight = profile?.peso || profile?.weight
    const height = profile?.altura || profile?.height
    
    if (!weight || !height) return null
    
    const heightM = height / 100
    return (weight / (heightM * heightM)).toFixed(1)
  }

  const bmi = calculateBMI()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <Navbar />
      
      <div className="container mx-auto p-6 max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Perfil do Usuário</h1>
            <p className="text-gray-600">
              Dados extraídos automaticamente das conversas e atividades
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-emerald-600">
              <User className="w-4 h-4 mr-1" />
              {profileCompleteness.toFixed(0)}% Completo
            </Badge>
            {processedData && (
              <Badge variant="outline" className="text-blue-600">
                {processedData.stravaActivities.length} Atividades
              </Badge>
            )}
          </div>
        </div>

        {/* Status do Perfil */}
        {profileCompleteness < 70 && (
          <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <div>
                  <span className="font-medium text-yellow-800">
                    Perfil Incompleto ({profileCompleteness.toFixed(0)}%)
                  </span>
                  <p className="text-sm text-yellow-700">
                    Continue conversando com o TrainerAI para completar seu perfil automaticamente
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Informações Básicas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-500" />
                Dados Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile ? (
                <>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {profile.age || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">Anos</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-xl font-semibold">
                        {profile.altura || profile.height || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-600">Altura (cm)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-semibold">
                        {profile.peso || profile.weight || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-600">Peso (kg)</div>
                    </div>
                  </div>

                  {bmi && (
                    <div className="text-center pt-2 border-t">
                      <div className="text-lg font-semibold text-purple-600">{bmi}</div>
                      <div className="text-xs text-gray-600">IMC</div>
                    </div>
                  )}

                  <div className="pt-2 border-t">
                    <div className="text-sm font-medium text-gray-700 mb-2">Objetivo</div>
                    <Badge variant="outline" className="w-full justify-center p-2">
                      {profile.objetivo || profile.objective || 'Não definido'}
                    </Badge>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <User className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-gray-500">
                    Dados serão extraídos das conversas
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-orange-500" />
                Nível de Atividade
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile ? (
                <>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600">
                      {profile.frequencia_semanal || profile.training_frequency || 0}x
                    </div>
                    <div className="text-sm text-gray-600">por semana</div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Experiência</span>
                      <span className="capitalize">{profile.experience_level || 'Iniciante'}</span>
                    </div>
                    <Progress 
                      value={
                        profile.experience_level === 'avancado' ? 90 :
                        profile.experience_level === 'intermediario' ? 60 : 30
                      } 
                      className="h-2"
                    />
                  </div>

                  {processedData && (
                    <div className="pt-2 border-t space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Atividades Totais</span>
                        <span className="font-semibold">{processedData.stravaActivities.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Esta Semana</span>
                        <span className="font-semibold">{processedData.metrics.weeklyProgress.workoutsCompleted}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Aderência</span>
                        <span className="font-semibold">{processedData.metrics.adherenceScore.toFixed(0)}%</span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <Activity className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-gray-500">
                    Dados de atividade serão coletados
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-500" />
                Status dos Objetivos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {goalProgressData.length > 0 ? (
                goalProgressData.map((goal, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="capitalize">{goal.goal}</span>
                      <span>{goal.progress}/{goal.target}</span>
                    </div>
                    <Progress value={goal.percentage} className="h-2" />
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <Target className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-gray-500">
                    Objetivos serão extraídos das conversas
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Gráficos de Progresso Real */}
        {progressData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  Evolução da Distância
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="distancia" 
                      stroke="#22c55e" 
                      strokeWidth={2}
                      name="Distância (km)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  Desempenho Geral
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="velocidade" 
                      stackId="1"
                      stroke="#f59e0b" 
                      fill="#f59e0b"
                      fillOpacity={0.3}
                      name="Velocidade (km/h)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Preferências Alimentares Reais */}
        {(profile?.alimentos_disponiveis || profile?.restricoes_alimentares || profile?.food_preferences || profile?.restrictions) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-500" />
                Preferências Nutricionais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Alimentos Disponíveis</h4>
                  <div className="flex flex-wrap gap-2">
                    {(profile?.alimentos_disponiveis || profile?.food_preferences || []).map((food: string, index: number) => (
                      <Badge key={index} variant="outline" className="bg-green-50">
                        {food}
                      </Badge>
                    ))}
                    {(!profile?.alimentos_disponiveis && !profile?.food_preferences) && (
                      <Badge variant="outline" className="text-gray-500">
                        Será extraído das conversas
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Restrições</h4>
                  <div className="flex flex-wrap gap-2">
                    {(profile?.restricoes_alimentares || profile?.restrictions || []).map((restriction: string, index: number) => (
                      <Badge key={index} variant="outline" className="bg-red-50">
                        {restriction}
                      </Badge>
                    ))}
                    {(!profile?.restricoes_alimentares && !profile?.restrictions) && (
                      <Badge variant="outline" className="text-gray-500">
                        Nenhuma identificada
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default Perfil
