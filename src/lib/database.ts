import { supabase } from '@/integrations/supabase/client'
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

export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data
}

export const upsertUserProfile = async (profile: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'> & { user_id: string }) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert(profile)
    .select()
    .single()

  if (error) throw error
  return data
}

export const getStravaActivities = async (userId: string, limit = 10) => {
  const { data, error } = await supabase
    .from('strava_activities')
    .select('*')
    .eq('user_id', userId)
    .order('start_date', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

export const getActiveTrainingPlan = async (userId: string) => {
  const { data, error } = await supabase
    .from('training_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  if (error) throw error
  return data
}

export const getActiveNutritionPlan = async (userId: string) => {
  const { data, error } = await supabase
    .from('nutrition_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  if (error) throw error
  return data
}

export const getUpcomingEvents = async (userId: string, days = 7) => {
  const now = new Date()
  const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('user_id', userId)
    .gte('start_time', now.toISOString())
    .lte('start_time', future.toISOString())
    .order('start_time', { ascending: true })

  if (error) throw error
  return data
}

export const getUserGoals = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_goals')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export const getWeeklyStats = async (userId: string) => {
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  const { data, error } = await supabase
    .from('strava_activities')
    .select('*')
    .eq('user_id', userId)
    .gte('start_date', oneWeekAgo.toISOString())

  if (error) throw error
  
  const stats = {
    totalWorkouts: data.length,
    totalDistance: data.reduce((sum, activity) => sum + (activity.distance || 0), 0),
    totalCalories: data.reduce((sum, activity) => sum + (activity.calories || 0), 0),
    totalTime: data.reduce((sum, activity) => sum + (activity.moving_time || 0), 0)
  }

  return stats
}

export const getTrainerAIMessages = async (limit = 50) => {
  const { data, error } = await supabase
    .from('ai_conversations')
    .select('*')
    .eq('message_type', 'user')
    .like('session_id', 'whatsapp_%')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

export const getTrainerAIStats = async () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  const { data: todayData, error: todayError } = await supabase
    .from('ai_conversations')
    .select('id')
    .eq('message_type', 'user')
    .like('session_id', 'whatsapp_%')
    .gte('created_at', today.toISOString())

  const { data: weekData, error: weekError } = await supabase
    .from('ai_conversations')
    .select('id')
    .eq('message_type', 'user')
    .like('session_id', 'whatsapp_%')
    .gte('created_at', oneWeekAgo.toISOString())

  if (todayError) throw todayError
  if (weekError) throw weekError

  return {
    todayMessages: todayData.length,
    weekMessages: weekData.length
  }
}

export const getChatHistory = async (userId: string, limit = 50) => {
  const { data, error } = await supabase
    .from('chat_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

export const getActiveTrainingPlanHistory = async (userId: string) => {
  const { data, error } = await supabase
    .from('training_plans_history')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}

export const getStravaToken = async (userId: string) => {
  const { data, error } = await supabase
    .from('strava_tokens')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data
}

export const upsertStravaToken = async (token: Omit<StravaToken, 'id' | 'created_at' | 'updated_at'> & { 
  user_id: string
  access_token: string 
}) => {
  const { data, error } = await supabase
    .from('strava_tokens')
    .upsert(token)
    .select()
    .single()

  if (error) throw error
  return data
}

export const getTrainerAIConversations = async (limit = 50) => {
  const { data, error } = await supabase
    .from('ai_conversations')
    .select(`
      *,
      ai_responses(*)
    `)
    .eq('message_type', 'user')
    .like('session_id', 'whatsapp_%')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

export const markConversationAsRead = async (conversationId: string, operatorId: string) => {
  const { data, error } = await supabase
    .from('ai_conversations')
    .update({ 
      read_status: 'read',
      operator_id: operatorId,
      updated_at: new Date().toISOString()
    })
    .eq('id', conversationId)
    .select()

  if (error) throw error
  return data
}

export const sendOperatorResponse = async (response: {
  session_id: string
  response: string
  conversation_id: string
  operator_id: string
}) => {
  const { data, error } = await supabase
    .from('ai_responses')
    .insert(response)
    .select()
    .single()

  if (error) throw error

  // Atualizar status da conversa
  await supabase
    .from('ai_conversations')
    .update({ 
      response_status: 'responded',
      operator_id: response.operator_id,
      updated_at: new Date().toISOString()
    })
    .eq('id', response.conversation_id)

  return data
}

export const getConversationsBySession = async (sessionId: string) => {
  const { data, error } = await supabase
    .from('ai_conversations')
    .select(`
      *,
      ai_responses(*)
    `)
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

export const getOperatorStats = async () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  // Buscar sem filtros de user_id primeiro para teste
  const { data: unreadCount, error: unreadError } = await supabase
    .from('ai_conversations')
    .select('id')
    .eq('message_type', 'user')
    .eq('read_status', 'unread')
    .like('session_id', 'whatsapp_%')

  const { data: todayCount, error: todayError } = await supabase
    .from('ai_conversations')
    .select('id')
    .eq('message_type', 'user')
    .like('session_id', 'whatsapp_%')
    .gte('created_at', today.toISOString())

  const { data: weekCount, error: weekError } = await supabase
    .from('ai_conversations')
    .select('id')
    .eq('message_type', 'user')
    .like('session_id', 'whatsapp_%')
    .gte('created_at', oneWeekAgo.toISOString())

  const { data: responseCount, error: responseError } = await supabase
    .from('ai_responses')
    .select('id')
    .gte('created_at', today.toISOString())

  if (unreadError || todayError || weekError || responseError) {
    throw unreadError || todayError || weekError || responseError
  }

  return {
    unreadMessages: unreadCount.length,
    todayMessages: todayCount.length,
    weekMessages: weekCount.length,
    todayResponses: responseCount.length
  }
}
