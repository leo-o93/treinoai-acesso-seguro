
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

export const upsertUserProfile = async (profile: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'> & { user_id: string }) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert(profile)
    .select()
    .single()

  if (error) throw error
  return data
}
