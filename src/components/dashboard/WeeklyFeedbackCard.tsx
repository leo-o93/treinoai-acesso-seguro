
import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { getStravaActivities } from '@/lib/database'
import { WeeklyFeedback } from '@/types/weekly-feedback'
import WeeklySummaryCard from './feedback/WeeklySummaryCard'
import FeedbackForm from './feedback/FeedbackForm'
import FeedbackHistory from './feedback/FeedbackHistory'

interface WeeklyFeedbackCardProps {
  userProfile: any
}

const WeeklyFeedbackCard: React.FC<WeeklyFeedbackCardProps> = ({ userProfile }) => {
  const { user } = useAuth()

  // Get current week start (Monday)
  const getCurrentWeekStart = () => {
    const now = new Date()
    const monday = new Date(now)
    monday.setDate(now.getDate() - now.getDay() + 1)
    monday.setHours(0, 0, 0, 0)
    return monday.toISOString().split('T')[0]
  }

  const currentWeekStart = getCurrentWeekStart()

  // Fetch this week's feedback
  const { data: currentFeedback, isLoading } = useQuery({
    queryKey: ['weekly-feedback', user?.id, currentWeekStart],
    queryFn: async (): Promise<WeeklyFeedback | null> => {
      if (!user?.id) return null
      
      try {
        const { data, error } = await (supabase as any)
          .from('weekly_feedback')
          .select('*')
          .eq('user_id', user.id)
          .eq('week_start', currentWeekStart)
          .maybeSingle()
        
        if (error && error.code !== 'PGRST116') throw error
        return data ? data as WeeklyFeedback : null
      } catch (error) {
        console.error('Error fetching weekly feedback:', error)
        return null
      }
    },
    enabled: !!user?.id
  })

  // Fetch recent activities for context
  const { data: weekActivities } = useQuery({
    queryKey: ['week-activities', user?.id, currentWeekStart],
    queryFn: async () => {
      if (!user?.id) return []
      
      const weekStart = new Date(currentWeekStart)
      const activities = await getStravaActivities(user.id, 20)
      
      return activities.filter(activity => {
        const activityDate = new Date(activity.start_date)
        return activityDate >= weekStart
      })
    },
    enabled: !!user?.id
  })

  // Fetch previous weeks for comparison
  const { data: previousFeedbacks } = useQuery({
    queryKey: ['previous-feedbacks', user?.id],
    queryFn: async (): Promise<WeeklyFeedback[]> => {
      if (!user?.id) return []
      
      try {
        const { data, error } = await (supabase as any)
          .from('weekly_feedback')
          .select('*')
          .eq('user_id', user.id)
          .order('week_start', { ascending: false })
          .limit(4)
        
        if (error) throw error
        return (data as any[]) as WeeklyFeedback[]
      } catch (error) {
        console.error('Error fetching previous feedbacks:', error)
        return []
      }
    },
    enabled: !!user?.id
  })

  if (isLoading) {
    return (
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const weekActivitiesCount = weekActivities?.length || 0
  const expectedActivities = userProfile?.frequencia_semanal || 3
  const adherencePercentage = Math.round((weekActivitiesCount / expectedActivities) * 100)
  const totalDistance = weekActivities?.reduce((sum, a) => sum + (a.distance || 0), 0) || 0

  return (
    <div className="space-y-6">
      <WeeklySummaryCard
        weekActivitiesCount={weekActivitiesCount}
        expectedActivities={expectedActivities}
        totalDistance={totalDistance / 1000} // Convert to km
        adherencePercentage={adherencePercentage}
      />

      <FeedbackForm
        currentFeedback={currentFeedback}
        currentWeekStart={currentWeekStart}
        weekActivitiesCount={weekActivitiesCount}
        userId={user!.id}
      />

      <FeedbackHistory previousFeedbacks={previousFeedbacks || []} />
    </div>
  )
}

export default WeeklyFeedbackCard
