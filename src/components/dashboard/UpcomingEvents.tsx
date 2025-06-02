
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useQuery } from '@tanstack/react-query'
import { mcpAgendamento } from '@/lib/mcpClient'
import { getUpcomingEvents } from '@/lib/database'
import { useAuth } from '@/hooks/useAuth'
import { Calendar, Clock, MapPin, Trash2, Bot, Smartphone } from 'lucide-react'
import { format, isToday, isTomorrow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useToast } from '@/hooks/use-toast'

interface GoogleCalendarEvent {
  id: string
  summary: string
  description?: string
  start: {
    dateTime?: string
    date?: string
  }
  end: {
    dateTime?: string
    date?: string
  }
  location?: string
}

const UpcomingEvents: React.FC = () => {
  const { toast } = useToast()
  const { user } = useAuth()

  // Buscar eventos do Google Calendar via MCP
  const { data: googleEvents = [], isLoading: isLoadingGoogle, refetch: refetchGoogle } = useQuery({
    queryKey: ['upcoming-events-google'],
    queryFn: async () => {
      const now = new Date()
      const nextWeek = new Date()
      nextWeek.setDate(now.getDate() + 7)

      const result = await mcpAgendamento.buscarTodosEventos(
        now.toISOString(),
        nextWeek.toISOString()
      )

      return result.success ? result.data?.items || [] : []
    },
    refetchInterval: 5 * 60 * 1000,
    retry: 1
  })

  // Buscar eventos do banco de dados (extraídos das conversas)
  const { data: dbEvents = [], isLoading: isLoadingDB, refetch: refetchDB } = useQuery({
    queryKey: ['upcoming-events-db', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      return await getUpcomingEvents(user.id, 7)
    },
    enabled: !!user?.id,
    refetchInterval: 2 * 60 * 1000,
    retry: 1
  })

  const handleCancelEvent = async (eventId: string, eventTitle: string, isGoogleEvent: boolean = false) => {
    try {
      if (isGoogleEvent) {
        const result = await mcpAgendamento.cancelarEvento(eventId)
        
        if (result.success) {
          toast({
            title: 'Evento cancelado',
            description: `"${eventTitle}" foi removido do Google Calendar`,
          })
          refetchGoogle()
        } else {
          throw new Error(result.error || 'Erro ao cancelar evento')
        }
      } else {
        // Para eventos do banco de dados, apenas marcar como cancelado
        toast({
          title: 'Evento do WhatsApp',
          description: 'Este evento foi criado via WhatsApp. Use o chat para modificações.',
          variant: 'default'
        })
      }
    } catch (error) {
      console.error('Erro ao cancelar evento:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível cancelar o evento',
        variant: 'destructive'
      })
    }
  }

  const getEventDateTime = (event: GoogleCalendarEvent | any) => {
    if (event.start_time) {
      // Evento do banco de dados
      return new Date(event.start_time)
    }
    
    // Evento do Google Calendar
    const startTime = event.start?.dateTime || event.start?.date
    return startTime ? new Date(startTime) : null
  }

  const getEventBadge = (event: GoogleCalendarEvent | any) => {
    const title = event.summary || event.title || ''
    const summary = title.toLowerCase()
    
    if (summary.includes('treino') || summary.includes('exerc') || summary.includes('academia') || event.event_type === 'workout') {
      return { text: 'Treino', className: 'bg-orange-50 text-orange-700 border-orange-200' }
    }
    
    if (summary.includes('refeição') || summary.includes('almoço') || summary.includes('jantar') || summary.includes('café') || summary.includes('lanche') || event.event_type === 'meal') {
      return { text: 'Refeição', className: 'bg-green-50 text-green-700 border-green-200' }
    }
    
    return { text: 'Evento', className: 'bg-blue-50 text-blue-700 border-blue-200' }
  }

  const formatEventTime = (event: GoogleCalendarEvent | any) => {
    const dateTime = getEventDateTime(event)
    if (!dateTime) return ''

    if (isToday(dateTime)) {
      return `Hoje às ${format(dateTime, 'HH:mm')}`
    }
    
    if (isTomorrow(dateTime)) {
      return `Amanhã às ${format(dateTime, 'HH:mm')}`
    }
    
    return format(dateTime, "dd/MM 'às' HH:mm", { locale: ptBR })
  }

  // Combinar e ordenar eventos
  const allEvents = React.useMemo(() => {
    const combined = [
      ...googleEvents.map(event => ({ ...event, source: 'google' })),
      ...dbEvents.map(event => ({ ...event, source: 'whatsapp', summary: event.title }))
    ]
    
    return combined.sort((a, b) => {
      const dateA = getEventDateTime(a)
      const dateB = getEventDateTime(b)
      
      if (!dateA || !dateB) return 0
      return dateA.getTime() - dateB.getTime()
    })
  }, [googleEvents, dbEvents])

  const isLoading = isLoadingGoogle || isLoadingDB

  if (isLoading) {
    return (
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-500" />
            Próximos Eventos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-green-500" />
          Próximos Eventos
          {dbEvents.length > 0 && (
            <Badge variant="outline" className="ml-auto bg-blue-50 text-blue-700">
              {dbEvents.length} via WhatsApp
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {allEvents && allEvents.length > 0 ? (
          <div className="space-y-3">
            {allEvents.slice(0, 5).map((event: any) => {
              const badge = getEventBadge(event)
              const eventTime = formatEventTime(event)
              const isFromWhatsApp = event.source === 'whatsapp'
              
              return (
                <div key={`${event.source}-${event.id}`} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900 truncate">
                        {event.summary}
                      </h4>
                      <Badge variant="outline" className={badge.className}>
                        {badge.text}
                      </Badge>
                      {isFromWhatsApp && (
                        <div className="flex items-center gap-1">
                          <Smartphone className="w-3 h-3 text-blue-500" />
                          <span className="text-xs text-blue-600">WhatsApp</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{eventTime}</span>
                      </div>
                      
                      {event.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate max-w-[100px]">{event.location}</span>
                        </div>
                      )}
                    </div>
                    
                    {event.description && (
                      <p className="text-xs text-gray-500 truncate">
                        {event.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCancelEvent(event.id, event.summary, !isFromWhatsApp)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )
            })}
            
            {allEvents.length > 5 && (
              <div className="text-center pt-2">
                <p className="text-sm text-gray-500">
                  E mais {allEvents.length - 5} eventos...
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="font-medium mb-2">Nenhum evento agendado</p>
            <p className="text-sm">
              Use o Chat TrainerAI para gerar e agendar seus treinos e refeições.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default UpcomingEvents
