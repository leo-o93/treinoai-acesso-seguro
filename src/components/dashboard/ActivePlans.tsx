
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { TrainingPlan, NutritionPlan } from '@/lib/database'
import { Dumbbell, Apple } from 'lucide-react'

interface ActivePlansProps {
  trainingPlan?: TrainingPlan | null
  nutritionPlan?: NutritionPlan | null
}

const ActivePlans: React.FC<ActivePlansProps> = ({
  trainingPlan,
  nutritionPlan
}) => {
  const calculateProgress = (createdAt: string, durationWeeks?: number) => {
    if (!durationWeeks) return 0
    
    const created = new Date(createdAt)
    const now = new Date()
    const weeksPassed = Math.floor((now.getTime() - created.getTime()) / (7 * 24 * 60 * 60 * 1000))
    
    return Math.min((weeksPassed / durationWeeks) * 100, 100)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Plano de Treino */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Dumbbell className="w-5 h-5 mr-2 text-emerald-500" />
            Plano de Treino Ativo
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trainingPlan ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900">{trainingPlan.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{trainingPlan.description}</p>
              </div>
              
              {trainingPlan.duration_weeks && (
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progresso</span>
                    <span>{Math.round(calculateProgress(trainingPlan.created_at, trainingPlan.duration_weeks))}%</span>
                  </div>
                  <Progress 
                    value={calculateProgress(trainingPlan.created_at, trainingPlan.duration_weeks)} 
                    className="h-2"
                  />
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  Nível: {trainingPlan.difficulty_level}
                </span>
                <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600">
                  Ver Plano
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500 mb-4">Nenhum plano de treino ativo</p>
              <Button size="sm" variant="outline">
                Solicitar Plano
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plano de Nutrição */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Apple className="w-5 h-5 mr-2 text-orange-500" />
            Plano de Nutrição Ativo
          </CardTitle>
        </CardHeader>
        <CardContent>
          {nutritionPlan ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900">{nutritionPlan.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{nutritionPlan.description}</p>
              </div>
              
              {nutritionPlan.daily_calories && (
                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="text-center">
                    <span className="text-2xl font-bold text-orange-600">
                      {nutritionPlan.daily_calories}
                    </span>
                    <p className="text-sm text-gray-600">calorias/dia</p>
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  Criado pela IA
                </span>
                <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                  Ver Plano
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500 mb-4">Nenhum plano nutricional ativo</p>
              <Button size="sm" variant="outline">
                Solicitar Plano
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ActivePlans
