
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Target, Calendar, TrendingUp } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getUserGoals } from '@/lib/database'
import { useAuth } from '@/hooks/useAuth'
import { format, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const GoalSummary: React.FC = () => {
  const { user } = useAuth()

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['user-goals', user?.id],
    queryFn: () => getUserGoals(user!.id),
    enabled: !!user?.id
  })

  const activeGoal = goals.find(goal => goal.status === 'active')

  if (isLoading) {
    return (
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Resumo do Objetivo Atual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-6 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!activeGoal) {
    return (
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Resumo do Objetivo Atual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhum objetivo ativo encontrado</p>
            <p className="text-sm">Defina um objetivo para começar sua jornada</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const progressPercentage = activeGoal.target_value 
    ? Math.min(((activeGoal.current_value || 0) / activeGoal.target_value) * 100, 100)
    : 0

  const daysRemaining = activeGoal.target_date 
    ? differenceInDays(new Date(activeGoal.target_date), new Date())
    : null

  const commitmentLevel = progressPercentage > 75 ? 'Alto' : 
                         progressPercentage > 50 ? 'Médio' : 
                         progressPercentage > 25 ? 'Baixo' : 'Crítico'

  const commitmentColor = progressPercentage > 75 ? 'bg-green-500' : 
                         progressPercentage > 50 ? 'bg-yellow-500' : 
                         progressPercentage > 25 ? 'bg-orange-500' : 'bg-red-500'

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Resumo do Objetivo Atual
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Objetivo Principal */}
        <div>
          <h3 className="font-semibold text-lg text-gray-900 mb-2">
            {activeGoal.goal_type}: {activeGoal.target_value} {activeGoal.unit}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
            <Calendar className="w-4 h-4" />
            {activeGoal.target_date ? (
              <span>
                Prazo: {format(new Date(activeGoal.target_date), 'dd/MM/yyyy', { locale: ptBR })}
                {daysRemaining !== null && (
                  <span className={`ml-2 ${daysRemaining < 30 ? 'text-orange-600' : 'text-green-600'}`}>
                    ({daysRemaining > 0 ? `${daysRemaining} dias restantes` : 'Prazo vencido'})
                  </span>
                )}
              </span>
            ) : (
              <span>Sem prazo definido</span>
            )}
          </div>
        </div>

        {/* Progresso */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">Progresso</span>
            <span className="text-sm font-bold text-gray-900">
              {(activeGoal.current_value || 0).toFixed(1)} / {activeGoal.target_value} {activeGoal.unit}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">{progressPercentage.toFixed(1)}% concluído</span>
            <Badge variant="outline" className={`text-white ${commitmentColor}`}>
              <TrendingUp className="w-3 h-3 mr-1" />
              {commitmentLevel}
            </Badge>
          </div>
        </div>

        {/* Motivação */}
        <div className="mt-4 p-3 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg">
          <p className="text-sm text-emerald-800 font-medium">
            {progressPercentage > 75 ? '🎉 Excelente progresso! Continue assim!' :
             progressPercentage > 50 ? '💪 Você está no caminho certo!' :
             progressPercentage > 25 ? '⚡ Vamos acelerar o ritmo!' :
             '🚀 É hora de focar no seu objetivo!'}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default GoalSummary
