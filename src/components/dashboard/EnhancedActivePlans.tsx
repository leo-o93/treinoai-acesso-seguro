
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { TrainingPlan, NutritionPlan } from '@/lib/database'
import { Dumbbell, Apple, Plus, Eye } from 'lucide-react'
import { PlanCreationChat } from './PlanCreationChat'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export const EnhancedActivePlans: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showTrainingChat, setShowTrainingChat] = useState(false)
  const [showNutritionChat, setShowNutritionChat] = useState(false)

  const { data: trainingPlans = [] } = useQuery({
    queryKey: ['training-plans', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const { data, error } = await supabase
        .from('training_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!user?.id
  })

  const { data: nutritionPlans = [] } = useQuery({
    queryKey: ['nutrition-plans', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const { data, error } = await supabase
        .from('nutrition_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!user?.id
  })

  const calculateProgress = (createdAt: string, durationWeeks?: number) => {
    if (!durationWeeks) return 0
    
    const created = new Date(createdAt)
    const now = new Date()
    const weeksPassed = Math.floor((now.getTime() - created.getTime()) / (7 * 24 * 60 * 60 * 1000))
    
    return Math.min((weeksPassed / durationWeeks) * 100, 100)
  }

  const handlePlanCreated = (planData: any) => {
    queryClient.invalidateQueries({ queryKey: ['training-plans'] })
    queryClient.invalidateQueries({ queryKey: ['nutrition-plans'] })
  }

  const viewPlan = (planId: string, planType: 'training' | 'nutrition') => {
    navigate(`/plano?id=${planId}&type=${planType}`)
  }

  const activePlan = trainingPlans[0]
  const activeNutritionPlan = nutritionPlans[0]

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
          {activePlan ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900">{activePlan.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{activePlan.description}</p>
              </div>
              
              {activePlan.duration_weeks && (
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progresso</span>
                    <span>{Math.round(calculateProgress(activePlan.created_at, activePlan.duration_weeks))}%</span>
                  </div>
                  <Progress 
                    value={calculateProgress(activePlan.created_at, activePlan.duration_weeks)} 
                    className="h-2"
                  />
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  Nível: {activePlan.difficulty_level}
                </span>
                <Button
                  size="sm"
                  onClick={() => viewPlan(activePlan.id, 'training')}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Plano
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500 mb-4">Nenhum plano de treino ativo</p>
              <Dialog open={showTrainingChat} onOpenChange={setShowTrainingChat}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Plano
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <PlanCreationChat
                    planType="training"
                    onPlanCreated={handlePlanCreated}
                    onClose={() => setShowTrainingChat(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          )}
          
          {activePlan && (
            <div className="mt-4 border-t pt-4">
              <Dialog open={showTrainingChat} onOpenChange={setShowTrainingChat}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Novo Plano
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <PlanCreationChat
                    planType="training"
                    onPlanCreated={handlePlanCreated}
                    onClose={() => setShowTrainingChat(false)}
                  />
                </DialogContent>
              </Dialog>
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
          {activeNutritionPlan ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900">{activeNutritionPlan.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{activeNutritionPlan.description}</p>
              </div>
              
              {activeNutritionPlan.daily_calories && (
                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="text-center">
                    <span className="text-2xl font-bold text-orange-600">
                      {activeNutritionPlan.daily_calories}
                    </span>
                    <p className="text-sm text-gray-600">calorias/dia</p>
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  Criado pela IA
                </span>
                <Button
                  size="sm"
                  onClick={() => viewPlan(activeNutritionPlan.id, 'nutrition')}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Plano
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500 mb-4">Nenhum plano nutricional ativo</p>
              <Dialog open={showNutritionChat} onOpenChange={setShowNutritionChat}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Plano
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <PlanCreationChat
                    planType="nutrition"
                    onPlanCreated={handlePlanCreated}
                    onClose={() => setShowNutritionChat(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          )}
          
          {activeNutritionPlan && (
            <div className="mt-4 border-t pt-4">
              <Dialog open={showNutritionChat} onOpenChange={setShowNutritionChat}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Novo Plano
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <PlanCreationChat
                    planType="nutrition"
                    onPlanCreated={handlePlanCreated}
                    onClose={() => setShowNutritionChat(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
