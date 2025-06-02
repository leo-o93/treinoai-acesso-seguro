
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Dumbbell, Utensils, Calendar, CheckCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { mcpAI, mcpAgendamento } from '@/lib/mcpClient'

interface PlanGenerationCardProps {
  userProfile: any
  onPlansGenerated?: () => void
}

const PlanGenerationCard: React.FC<PlanGenerationCardProps> = ({
  userProfile,
  onPlansGenerated
}) => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [generating, setGenerating] = useState(false)
  const [step, setStep] = useState<'idle' | 'training' | 'nutrition' | 'calendar' | 'complete'>('idle')

  const isProfileComplete = userProfile && 
    userProfile.objetivo && 
    userProfile.peso && 
    userProfile.altura && 
    userProfile.frequencia_semanal &&
    userProfile.alimentos_disponiveis?.length > 0

  const generatePlans = async () => {
    if (!isProfileComplete || !user) {
      toast({
        title: 'Perfil incompleto',
        description: 'Complete seu perfil primeiro para gerar os planos',
        variant: 'destructive'
      })
      return
    }

    setGenerating(true)
    setStep('training')

    try {
      // Step 1: Generate training plan
      console.log('🏋️ Gerando plano de treino...')
      const trainingResult = await mcpAI.gerarPlanoTreino(
        userProfile.objetivo,
        userProfile.peso,
        userProfile.altura,
        userProfile.frequencia_semanal
      )

      if (!trainingResult.success) {
        throw new Error('Erro ao gerar plano de treino')
      }

      setStep('nutrition')

      // Step 2: Generate nutrition plan
      console.log('🥗 Gerando plano de alimentação...')
      const nutritionResult = await mcpAI.gerarPlanoDieta(
        userProfile.objetivo,
        userProfile.peso,
        userProfile.altura,
        userProfile.alimentos_disponiveis || [],
        userProfile.restricoes_alimentares || []
      )

      if (!nutritionResult.success) {
        throw new Error('Erro ao gerar plano de alimentação')
      }

      setStep('calendar')

      // Step 3: Schedule in calendar
      console.log('📅 Agendando no calendário...')
      await scheduleTrainingPlan(trainingResult.data)
      await scheduleNutritionPlan(nutritionResult.data)

      setStep('complete')

      toast({
        title: 'Planos gerados com sucesso!',
        description: 'Seus planos de treino e alimentação foram criados e agendados no calendário'
      })

      onPlansGenerated?.()

    } catch (error) {
      console.error('Erro ao gerar planos:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar os planos. Tente novamente.',
        variant: 'destructive'
      })
    } finally {
      setGenerating(false)
      setTimeout(() => setStep('idle'), 3000)
    }
  }

  const scheduleTrainingPlan = async (trainingPlan: any) => {
    const workouts = trainingPlan?.workouts || []
    
    for (const workout of workouts.slice(0, 5)) { // Agenda próximos 5 treinos
      const startDate = new Date()
      startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 14)) // Próximas 2 semanas
      startDate.setHours(7, 0, 0, 0) // 7:00 AM por padrão
      
      const endDate = new Date(startDate)
      endDate.setHours(8, 0, 0, 0) // 1 hora de duração
      
      try {
        await mcpAgendamento.criarEvento(
          workout.name || 'Treino',
          workout.description || 'Treino personalizado gerado pelo TrainerAI',
          startDate.toISOString(),
          endDate.toISOString()
        )
      } catch (error) {
        console.error('Erro ao agendar treino:', error)
      }
    }
  }

  const scheduleNutritionPlan = async (nutritionPlan: any) => {
    const meals = nutritionPlan?.meals || []
    
    const mealTimes = [
      { name: 'Café da manhã', hour: 8 },
      { name: 'Lanche da manhã', hour: 10 },
      { name: 'Almoço', hour: 12 },
      { name: 'Lanche da tarde', hour: 15 },
      { name: 'Jantar', hour: 19 },
      { name: 'Ceia', hour: 21 }
    ]

    for (let day = 0; day < 7; day++) {
      for (const [index, mealTime] of mealTimes.entries()) {
        if (meals[index]) {
          const startDate = new Date()
          startDate.setDate(startDate.getDate() + day)
          startDate.setHours(mealTime.hour, 0, 0, 0)
          
          const endDate = new Date(startDate)
          endDate.setMinutes(30) // 30 minutos para refeição
          
          try {
            await mcpAgendamento.criarEvento(
              mealTime.name,
              meals[index].description || `${mealTime.name} - Plano nutricional TrainerAI`,
              startDate.toISOString(),
              endDate.toISOString()
            )
          } catch (error) {
            console.error('Erro ao agendar refeição:', error)
          }
        }
      }
    }
  }

  if (!isProfileComplete) {
    return (
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-blue-500" />
            Gerar Planos Personalizados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-gray-500 mb-4">
              <p className="font-medium mb-2">Complete seu perfil primeiro</p>
              <p className="text-sm">Precisamos de algumas informações para criar seus planos personalizados:</p>
            </div>
            <div className="space-y-2 text-sm text-left max-w-md mx-auto">
              <div className="flex items-center gap-2">
                {userProfile?.objetivo ? <CheckCircle className="w-4 h-4 text-green-500" /> : <div className="w-4 h-4 border-2 border-gray-300 rounded" />}
                <span>Objetivo definido</span>
              </div>
              <div className="flex items-center gap-2">
                {userProfile?.peso ? <CheckCircle className="w-4 h-4 text-green-500" /> : <div className="w-4 h-4 border-2 border-gray-300 rounded" />}
                <span>Peso informado</span>
              </div>
              <div className="flex items-center gap-2">
                {userProfile?.altura ? <CheckCircle className="w-4 h-4 text-green-500" /> : <div className="w-4 h-4 border-2 border-gray-300 rounded" />}
                <span>Altura informada</span>
              </div>
              <div className="flex items-center gap-2">
                {userProfile?.frequencia_semanal ? <CheckCircle className="w-4 h-4 text-green-500" /> : <div className="w-4 h-4 border-2 border-gray-300 rounded" />}
                <span>Frequência de treino</span>
              </div>
              <div className="flex items-center gap-2">
                {userProfile?.alimentos_disponiveis?.length > 0 ? <CheckCircle className="w-4 h-4 text-green-500" /> : <div className="w-4 h-4 border-2 border-gray-300 rounded" />}
                <span>Alimentos disponíveis</span>
              </div>
            </div>
            <Button variant="outline" className="mt-4" onClick={() => window.location.href = '/perfil'}>
              Completar Perfil
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-blue-500" />
          Gerar Planos Personalizados
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">Perfil Completo ✓</h4>
            <div className="flex flex-wrap gap-2 text-sm">
              <Badge variant="outline">{userProfile.objetivo}</Badge>
              <Badge variant="outline">{userProfile.peso}kg</Badge>
              <Badge variant="outline">{userProfile.altura}cm</Badge>
              <Badge variant="outline">{userProfile.frequencia_semanal}x/semana</Badge>
              <Badge variant="outline">{userProfile.alimentos_disponiveis?.length} alimentos</Badge>
            </div>
          </div>

          {generating && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium">
                  {step === 'training' && 'Gerando plano de treino...'}
                  {step === 'nutrition' && 'Gerando plano de alimentação...'}
                  {step === 'calendar' && 'Agendando no calendário...'}
                  {step === 'complete' && 'Concluído!'}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className={`flex items-center gap-2 text-sm ${step === 'training' || step === 'nutrition' || step === 'calendar' || step === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
                  <Dumbbell className="w-4 h-4" />
                  <span>Plano de Treino</span>
                  {(step === 'nutrition' || step === 'calendar' || step === 'complete') && <CheckCircle className="w-4 h-4" />}
                </div>
                <div className={`flex items-center gap-2 text-sm ${step === 'nutrition' || step === 'calendar' || step === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
                  <Utensils className="w-4 h-4" />
                  <span>Plano de Alimentação</span>
                  {(step === 'calendar' || step === 'complete') && <CheckCircle className="w-4 h-4" />}
                </div>
                <div className={`flex items-center gap-2 text-sm ${step === 'calendar' || step === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
                  <Calendar className="w-4 h-4" />
                  <span>Agendamento</span>
                  {step === 'complete' && <CheckCircle className="w-4 h-4" />}
                </div>
              </div>
            </div>
          )}

          <Button 
            onClick={generatePlans} 
            disabled={generating}
            className="w-full"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando planos...
              </>
            ) : (
              <>
                <Dumbbell className="w-4 h-4 mr-2" />
                Gerar Planos Completos
              </>
            )}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            Os planos serão gerados automaticamente e agendados no seu Google Calendar
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default PlanGenerationCard
