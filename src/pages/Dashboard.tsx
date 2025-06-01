
import React from 'react'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { signOut } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'
import withAuth from '@/components/auth/withAuth'
import StatsCard from '@/components/dashboard/StatsCard'
import PerformanceChart from '@/components/dashboard/PerformanceChart'
import UpcomingEvents from '@/components/dashboard/UpcomingEvents'
import RecentActivities from '@/components/dashboard/RecentActivities'
import TrainerAIMessages from '@/components/dashboard/TrainerAIMessages'
import TrainerAIStats from '@/components/dashboard/TrainerAIStats'
import GoalSummary from '@/components/dashboard/GoalSummary'
import DetailedTrainingPlan from '@/components/dashboard/DetailedTrainingPlan'
import DetailedNutritionPlan from '@/components/dashboard/DetailedNutritionPlan'
import UserDataPanel from '@/components/dashboard/UserDataPanel'
import IntegratedCalendar from '@/components/dashboard/IntegratedCalendar'
import AdvancedPerformance from '@/components/dashboard/AdvancedPerformance'
import AIChat from '@/components/dashboard/AIChat'
import NotificationCenter from '@/components/dashboard/NotificationCenter'
import { useAuth } from '@/hooks/useAuth'
import { 
  getUserProfile, 
  getStravaActivities, 
  getActiveTrainingPlan, 
  getActiveNutritionPlan,
  getUpcomingEvents,
  getWeeklyStats
} from '@/lib/database'
import { Activity, Calendar, Target, TrendingUp, Settings, Bell, MessageSquare, BarChart3 } from 'lucide-react'
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
    queryFn: () => getStravaActivities(user!.id, 50), // Increased limit for advanced analysis
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
    queryFn: () => getUpcomingEvents(user!.id, 30), // Extended range for calendar
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

        {/* Quick Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
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
          <TrainerAIStats />
        </div>

        {/* Goal Summary & Notifications */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
          <div className="xl:col-span-2">
            <GoalSummary />
          </div>
          <div>
            <NotificationCenter />
          </div>
        </div>

        {/* Advanced Performance Analytics */}
        <div className="mb-8">
          <AdvancedPerformance activities={activities} />
        </div>

        {/* Integrated Calendar */}
        <div className="mb-8">
          <IntegratedCalendar events={upcomingEvents} />
        </div>

        {/* Training and Nutrition Plans */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          <DetailedTrainingPlan trainingPlan={trainingPlan} />
          <DetailedNutritionPlan nutritionPlan={nutritionPlan} />
        </div>

        {/* AI Chat Interface */}
        <div className="mb-8">
          <AIChat />
        </div>

        {/* User Data Panel */}
        <div className="mb-8">
          <UserDataPanel profile={profile} />
        </div>

        {/* Legacy Components - Performance and Events */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <PerformanceChart activities={activities} />
          <UpcomingEvents events={upcomingEvents} />
        </div>

        {/* TrainerAI Messages */}
        <div className="mb-8">
          <TrainerAIMessages />
        </div>

        {/* Recent Activities */}
        <RecentActivities activities={activities} />
      </div>
    </div>
  )
}

export default withAuth(Dashboard)
