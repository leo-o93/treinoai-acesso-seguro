
import React from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Navbar } from '@/components/layout/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Target, TrendingUp, Activity, Trophy, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const Dashboard = () => {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto py-8">
          <div className="animate-pulse">Carregando...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto py-8">
          <div className="text-center">
            <p className="text-gray-600">Você precisa estar logado para acessar o dashboard.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Dashboard
            </h1>
            <p className="text-gray-600">
              Bem-vindo de volta! Aqui está um resumo do seu progresso.
            </p>
          </div>

          {/* Estatísticas Rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Trophy className="h-8 w-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Treinos Concluídos</p>
                    <p className="text-2xl font-bold text-gray-900">24</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Target className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Meta Semanal</p>
                    <p className="text-2xl font-bold text-gray-900">4/5</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Activity className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Calorias Queimadas</p>
                    <p className="text-2xl font-bold text-gray-900">1,240</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Tempo Total</p>
                    <p className="text-2xl font-bold text-gray-900">18h</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cards Principais */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2 text-blue-600" />
                  Próximo Treino
                </CardTitle>
                <CardDescription>
                  Seu treino agendado para hoje
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-medium text-blue-900">Treino A - Peito e Tríceps</h3>
                    <p className="text-sm text-blue-700">Duração estimada: 60-75 minutos</p>
                    <p className="text-sm text-blue-700">📍 Academia Central</p>
                  </div>
                  <Button 
                    className="w-full"
                    onClick={() => navigate('/plano')}
                  >
                    Ver Plano Completo
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                  Progresso Nutricional
                </CardTitle>
                <CardDescription>
                  Suas metas diárias de nutrição
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-lg font-bold text-green-600">1,840</p>
                      <p className="text-xs text-gray-600">Calorias</p>
                      <p className="text-xs text-green-600">760 restantes</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-lg font-bold text-blue-600">95g</p>
                      <p className="text-xs text-gray-600">Proteína</p>
                      <p className="text-xs text-blue-600">65g restantes</p>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <p className="text-lg font-bold text-orange-600">45g</p>
                      <p className="text-xs text-gray-600">Gordura</p>
                      <p className="text-xs text-orange-600">27g restantes</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate('/plano')}
                  >
                    Ver Plano Nutricional
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Agenda da Semana */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                Agenda da Semana
              </CardTitle>
              <CardDescription>
                Seus compromissos de treino e saúde
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
                {[
                  { day: 'Dom', activity: 'Descanso', color: 'bg-gray-100' },
                  { day: 'Seg', activity: 'Treino A', color: 'bg-blue-100 border-2 border-blue-300' },
                  { day: 'Ter', activity: 'Cardio', color: 'bg-green-100' },
                  { day: 'Qua', activity: 'Treino B', color: 'bg-blue-100' },
                  { day: 'Qui', activity: 'Treino C', color: 'bg-blue-100' },
                  { day: 'Sex', activity: 'Treino D', color: 'bg-blue-100' },
                  { day: 'Sáb', activity: 'Descanso', color: 'bg-gray-100' }
                ].map((item, index) => (
                  <div key={index} className={`p-3 rounded-lg text-center ${item.color}`}>
                    <p className="font-medium text-sm">{item.day}</p>
                    <div className="mt-2">
                      <div className="text-xs px-2 py-1 rounded">
                        {item.activity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Ações Rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Button 
              variant="outline" 
              className="h-20 flex flex-col"
              onClick={() => navigate('/plano')}
            >
              <Target className="h-6 w-6 mb-2" />
              Meu Plano Atual
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex flex-col"
              onClick={() => navigate('/integracoes')}
            >
              <Activity className="h-6 w-6 mb-2" />
              Integrações
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex flex-col"
              onClick={() => navigate('/perfil')}
            >
              <TrendingUp className="h-6 w-6 mb-2" />
              Meu Perfil
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
