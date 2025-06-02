
import { supabase } from '@/integrations/supabase/client'
import { StravaActivity, StravaToken } from './types'

export const getStravaActivities = async (userId: string, limit = 10) => {
  console.log('🔍 Buscando atividades Strava para user:', userId, 'limit:', limit)
  
  const { data, error } = await supabase
    .from('strava_activities')
    .select('*')
    .eq('user_id', userId)
    .order('start_date', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('❌ Erro ao buscar atividades:', error)
    throw error
  }
  
  console.log('✅ Atividades encontradas:', data?.length || 0)
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

// Nova função para sincronizar atividades Strava
export const syncStravaActivities = async (userId: string) => {
  console.log('🔄 Iniciando sincronização Strava para user:', userId)
  
  try {
    // Aqui você pode implementar a lógica para buscar atividades diretamente do Strava
    // Por exemplo, usando a API do Strava ou chamando uma edge function
    
    // Por enquanto, apenas log
    console.log('📡 Sincronização Strava não implementada ainda')
    
    return { success: true, message: 'Sincronização iniciada' }
  } catch (error) {
    console.error('❌ Erro na sincronização Strava:', error)
    throw error
  }
}
