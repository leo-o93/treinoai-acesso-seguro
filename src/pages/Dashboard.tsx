import React from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import StatsCard from '@/components/dashboard/StatsCard'
import RecentActivities from '@/components/dashboard/RecentActivities'
import ActivePlans from '@/components/dashboard/ActivePlans'
import AIChat from '@/components/dashboard/AIChat'
import PlanGenerationCard from '@/components/dashboard/PlanGenerationCard'
import PerformanceAnalytics from '@/components/dashboard/PerformanceAnalytics'
import DetailedTrainingPlan from '@/components/dashboard/DetailedTrainingPlan'
import DetailedNutritionPlan from '@/components/dashboard/DetailedNutritionPlan'
import WeeklyFeedbackCard from '@/components/dashboard/WeeklyFeedbackCard'
import PerformanceInsights from '@/components/dashboard/PerformanceInsights'
import PlanRecommendations from '@/components/dashboard/PlanRecommendations'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Activity, Target, TrendingUp, Clock } from 'lucide-react'
import { getStravaActivities } from '@/lib/database'
import MCPStatusMonitor from '@/components/dashboard/MCPStatusMonitor'

const Dashboard: React.FC = () => {
  const { user } = useAuth()

  const { data: profile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      
      if (error) throw error
      return data
    },
    enabled: !!user?.id
  })

  const { data: trainingPlan } = useQuery({
    queryKey: ['training-plan', user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      
      const { data, error } = await supabase
        .from('training_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle()
      
      if (error) throw error
      return data
    },
    enabled: !!user?.id
  })

  const { data: nutritionPlan } = useQuery({
    queryKey: ['nutrition-plan', user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      
      const { data, error } = await supabase
        .from('nutrition_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle()
      
      if (error) throw error
      return data
    },
    enabled: !!user?.id
  })

  const { data: recentActivities } = useQuery({
    queryKey: ['recent-activities', user?.id],
    queryFn: () => getStravaActivities(user!.id, 7),
    enabled: !!user?.id
  })

  // Calculate stats from recent activities
  const weeklyStats = React.useMemo(() => {
    if (!recentActivities) return { activities: 0, distance: 0, time: 0, avgPace: 0 }
    
    const totalDistance = recentActivities.reduce((sum, activity) => sum + (activity.distance || 0), 0)
    const totalTime = recentActivities.reduce((sum, activity) => sum + (activity.moving_time || 0), 0)
    const avgPace = totalDistance > 0 ? (totalTime / 60) / (totalDistance / 1000) : 0
    
    return {
      activities: recentActivities.length,
      distance: totalDistance / 1000, // Convert to km
      time: totalTime / 60, // Convert to minutes
      avgPace
    }
  }, [recentActivities])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard TrainerAI
          </h1>
          <p className="text-gray-600">
            Bem-vindo de volta! Aqui está seu resumo de atividades e progresso.
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="plans">Planos</TabsTrigger>
            <TabsTrigger value="analytics">Análises</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="chat">TrainerAI</TabsTrigger>
            <TabsTrigger value="mcp">Protocolo MCP</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                title="Atividades esta semana"
                value={weeklyStats.activities}
                subtitle="treinos realizados"
                icon={Activity}
                iconColor="text-blue-600"
              />
              <StatsCard
                title="Distância total"
                value={`${weeklyStats.distance.toFixed(1)}km`}
                subtitle="últimos 7 dias"
                icon={Target}
                iconColor="text-green-600"
              />
              <StatsCard
                title="Tempo de treino"
                value={`${Math.round(weeklyStats.time)}min`}
                subtitle="tempo ativo"
                icon={Clock}
                iconColor="text-orange-600"
              />
              <StatsCard
                title="Pace médio"
                value={weeklyStats.avgPace > 0 ? `${weeklyStats.avgPace.toFixed(1)}min/km` : "--"}
                subtitle="velocidade média"
                icon={TrendingUp}
                iconColor="text-purple-600"
              />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentActivities />
              <PlanGenerationCard 
                userProfile={profile}
                onPlansGenerated={() => {
                  // Refresh plans data
                  window.location.reload()
                }}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ActivePlans 
                trainingPlan={trainingPlan}
                nutritionPlan={nutritionPlan}
              />
              <PerformanceInsights />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PlanRecommendations />
            </div>
          </TabsContent>

          <TabsContent value="plans" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DetailedTrainingPlan trainingPlan={trainingPlan} />
              <DetailedNutritionPlan nutritionPlan={nutritionPlan} />
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <PerformanceAnalytics />
          </TabsContent>

          <TabsContent value="feedback" className="space-y-6">
            <WeeklyFeedbackCard userProfile={profile} />
          </TabsContent>

          <TabsContent value="chat" className="space-y-6">
            <AIChat />
          </TabsContent>

          <TabsContent value="mcp" className="space-y-6">
            <MCPStatusMonitor />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default Dashboard
