
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dumbbell, Clock, CheckCircle, AlertCircle, Play } from 'lucide-react'
import { TrainingPlan } from '@/lib/database'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface DetailedTrainingPlanProps {
  trainingPlan: TrainingPlan | null
}

const DetailedTrainingPlan: React.FC<DetailedTrainingPlanProps> = ({ trainingPlan }) => {
  if (!trainingPlan) {
    return (
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-blue-500" />
            Plano de Treino Atual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Dumbbell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhum plano de treino ativo</p>
            <p className="text-sm">Aguarde a criação do seu plano personalizado</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const planData = trainingPlan.plan_data as any
  const workouts = planData?.workouts || planData?.sessions || []

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-blue-500" />
          Plano de Treino Atual
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Informações do Plano */}
        <div className="border-b pb-4">
          <h3 className="font-semibold text-lg text-gray-900 mb-2">{trainingPlan.title}</h3>
          {trainingPlan.description && (
            <p className="text-sm text-gray-600 mb-2">{trainingPlan.description}</p>
          )}
          <div className="flex items-center gap-4 text-sm">
            <Badge variant="outline" className="bg-blue-50">
              {trainingPlan.duration_weeks} semanas
            </Badge>
            {trainingPlan.difficulty_level && (
              <Badge variant="outline" className="bg-purple-50">
                {trainingPlan.difficulty_level}
              </Badge>
            )}
            <Badge variant="outline" className={trainingPlan.status === 'active' ? 'bg-green-50' : 'bg-gray-50'}>
              {trainingPlan.status}
            </Badge>
          </div>
        </div>

        {/* Lista de Treinos */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Próximos Treinos</h4>
          {workouts.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {workouts.slice(0, 5).map((workout: any, index: number) => {
                const isCompleted = workout.status === 'completed'
                const isPending = workout.status === 'pending' || !workout.status
                
                return (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      isCompleted ? 'bg-green-50 border-green-200' :
                      isPending ? 'bg-yellow-50 border-yellow-200' :
                      'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-medium text-gray-900">
                            {workout.name || workout.title || `Treino ${index + 1}`}
                          </h5>
                          {isCompleted ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : isPending ? (
                            <AlertCircle className="w-4 h-4 text-yellow-500" />
                          ) : (
                            <Clock className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        
                        {workout.description && (
                          <p className="text-sm text-gray-600 mb-2">{workout.description}</p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          {workout.duration && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {workout.duration}
                            </span>
                          )}
                          {workout.exercises && (
                            <span>{workout.exercises.length} exercícios</span>
                          )}
                          {workout.date && (
                            <span>
                              {format(new Date(workout.date), 'dd/MM', { locale: ptBR })}
                            </span>
                          )}
                        </div>

                        {workout.exercises && workout.exercises.length > 0 && (
                          <div className="mt-2 text-xs text-gray-600">
                            <span className="font-medium">Exercícios: </span>
                            {workout.exercises.slice(0, 3).map((ex: any) => ex.name || ex).join(', ')}
                            {workout.exercises.length > 3 && ` +${workout.exercises.length - 3} mais`}
                          </div>
                        )}
                      </div>
                      
                      {isPending && (
                        <Button size="sm" variant="outline" className="ml-2">
                          <Play className="w-3 h-3 mr-1" />
                          Iniciar
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <p className="text-sm">Nenhum treino programado</p>
            </div>
          )}
        </div>

        {/* Performance */}
        {planData?.performance && (
          <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
            <h5 className="font-medium text-blue-800 mb-1">Avaliação de Performance</h5>
            <p className="text-sm text-blue-700">{planData.performance}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default DetailedTrainingPlan
