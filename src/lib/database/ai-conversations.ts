
import { supabase } from '@/integrations/supabase/client'

interface MessageContext {
  category?: string
  [key: string]: any
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
    .select('id, context')
    .eq('message_type', 'user')
    .like('session_id', 'whatsapp_%')
    .gte('created_at', today.toISOString())

  const { data: weekData, error: weekError } = await supabase
    .from('ai_conversations')
    .select('id, context')
    .eq('message_type', 'user')
    .like('session_id', 'whatsapp_%')
    .gte('created_at', oneWeekAgo.toISOString())

  if (todayError) throw todayError
  if (weekError) throw weekError

  // Analisar categorias da semana
  const categoryStats = {
    treino: 0,
    nutricao: 0,
    agendamento: 0,
    strava: 0,
    geral: 0
  }

  weekData.forEach(msg => {
    const context = msg.context as MessageContext | null
    const category = context?.category || 'geral'
    if (category in categoryStats) {
      categoryStats[category as keyof typeof categoryStats]++
    }
  })

  return {
    todayMessages: todayData.length,
    weekMessages: weekData.length,
    categoryStats
  }
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
