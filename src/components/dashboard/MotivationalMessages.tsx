
import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Zap, TrendingUp, Star, Award, Bell } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { getWeeklyStats, getStravaActivities } from '@/lib/database'

interface MotivationalMessage {
  id: string
  type: 'encouragement' | 'challenge' | 'celebration' | 'reminder' | 'achievement'
  title: string
  message: string
  icon: React.ReactNode
  color: string
  bgColor: string
  actionText?: string
  priority: number
}

const MotivationalMessages: React.FC = () => {
  const { user } = useAuth()
  const [currentMessage, setCurrentMessage] = useState<MotivationalMessage | null>(null)
  const [messageIndex, setMessageIndex] = useState(0)

  const { data: weeklyStats } = useQuery({
    queryKey: ['motivational-stats', user?.id],
    queryFn: () => getWeeklyStats(user!.id),
    enabled: !!user?.id
  })

  const { data: activities = [] } = useQuery({
    queryKey: ['motivational-activities', user?.id],
    queryFn: () => getStravaActivities(user!.id, 10),
    enabled: !!user?.id
  })

  const [messages, setMessages] = useState<MotivationalMessage[]>([])

  useEffect(() => {
    generateMotivationalMessages()
  }, [weeklyStats, activities])

  useEffect(() => {
    if (messages.length > 0) {
      const interval = setInterval(() => {
        setMessageIndex((prev) => (prev + 1) % messages.length)
      }, 5000) // Muda mensagem a cada 5 segundos

      return () => clearInterval(interval)
    }
  }, [messages.length])

  useEffect(() => {
    if (messages.length > 0) {
      setCurrentMessage(messages[messageIndex])
    }
  }, [messageIndex, messages])

  const generateMotivationalMessages = () => {
    const messageList: MotivationalMessage[] = []
    const workoutCount = weeklyStats?.totalWorkouts || 0
    const totalDistance = weeklyStats?.totalDistance || 0
    const recentActivities = activities.slice(0, 3)

    // Mensagens baseadas em performance
    if (workoutCount === 0) {
      messageList.push({
        id: 'start',
        type: 'encouragement',
        title: 'Hora de começar! 💪',
        message: 'Todo grande atleta começou com um primeiro passo. Que tal iniciar hoje?',
        icon: <Zap className="w-5 h-5" />,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 border-blue-200',
        actionText: 'Ver treinos',
        priority: 10
      })
    }

    if (workoutCount >= 1 && workoutCount < 3) {
      messageList.push({
        id: 'consistency',
        type: 'encouragement',
        title: 'Continue assim! 🎯',
        message: 'Você já começou, agora é manter a consistência. Cada treino conta!',
        icon: <TrendingUp className="w-5 h-5" />,
        color: 'text-green-600',
        bgColor: 'bg-green-50 border-green-200',
        actionText: 'Próximo treino',
        priority: 8
      })
    }

    if (workoutCount >= 3) {
      messageList.push({
        id: 'streak',
        type: 'celebration',
        title: 'Sequência incrível! 🔥',
        message: `${workoutCount} treinos esta semana! Você está no caminho certo.`,
        icon: <Star className="w-5 h-5" />,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50 border-orange-200',
        actionText: 'Ver progresso',
        priority: 9
      })
    }

    if (totalDistance >= 10) {
      messageList.push({
        id: 'distance',
        type: 'achievement',
        title: 'Distância impressionante! 🏃‍♂️',
        message: `${totalDistance.toFixed(1)}km percorridos! Sua resistência está aumentando.`,
        icon: <Award className="w-5 h-5" />,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50 border-purple-200',
        priority: 7
      })
    }

    // Mensagens de desafio
    const lastActivity = recentActivities[0]
    if (lastActivity) {
      const daysSinceLastActivity = Math.floor(
        (Date.now() - new Date(lastActivity.start_date).getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysSinceLastActivity >= 3) {
        messageList.push({
          id: 'comeback',
          type: 'challenge',
          title: 'Sentimos sua falta! 💚',
          message: 'Que tal retomar os treinos? Seu corpo e mente vão agradecer.',
          icon: <Bell className="w-5 h-5" />,
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-50 border-emerald-200',
          actionText: 'Treinar agora',
          priority: 9
        })
      }
    }

    // Mensagens motivacionais gerais
    const generalMessages = [
      {
        id: 'daily',
        type: 'encouragement' as const,
        title: 'Cada dia é uma nova oportunidade! ✨',
        message: 'Transforme hoje em um degrau para seus objetivos. Você é capaz!',
        icon: <Star className="w-5 h-5" />,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50 border-indigo-200',
        priority: 5
      },
      {
        id: 'progress',
        type: 'reminder' as const,
        title: 'Progresso acontece passo a passo 🚶‍♂️',
        message: 'Não compare seu capítulo 1 com o capítulo 20 de outra pessoa.',
        icon: <TrendingUp className="w-5 h-5" />,
        color: 'text-teal-600',
        bgColor: 'bg-teal-50 border-teal-200',
        priority: 4
      }
    ]

    messageList.push(...generalMessages)

    // Ordenar por prioridade
    const sortedMessages = messageList.sort((a, b) => b.priority - a.priority)
    setMessages(sortedMessages)
  }

  const handleAction = () => {
    // Implementar ações específicas baseadas no tipo de mensagem
    console.log('Ação da mensagem motivacional:', currentMessage?.actionText)
  }

  if (!currentMessage) return null

  return (
    <Card className={`shadow-lg border-2 ${currentMessage.bgColor} transition-all duration-500 animate-fade-in`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`${currentMessage.color} mt-1`}>
            {currentMessage.icon}
          </div>
          <div className="flex-1">
            <h4 className={`font-semibold ${currentMessage.color} mb-1`}>
              {currentMessage.title}
            </h4>
            <p className="text-gray-700 text-sm mb-3">
              {currentMessage.message}
            </p>
            <div className="flex items-center justify-between">
              <Badge 
                variant="outline" 
                className={`${currentMessage.bgColor} ${currentMessage.color} border-current`}
              >
                {currentMessage.type}
              </Badge>
              {currentMessage.actionText && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleAction}
                  className={`${currentMessage.color} border-current hover:bg-current hover:text-white transition-colors`}
                >
                  {currentMessage.actionText}
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* Indicador de mensagens */}
        {messages.length > 1 && (
          <div className="flex justify-center mt-3 gap-1">
            {messages.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors cursor-pointer ${
                  index === messageIndex 
                    ? currentMessage.color.replace('text-', 'bg-')
                    : 'bg-gray-300'
                }`}
                onClick={() => setMessageIndex(index)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default MotivationalMessages
