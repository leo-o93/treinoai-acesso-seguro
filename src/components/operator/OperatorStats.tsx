
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageCircle, Clock, Users, CheckCircle2 } from 'lucide-react'

interface OperatorStatsProps {
  stats: {
    unreadMessages: number
    todayMessages: number
    weekMessages: number
    todayResponses: number
  }
}

export const OperatorStats: React.FC<OperatorStatsProps> = ({ stats }) => {
  const statsCards = [
    {
      title: 'Mensagens não lidas',
      value: stats.unreadMessages,
      icon: MessageCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Mensagens hoje',
      value: stats.todayMessages,
      icon: Clock,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Mensagens esta semana',
      value: stats.weekMessages,
      icon: Users,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Respostas enviadas hoje',
      value: stats.todayResponses,
      icon: CheckCircle2,
      color: 'text-green-500',
      bgColor: 'bg-green-50'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statsCards.map((stat) => (
        <Card key={stat.title}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
