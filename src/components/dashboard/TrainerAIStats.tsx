
import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import StatsCard from './StatsCard'
import { MessageCircle } from 'lucide-react'

const TrainerAIStats: React.FC = () => {
  const { data: stats } = useQuery({
    queryKey: ['trainerai-stats'],
    queryFn: async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data, error } = await supabase
        .from('ai_conversations')
        .select('created_at')
        .eq('message_type', 'user')
        .like('session_id', 'whatsapp_%')
        .gte('created_at', today.toISOString())

      if (error) throw error
      
      return {
        todayMessages: data.length
      }
    },
    refetchInterval: 30000 // Atualizar a cada 30 segundos
  })

  return (
    <StatsCard
      title="Mensagens WhatsApp"
      value={stats?.todayMessages || 0}
      subtitle="mensagens hoje"
      icon={MessageCircle}
      iconColor="text-green-500"
    />
  )
}

export default TrainerAIStats
