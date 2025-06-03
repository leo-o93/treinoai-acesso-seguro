
import React from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Navbar } from '@/components/layout/Navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Dumbbell, Apple, Calendar, User, Bot } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const PlanoAtual = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const planId = searchParams.get('id')
  const planType = searchParams.get('type') as 'training' | 'nutrition'

  const { data: plan, isLoading } = useQuery({
    queryKey: ['plan-detail', planId, planType],
    queryFn: async () => {
      if (!planId || !planType) return null
      
      const table = planType === 'training' ? 'training_plans' : 'nutrition_plans'
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', planId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!planId && !!planType
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto py-8">
          <div className="animate-pulse">Carregando plano...</div>
        </div>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto py-8">
          <div className="text-center">
            <p className="text-gray-600">Plano não encontrado.</p>
            <Button onClick={() => navigate('/dashboard')} className="mt-4">
              Voltar ao Dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const isTrainingPlan = planType === 'training'
  const Icon = isTrainingPlan ? Dumbbell : Apple
  const color = isTrainingPlan ? 'emerald' : 'orange'
  const planData = isTrainingPlan ? plan.plan_data : plan.meal_plan

  const renderPlanContent = () => {
    if (planData?.created_via === 'ai_chat' && planData?.messages) {
      return (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Conversas com a IA:</h3>
          {planData.messages.map((message: any, index: number) => (
            <div key={index} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <Bot className="w-5 h-5 text-blue-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {format(new Date(message.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )
    }

    if (planData?.created_via === 'user_upload' && planData?.content) {
      return (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Plano Enviado:</h3>
          <div className="bg-gray-50 p-4 rounded-lg border">
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{planData.content}</p>
          </div>
        </div>
      )
    }

    return (
      <div className="text-center py-8 text-gray-500">
        <p>Detalhes do plano não disponíveis.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div className="flex items-center gap-2">
              <Icon className={`w-6 h-6 text-${color}-500`} />
              <h1 className="text-2xl font-bold text-gray-900">
                {isTrainingPlan ? 'Plano de Treino' : 'Plano Nutricional'}
              </h1>
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{plan.title}</CardTitle>
                  <p className="text-gray-600 mt-2">{plan.description}</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant={plan.created_by_ai ? 'default' : 'secondary'}>
                    {plan.created_by_ai ? 'Criado pela IA' : 'Enviado pelo usuário'}
                  </Badge>
                  <Badge variant="outline">
                    {plan.status === 'active' ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-500 mt-4">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Criado em {format(new Date(plan.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                </div>
                {isTrainingPlan && plan.difficulty_level && (
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    Nível: {plan.difficulty_level}
                  </div>
                )}
                {!isTrainingPlan && plan.daily_calories && (
                  <div className="flex items-center gap-1">
                    <Apple className="w-4 h-4" />
                    {plan.daily_calories} calorias/dia
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              {renderPlanContent()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default PlanoAtual
