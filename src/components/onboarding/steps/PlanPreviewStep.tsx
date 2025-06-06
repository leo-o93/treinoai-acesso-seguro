
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Dumbbell, Apple, Calendar, Target } from 'lucide-react'

interface PlanPreviewStepProps {
  data: any
  updateData: (data: any) => void
  onNext?: () => void
  onComplete?: () => Promise<void>
  isSubmitting?: boolean
}

export const PlanPreviewStep: React.FC<PlanPreviewStepProps> = ({ 
  data, 
  onComplete, 
  isSubmitting 
}) => {
  const getGoalDescription = (goal: string) => {
    const goals = {
      lose_weight: 'Perder Peso',
      gain_muscle: 'Ganhar Massa Muscular',
      maintain: 'Manter Peso',
      improve_fitness: 'Melhorar Condicionamento'
    }
    return goals[goal as keyof typeof goals] || goal
  }

  const getLevelDescription = (level: string) => {
    const levels = {
      beginner: 'Iniciante',
      intermediate: 'Intermediário',
      advanced: 'Avançado'
    }
    return levels[level as keyof typeof levels] || level
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <CheckCircle className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Seu plano está pronto!
        </h3>
        <p className="text-gray-600">
          Revisão final dos seus planos personalizados
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Plano de Treino */}
        <Card className="border-emerald-200">
          <CardHeader>
            <CardTitle className="flex items-center text-emerald-600">
              <Dumbbell className="w-5 h-5 mr-2" />
              Plano de Treino
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Objetivo:</span>
              <Badge variant="outline">{getGoalDescription(data.primaryGoal)}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Nível:</span>
              <Badge variant="outline">{getLevelDescription(data.fitnessLevel)}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Frequência:</span>
              <span className="font-medium">{data.exerciseFrequency}x/semana</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Duração:</span>
              <span className="font-medium">{data.preferredWorkoutDuration} min</span>
            </div>
          </CardContent>
        </Card>

        {/* Plano Nutricional */}
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-600">
              <Apple className="w-5 h-5 mr-2" />
              Plano Nutricional
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Calorias diárias:</span>
              <span className="font-medium">{data.targetCalories} kcal</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Proteínas:</span>
              <span className="font-medium">{data.macros?.protein}g</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Carboidratos:</span>
              <span className="font-medium">{data.macros?.carbs}g</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Gorduras:</span>
              <span className="font-medium">{data.macros?.fats}g</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo Pessoal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2 text-blue-600" />
            Resumo do Seu Perfil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">{data.age}</div>
              <div className="text-sm text-gray-600">anos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{data.height}</div>
              <div className="text-sm text-gray-600">cm</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{data.weight}</div>
              <div className="text-sm text-gray-600">kg atual</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{data.bmr}</div>
              <div className="text-sm text-gray-600">kcal BMR</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferências */}
      {(data.foodPreferences?.length > 0 || data.dietaryRestrictions?.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Suas Preferências</CardTitle>
          </CardHeader>
          <CardContent>
            {data.foodPreferences?.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Alimentos Preferidos:</h4>
                <div className="flex flex-wrap gap-2">
                  {data.foodPreferences.map((food: string) => (
                    <Badge key={food} variant="secondary">{food}</Badge>
                  ))}
                </div>
              </div>
            )}
            
            {data.dietaryRestrictions?.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Restrições:</h4>
                <div className="flex flex-wrap gap-2">
                  {data.dietaryRestrictions.map((restriction: string) => (
                    <Badge key={restriction} variant="destructive">{restriction}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="bg-gradient-to-r from-blue-50 to-emerald-50 p-6 rounded-lg text-center">
        <h4 className="font-semibold text-gray-900 mb-2">🎉 Parabéns!</h4>
        <p className="text-gray-600 mb-4">
          Seus planos personalizados estão prontos. Vamos começar sua jornada de transformação!
        </p>
        <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            <span>Planos de 12 semanas</span>
          </div>
          <div className="flex items-center">
            <CheckCircle className="w-4 h-4 mr-1" />
            <span>Totalmente personalizados</span>
          </div>
        </div>
      </div>
    </div>
  )
}
