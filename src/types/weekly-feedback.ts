
export interface WeeklyFeedback {
  id?: string
  user_id: string
  week_start: string
  adherence_score: number
  energy_level: number
  difficulty_level: number
  feedback_text?: string
  strava_activities_count: number
  plan_adjustments?: string
  ai_recommendations?: string
  created_at?: string
  updated_at?: string
}
