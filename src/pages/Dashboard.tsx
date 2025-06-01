
import React from 'react'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { signOut } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'
import withAuth from '@/components/auth/withAuth'
import StatsCard from '@/components/dashboard/StatsCard'
import PerformanceChart from '@/components/dashboard/PerformanceChart'
import UpcomingEvents from '@/components/dashboard/UpcomingEvents'
import ActivePlans from '@/components/dashboard/ActivePlans'
import RecentActivities from '@/components/dashboard/RecentActivities'
import { useAuth } from '@/hooks/useAuth'
import { 
  getUserProfile, 
  getStravaActivities, 
  getActiveTrainingPlan, 
  getActiveNutritionPlan,
  getUpcomingEvents,
  getWeeklyStats
} from '@/lib/database'
import { Activity, Calendar, Target, TrendingUp, Settings } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Queries para carregar dados do dashboard
  const { data: profile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: () => getUserProfile(user!.id),
    enabled: !!user?.id
  })

  const { data: activities = [] } = useQuery({
    queryKey: ['strava-activities', user?.id],
    queryFn: () => getStravaActivities(user!.id, 10),
    enabled: !!user?.id
  })

  const { data: trainingPlan } = useQuery({
    queryKey: ['training-plan', user?.id],
    queryFn: () => getActiveTrainingPlan(user!.id),
    enabled: !!user?.id
  })

  const { data: nutritionPlan } = useQuery({
    queryKey: ['nutrition-plan', user?.id],
    queryFn: () => getActiveNutritionPlan(user!.id),
    enabled: !!user?.id
  })

  const { data: upcomingEvents = [] } = useQuery({
    queryKey: ['upcoming-events', user?.id],
    queryFn: () => getUpcomingEvents(user!.id, 7),
    enabled: !!user?.id
  })

  const { data: weeklyStats } = useQuery({
    queryKey: ['weekly-stats', user?.id],
    queryFn: () => getWeeklyStats(user!.id),
    enabled: !!user?.id
  })

  const handleSignOut = async () => {
    try {
      const { error } = await signOut()
      if (error) {
        toast({
          title: 'Erro ao sair',
          description: error.message,
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Logout realizado',
        description: 'Você foi desconectado com sucesso.',
      })
      navigate('/login')
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Olá, {profile?.name || user?.user_metadata?.name || 'Atleta'}! 👋
            </h1>
            <p className="text-gray-600 mt-1">
              Dashboard TrainerAI - Sua central de performance e treinamento
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => navigate('/configuracoes')}
              variant="outline"
              size="sm"
              className="border-primary text-primary hover:bg-primary hover:text-white"
            >
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </Button>
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-white"
            >
              Sair
            </Button>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Treinos esta Semana"
            value={weeklyStats?.totalWorkouts || 0}
            subtitle="atividades registradas"
            icon={Activity}
            iconColor="text-emerald-500"
          />
          <StatsCard
            title="Distância Total"
            value={`${(weeklyStats?.totalDistance || 0).toFixed(1)} km`}
            subtitle="nos últimos 7 dias"
            icon={TrendingUp}
            iconColor="text-blue-500"
          />
          <StatsCard
            title="Calorias Queimadas"
            value={Math.round(weeklyStats?.totalCalories || 0)}
            subtitle="esta semana"
            icon={Target}
            iconColor="text-orange-500"
          />
          <StatsCard
            title="Tempo Ativo"
            value={`${Math.round((weeklyStats?.totalTime || 0) / 60)} min`}
            subtitle="em movimento"
            icon={Calendar}
            iconColor="text-purple-500"
          />
        </div>

        {/* Planos Ativos */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Planos Ativos</h2>
          <ActivePlans 
            trainingPlan={trainingPlan}
            nutritionPlan={nutritionPlan}
          />
        </div>

        {/* Charts e Eventos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <PerformanceChart activities={activities} />
          <UpcomingEvents events={upcomingEvents} />
        </div>

        {/* Atividades Recentes */}
        <RecentActivities activities={activities} />
      </div>
    </div>
  )
}

export default withAuth(Dashboard)
