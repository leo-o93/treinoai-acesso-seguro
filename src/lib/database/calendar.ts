
import { supabase } from '@/integrations/supabase/client'
import { CalendarEvent } from './types'

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
