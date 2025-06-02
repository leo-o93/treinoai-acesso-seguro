
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
  console.log('Searching for user by phone:', phone)
  
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('whatsapp_phone', phone)
    .maybeSingle()

  if (error) {
    console.error('Error searching user by phone:', error)
    throw error
  }
  
  console.log('User found by phone:', data)
  return data
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
  whatsapp_phone?: string
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
  console.log('Updating WhatsApp phone for user:', userId, 'to:', phone)
  
  const { data, error } = await supabase
    .from('user_profiles')
    .update({ whatsapp_phone: phone })
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating WhatsApp phone:', error)
    throw error
  }
  
  return data
}
