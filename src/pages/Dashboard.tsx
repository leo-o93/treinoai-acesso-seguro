
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="plans">Planos</TabsTrigger>
            <TabsTrigger value="analytics">Análises</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="chat">TrainerAI</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard />
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
        </Tabs>
      </div>
    </div>
  )
}

export default Dashboard
