
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, AlertTriangle, CheckCircle, Info, TrendingUp, TrendingDown, X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Notification {
  id: string
  type: 'success' | 'warning' | 'info' | 'error'
  title: string
  message: string
  timestamp: Date
  isRead: boolean
  category: 'performance' | 'goal' | 'plan' | 'reminder'
}

const NotificationCenter: React.FC = () => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<'all' | 'unread'>('unread')

  useEffect(() => {
    // Generate sample notifications based on user data
    generateNotifications()
  }, [])

  const generateNotifications = () => {
    const sampleNotifications: Notification[] = [
      {
        id: '1',
        type: 'success',
        title: 'Meta Alcançada! 🎉',
        message: 'Parabéns! Você completou 5km em menos de 25 minutos.',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        isRead: false,
        category: 'performance'
      },
      {
        id: '2',
        type: 'info',
        title: 'Novo Plano de Treino',
        message: 'Seu plano de treino foi atualizado com base no seu progresso.',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        isRead: false,
        category: 'plan'
      },
      {
        id: '3',
        type: 'warning',
        title: 'Atenção: Performance em Declínio',
        message: 'Seus tempos de corrida estão 15% mais lentos esta semana.',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        isRead: true,
        category: 'performance'
      },
      {
        id: '4',
        type: 'info',
        title: 'Lembrete: Treino Agendado',
        message: 'Você tem um treino de força agendado para hoje às 18:00.',
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        isRead: false,
        category: 'reminder'
      },
      {
        id: '5',
        type: 'success',
        title: 'Progresso Semanal',
        message: 'Você superou sua meta semanal de 20km por 25%!',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        isRead: true,
        category: 'goal'
      }
    ]
    
    setNotifications(sampleNotifications)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'error': return <AlertTriangle className="w-5 h-5 text-red-500" />
      default: return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-l-green-500 bg-green-50'
      case 'warning': return 'border-l-yellow-500 bg-yellow-50'
      case 'error': return 'border-l-red-500 bg-red-50'
      default: return 'border-l-blue-500 bg-blue-50'
    }
  }

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, isRead: true }))
    )
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id))
  }

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-500" />
            Centro de Notificações
            {unreadCount > 0 && (
              <Badge variant="destructive" className="bg-red-500">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex items-center border rounded-lg">
              <Button
                size="sm"
                variant={filter === 'unread' ? 'default' : 'ghost'}
                onClick={() => setFilter('unread')}
                className="rounded-none rounded-l-lg"
              >
                Não lidas
              </Button>
              <Button
                size="sm"
                variant={filter === 'all' ? 'default' : 'ghost'}
                onClick={() => setFilter('all')}
                className="rounded-none rounded-r-lg"
              >
                Todas
              </Button>
            </div>
            {unreadCount > 0 && (
              <Button size="sm" variant="outline" onClick={markAllAsRead}>
                Marcar todas como lidas
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>
              {filter === 'unread' 
                ? 'Você está em dia! Nenhuma notificação não lida.' 
                : 'Nenhuma notificação encontrada.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`
                  p-4 rounded-lg border-l-4 cursor-pointer transition-all
                  ${getNotificationColor(notification.type)}
                  ${!notification.isRead ? 'shadow-md' : 'opacity-70'}
                `}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                          {notification.title}
                        </h4>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {notification.category}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {format(notification.timestamp, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeNotification(notification.id)
                    }}
                    className="ml-2"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        {filteredNotifications.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{filteredNotifications.length} notificação(ões) {filter === 'unread' ? 'não lida(s)' : 'total'}</span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" className="text-xs">
                  Configurar notificações
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default NotificationCenter
