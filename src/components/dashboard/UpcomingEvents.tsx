
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CalendarEvent } from '@/lib/database'
import { Calendar, Clock, MapPin } from 'lucide-react'

interface UpcomingEventsProps {
  events: CalendarEvent[]
}

const UpcomingEvents: React.FC<UpcomingEventsProps> = ({ events }) => {
  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'training':
        return '🏋️'
      case 'nutrition':
        return '🥗'
      case 'rest':
        return '😴'
      case 'assessment':
        return '📊'
      default:
        return '📅'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-primary" />
          Próximos Eventos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            Nenhum evento agendado para os próximos dias
          </p>
        ) : (
          <div className="space-y-3">
            {events.slice(0, 5).map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getEventTypeIcon(event.event_type)}</span>
                  <div>
                    <h4 className="font-medium text-gray-900">{event.title}</h4>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(event.start_time)}</span>
                      {event.location && (
                        <>
                          <MapPin className="w-3 h-3 ml-2" />
                          <span>{event.location}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  Ver Detalhes
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default UpcomingEvents
