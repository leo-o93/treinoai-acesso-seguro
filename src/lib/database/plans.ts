
import { supabase } from '@/integrations/supabase/client'
import { TrainingPlan, NutritionPlan, TrainingPlanHistory } from './types'

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
