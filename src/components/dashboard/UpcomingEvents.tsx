
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useQuery } from '@tanstack/react-query'
import { mcpAgendamento } from '@/lib/mcpClient'
import { Calendar, Clock, MapPin, Edit, Trash2 } from 'lucide-react'
import { format, isToday, isTomorrow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useToast } from '@/hooks/use-toast'

interface CalendarEvent {
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

  const { data: events = [], isLoading, refetch } = useQuery({
    queryKey: ['upcoming-events'],
    queryFn: async () => {
      // Buscar eventos dos próximos 7 dias
      const now = new Date()
      const nextWeek = new Date()
      nextWeek.setDate(now.getDate() + 7)

      const result = await mcpAgendamento.buscarTodosEventos(
        now.toISOString(),
        nextWeek.toISOString()
      )

      return result.success ? result.data?.items || [] : []
    },
    refetchInterval: 5 * 60 * 1000, // Atualizar a cada 5 minutos
    retry: 1
  })

  const handleCancelEvent = async (eventId: string, eventTitle: string) => {
    try {
      const result = await mcpAgendamento.cancelarEvento(eventId)
      
      if (result.success) {
        toast({
          title: 'Evento cancelado',
          description: `"${eventTitle}" foi removido do seu calendário`,
        })
        refetch()
      } else {
        throw new Error(result.error || 'Erro ao cancelar evento')
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

  const getEventDateTime = (event: CalendarEvent) => {
    const startTime = event.start.dateTime || event.start.date
    return startTime ? new Date(startTime) : null
  }

  const getEventBadge = (event: CalendarEvent) => {
    const summary = event.summary?.toLowerCase() || ''
    
    if (summary.includes('treino') || summary.includes('exerc') || summary.includes('academia')) {
      return { text: 'Treino', className: 'bg-orange-50 text-orange-700 border-orange-200' }
    }
    
    if (summary.includes('refeição') || summary.includes('almoço') || summary.includes('jantar') || summary.includes('café')) {
      return { text: 'Refeição', className: 'bg-green-50 text-green-700 border-green-200' }
    }
    
    return { text: 'Evento', className: 'bg-blue-50 text-blue-700 border-blue-200' }
  }

  const formatEventTime = (event: CalendarEvent) => {
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
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events && events.length > 0 ? (
          <div className="space-y-3">
            {events.slice(0, 5).map((event: CalendarEvent) => {
              const badge = getEventBadge(event)
              const eventTime = formatEventTime(event)
              
              return (
                <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900 truncate">
                        {event.summary}
                      </h4>
                      <Badge variant="outline" className={badge.className}>
                        {badge.text}
                      </Badge>
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
                      onClick={() => handleCancelEvent(event.id, event.summary)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )
            })}
            
            {events.length > 5 && (
              <div className="text-center pt-2">
                <p className="text-sm text-gray-500">
                  E mais {events.length - 5} eventos...
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
