
import React from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/layout/Navbar'
import { Calendar, Clock, Target, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const PlanoAtual = () => {
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
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-600">
                Você precisa estar logado para acessar seu plano atual.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Meu Plano Atual
            </h1>
            <p className="text-gray-600">
              Acompanhe seu progresso e veja os próximos treinos e refeições
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2 text-blue-600" />
                  Plano de Treino
                </CardTitle>
                <CardDescription>
                  Seu programa de exercícios personalizado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-medium">Treino de Hoje</p>
                      <p className="text-sm text-gray-600">Treino A - Peito e Tríceps</p>
                    </div>
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Próximos treinos:</p>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>• Amanhã: Treino B - Costas e Bíceps</p>
                      <p>• Quinta: Treino C - Pernas e Glúteos</p>
                      <p>• Sexta: Treino D - Ombros e Abdômen</p>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full"
                    onClick={() => navigate('/plano/treino-detalhado')}
                  >
                    Ver Detalhes do Treino
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                  Plano Nutricional
                </CardTitle>
                <CardDescription>
                  Suas refeições e metas nutricionais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-green-50 rounded">
                      <p className="text-lg font-bold text-green-600">2,600</p>
                      <p className="text-xs text-gray-600">Calorias</p>
                    </div>
                    <div className="p-2 bg-blue-50 rounded">
                      <p className="text-lg font-bold text-blue-600">160g</p>
                      <p className="text-xs text-gray-600">Proteína</p>
                    </div>
                    <div className="p-2 bg-orange-50 rounded">
                      <p className="text-lg font-bold text-orange-600">72g</p>
                      <p className="text-xs text-gray-600">Gordura</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Próximas refeições:</p>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>• Almoço: Frango grelhado com arroz e salada</p>
                      <p>• Lanche: Whey protein com banana</p>
                      <p>• Jantar: Salmão com batata doce</p>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate('/plano/nutricao-completa')}
                  >
                    Ver Plano Completo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                Cronograma da Semana
              </CardTitle>
              <CardDescription>
                Visão geral dos seus compromissos fitness
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, index) => (
                  <div key={day} className={`p-3 rounded-lg text-center ${
                    index === 1 ? 'bg-blue-100 border-2 border-blue-300' : 'bg-gray-50'
                  }`}>
                    <p className="font-medium text-sm">{day}</p>
                    <div className="mt-2 space-y-1">
                      {index === 0 && <div className="text-xs bg-red-200 rounded px-1">Descanso</div>}
                      {index === 1 && <div className="text-xs bg-blue-200 rounded px-1">Treino A</div>}
                      {index === 2 && <div className="text-xs bg-green-200 rounded px-1">Cardio</div>}
                      {index === 3 && <div className="text-xs bg-blue-200 rounded px-1">Treino B</div>}
                      {index === 4 && <div className="text-xs bg-blue-200 rounded px-1">Treino C</div>}
                      {index === 5 && <div className="text-xs bg-blue-200 rounded px-1">Treino D</div>}
                      {index === 6 && <div className="text-xs bg-red-200 rounded px-1">Descanso</div>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default PlanoAtual
