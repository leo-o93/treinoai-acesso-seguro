
import { Tables } from '@/integrations/supabase/types'

export type UserProfile = Tables<'user_profiles'>
export type StravaActivity = Tables<'strava_activities'>
export type TrainingPlan = Tables<'training_plans'>
export type NutritionPlan = Tables<'nutrition_plans'>
export type CalendarEvent = Tables<'calendar_events'>
export type AIConversation = Tables<'ai_conversations'>
export type AIResponse = Tables<'ai_responses'>
export type UserGoal = Tables<'user_goals'>
export type ChatHistory = Tables<'chat_history'>
export type TrainingPlanHistory = Tables<'training_plans_history'>
export type StravaToken = Tables<'strava_tokens'>
export type UserIntegration = Tables<'user_integrations'>
