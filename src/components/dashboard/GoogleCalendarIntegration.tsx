
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Sync, Settings, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { toast } from '@/hooks/use-toast'

interface GoogleEvent {
  id: string
  summary: string
  start: { dateTime: string }
  end: { dateTime: string }
  description?: string
  location?: string
}

const GoogleCalendarIntegration: React.FC = () => {
  const { user } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [events, setEvents] = useState<GoogleEvent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle')

  const handleGoogleAuth = async () => {
    setIsLoading(true)
    try {
      // Implementar OAuth com Google Calendar
      const authUrl = `https://accounts.google.com/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=${window.location.origin}/calendar/callback&scope=https://www.googleapis.com/auth/calendar.readonly&response_type=code`
      
      window.open(authUrl, 'google-auth', 'width=500,height=600')
      
      // Simular conexão bem-sucedida para demo
      setTimeout(() => {
        setIsConnected(true)
        setIsLoading(false)
        toast({
          title: 'Google Calendar conectado!',
          description: 'Seus eventos serão sincronizados automaticamente.'
        })
      }, 2000)
    } catch (error) {
      setIsLoading(false)
      toast({
        title: 'Erro na conexão',
        description: 'Não foi possível conectar com o Google Calendar.',
        variant: 'destructive'
      })
    }
  }

  const syncCalendarEvents = async () => {
    setSyncStatus('syncing')
    try {
      // Simular sincronização de eventos
      const mockEvents: GoogleEvent[] = [
        {
          id: '1',
          summary: 'Treino de Corrida',
          start: { dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() },
          end: { dateTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString() },
          description: 'Treino intervalado de 5km',
          location: 'Parque Ibirapuera'
        },
        {
          id: '2',
          summary: 'Consulta Nutricional',
          start: { dateTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() },
          end: { dateTime: new Date(Date.now() + 49 * 60 * 60 * 1000).toISOString() },
          description: 'Avaliação do plano alimentar'
        }
      ]

      setTimeout(() => {
        setEvents(mockEvents)
        setSyncStatus('success')
        toast({
          title: 'Sincronização concluída',
          description: `${mockEvents.length} eventos sincronizados com sucesso.`
        })
      }, 1500)
    } catch (error) {
      setSyncStatus('error')
      toast({
        title: 'Erro na sincronização',
        description: 'Não foi possível sincronizar os eventos.',
        variant: 'destructive'
      })
    }
  }

  const formatEventTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            Google Calendar
          </CardTitle>
          <div className="flex items-center gap-2">
            {isConnected && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Conectado
              </Badge>
            )}
            <Button size="sm" variant="outline">
              <Settings className="w-3 h-3 mr-1" />
              Configurar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <div className="text-center py-6">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="font-medium text-gray-900 mb-2">Conectar Google Calendar</h3>
            <p className="text-gray-500 text-sm mb-4">
              Sincronize seus treinos e compromissos automaticamente
            </p>
            <Button onClick={handleGoogleAuth} disabled={isLoading}>
              <ExternalLink className="w-4 h-4 mr-2" />
              {isLoading ? 'Conectando...' : 'Conectar Google Calendar'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Próximos Eventos</h4>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={syncCalendarEvents}
                disabled={syncStatus === 'syncing'}
              >
                <Sync className={`w-3 h-3 mr-1 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                {syncStatus === 'syncing' ? 'Sincronizando...' : 'Sincronizar'}
              </Button>
            </div>

            {events.length > 0 ? (
              <div className="space-y-3">
                {events.map((event) => (
                  <div key={event.id} className="p-3 border rounded-lg bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900">{event.summary}</h5>
                        {event.description && (
                          <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>{formatEventTime(event.start.dateTime)}</span>
                          {event.location && <span>📍 {event.location}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <p>Nenhum evento encontrado</p>
                <p className="text-sm">Clique em sincronizar para buscar eventos</p>
              </div>
            )}

            {syncStatus === 'success' && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle className="w-4 h-4" />
                Última sincronização: {new Date().toLocaleTimeString('pt-BR')}
              </div>
            )}

            {syncStatus === 'error' && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                Erro na última sincronização
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default GoogleCalendarIntegration
