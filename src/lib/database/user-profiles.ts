
import { supabase } from '@/integrations/supabase/client'
import { UserProfile } from './types'

export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data
}

export const getUserProfileByPhone = async (phone: string) => {
  // Note: user_profiles table doesn't have whatsapp_phone column
  // We'll need to use a different approach or add this column via SQL migration
  console.log('Searching for user by phone:', phone)
  
  // For now, return null since whatsapp_phone column doesn't exist
  return null
}

export const upsertUserProfile = async (profile: {
  user_id: string
  name?: string
  age?: number
  weight?: number
  height?: number
  objective?: string
  deadline?: string
  training_frequency?: number
  experience_level?: string
  food_preferences?: string[]
  restrictions?: string[]
  strava_connected?: boolean
  strava_athlete_id?: string
}) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert(profile)
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateUserWhatsAppPhone = async (userId: string, phone: string) => {
  // Note: whatsapp_phone column doesn't exist in user_profiles table
  // This function would need the column to be added via SQL migration
  console.log('Would update WhatsApp phone for user:', userId, 'to:', phone)
  
  // For now, just return the existing profile
  return getUserProfile(userId)
}
