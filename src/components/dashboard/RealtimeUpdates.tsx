
import React, { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/hooks/use-toast'
import { Bell, TrendingUp, Calendar, MessageSquare } from 'lucide-react'

interface RealtimeEvent {
  id: string
  type: 'new_plan' | 'new_message' | 'performance_update' | 'goal_achievement'
  title: string
  description: string
  timestamp: Date
  data?: any
}

const RealtimeUpdates: React.FC = () => {
  const { user } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [recentEvents, setRecentEvents] = useState<RealtimeEvent[]>([])

  useEffect(() => {
    if (!user?.id) return

    console.log('🔄 Iniciando sistema de atualizações em tempo real...')

    // Canal para ai_conversations (mensagens da IA)
    const aiChannel = supabase
      .channel('ai-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_conversations',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🤖 Nova mensagem da IA:', payload)
          
          const newEvent: RealtimeEvent = {
            id: Date.now().toString(),
            type: 'new_message',
            title: 'Nova mensagem do TrainerAI',
            description: 'Você recebeu uma nova recomendação personalizada',
            timestamp: new Date(),
            data: payload.new
          }

          setRecentEvents(prev => [newEvent, ...prev.slice(0, 4)])
          
          toast({
            title: '🤖 Nova mensagem do TrainerAI',
            description: 'Você recebeu uma nova recomendação personalizada',
          })
        }
      )
      .subscribe((status) => {
        console.log('📡 Status canal AI:', status)
        setIsConnected(status === 'SUBSCRIBED')
      })

    // Canal para training_plans
    const plansChannel = supabase
      .channel('plans-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'training_plans',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🏋️ Atualização no plano de treino:', payload)
          
          let title = 'Plano de treino atualizado'
          let description = 'Seu plano de treino foi modificado'
          
          if (payload.eventType === 'INSERT') {
            title = 'Novo plano de treino criado!'
            description = 'Um novo plano personalizado foi gerado para você'
          }

          const newEvent: RealtimeEvent = {
            id: Date.now().toString(),
            type: 'new_plan',
            title,
            description,
            timestamp: new Date(),
            data: payload.new
          }

          setRecentEvents(prev => [newEvent, ...prev.slice(0, 4)])
          
          toast({
            title: `🏋️ ${title}`,
            description,
          })
        }
      )
      .subscribe()

    // Canal para nutrition_plans
    const nutritionChannel = supabase
      .channel('nutrition-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'nutrition_plans',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🥗 Atualização no plano nutricional:', payload)
          
          let title = 'Plano nutricional atualizado'
          let description = 'Seu plano alimentar foi modificado'
          
          if (payload.eventType === 'INSERT') {
            title = 'Novo plano nutricional criado!'
            description = 'Um novo plano alimentar foi gerado para você'
          }

          const newEvent: RealtimeEvent = {
            id: Date.now().toString(),
            type: 'new_plan',
            title,
            description,
            timestamp: new Date(),
            data: payload.new
          }

          setRecentEvents(prev => [newEvent, ...prev.slice(0, 4)])
          
          toast({
            title: `🥗 ${title}`,
            description,
          })
        }
      )
      .subscribe()

    // Canal para atividades do Strava
    const stravaChannel = supabase
      .channel('strava-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'strava_activities',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('📈 Nova atividade do Strava:', payload)
          
          const activity = payload.new
          const newEvent: RealtimeEvent = {
            id: Date.now().toString(),
            type: 'performance_update',
            title: 'Nova atividade registrada!',
            description: `${activity.name}: ${(activity.distance || 0).toFixed(1)}km em ${Math.round((activity.moving_time || 0) / 60)} minutos`,
            timestamp: new Date(),
            data: activity
          }

          setRecentEvents(prev => [newEvent, ...prev.slice(0, 4)])
          
          toast({
            title: '📈 Nova atividade registrada!',
            description: `${activity.name}: ${(activity.distance || 0).toFixed(1)}km`,
          })
        }
      )
      .subscribe()

    // Canal para eventos do calendário
    const calendarChannel = supabase
      .channel('calendar-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calendar_events',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('📅 Atualização no calendário:', payload)
          
          let title = 'Evento atualizado'
          let description = 'Um evento foi modificado na sua agenda'
          
          if (payload.eventType === 'INSERT') {
            title = 'Novo evento agendado!'
            description = `${payload.new.title} foi adicionado à sua agenda`
          }

          const newEvent: RealtimeEvent = {
            id: Date.now().toString(),
            type: 'new_plan',
            title,
            description,
            timestamp: new Date(),
            data: payload.new
          }

          setRecentEvents(prev => [newEvent, ...prev.slice(0, 4)])
          
          toast({
            title: `📅 ${title}`,
            description,
          })
        }
      )
      .subscribe()

    return () => {
      console.log('🔌 Desconectando canais de realtime...')
      supabase.removeChannel(aiChannel)
      supabase.removeChannel(plansChannel)
      supabase.removeChannel(nutritionChannel)
      supabase.removeChannel(stravaChannel)
      supabase.removeChannel(calendarChannel)
    }
  }, [user?.id])

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'new_message': return <MessageSquare className="w-4 h-4" />
      case 'new_plan': return <Calendar className="w-4 h-4" />
      case 'performance_update': return <TrendingUp className="w-4 h-4" />
      case 'goal_achievement': return <Bell className="w-4 h-4" />
      default: return <Bell className="w-4 h-4" />
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Indicador de conexão */}
      <div className={`mb-2 px-3 py-1 rounded-full text-xs font-medium transition-all ${
        isConnected 
          ? 'bg-green-100 text-green-800 border border-green-200' 
          : 'bg-red-100 text-red-800 border border-red-200'
      }`}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          {isConnected ? 'Tempo real ativo' : 'Reconectando...'}
        </div>
      </div>

      {/* Eventos recentes */}
      {recentEvents.length > 0 && (
        <div className="space-y-2 max-w-sm">
          {recentEvents.slice(0, 3).map((event, index) => (
            <div
              key={event.id}
              className={`
                p-3 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border
                animate-fade-in transition-all duration-300
                ${index > 0 ? 'opacity-70 scale-95' : ''}
              `}
              style={{ 
                transform: `translateY(${index * -5}px)`,
                zIndex: 50 - index 
              }}
            >
              <div className="flex items-start gap-3">
                <div className="text-emerald-500 mt-1">
                  {getEventIcon(event.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 text-sm truncate">
                    {event.title}
                  </h4>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {event.description}
                  </p>
                  <span className="text-xs text-gray-400 mt-1 block">
                    {event.timestamp.toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default RealtimeUpdates
