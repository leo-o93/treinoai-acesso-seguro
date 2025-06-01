
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, Edit3, Trash2, Plus } from 'lucide-react'
import { CalendarEvent } from '@/lib/database'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface IntegratedCalendarProps {
  events: CalendarEvent[]
}

const IntegratedCalendar: React.FC<IntegratedCalendarProps> = ({ events }) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
      isSameDay(new Date(event.start_time), date)
    )
  }

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'workout': return 'bg-blue-500'
      case 'meal': return 'bg-green-500'
      case 'consultation': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const selectedDateEvents = getEventsForDate(selectedDate)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar View */}
      <Card className="lg:col-span-2 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-500" />
              Agenda Integrada
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setViewMode(viewMode === 'month' ? 'week' : 'month')}
              >
                {viewMode === 'month' ? 'Semana' : 'Mês'}
              </Button>
              <Button size="sm" variant="outline">
                <Plus className="w-3 h-3 mr-1" />
                Novo
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h3 className="font-semibold text-lg">
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </h3>
            <Button variant="ghost" size="sm" onClick={() => navigateMonth('next')}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {daysInMonth.map(day => {
              const dayEvents = getEventsForDate(day)
              const isSelected = isSameDay(day, selectedDate)
              const isCurrentMonth = isSameMonth(day, currentDate)
              const isCurrentDay = isToday(day)
              
              return (
                <div
                  key={day.toISOString()}
                  className={`
                    p-2 min-h-[80px] border rounded-lg cursor-pointer transition-colors
                    ${isSelected ? 'bg-emerald-100 border-emerald-300' : 'bg-white border-gray-200'}
                    ${!isCurrentMonth ? 'opacity-50' : ''}
                    ${isCurrentDay ? 'ring-2 ring-emerald-400' : ''}
                    hover:bg-gray-50
                  `}
                  onClick={() => setSelectedDate(day)}
                >
                  <div className={`text-sm font-medium mb-1 ${isCurrentDay ? 'text-emerald-600' : 'text-gray-900'}`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map(event => (
                      <div
                        key={event.id}
                        className={`text-xs px-2 py-1 rounded text-white ${getEventTypeColor(event.event_type)}`}
                      >
                        {event.title.length > 10 ? `${event.title.slice(0, 10)}...` : event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-gray-500">+{dayEvents.length - 2} mais</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Events Detail */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">
            {format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedDateEvents.length > 0 ? (
            <div className="space-y-3">
              {selectedDateEvents.map(event => (
                <div key={event.id} className="p-3 border rounded-lg bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{event.title}</h4>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost">
                        <Edit3 className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {event.description && (
                    <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                  )}
                  
                  <div className="space-y-1 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(event.start_time), 'HH:mm', { locale: ptBR })} - 
                      {format(new Date(event.end_time), 'HH:mm', { locale: ptBR })}
                    </div>
                    
                    {event.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {event.location}
                      </div>
                    )}
                    
                    <Badge variant="outline" className={`${getEventTypeColor(event.event_type)} text-white`}>
                      {event.event_type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum evento agendado</p>
              <p className="text-sm">para esta data</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default IntegratedCalendar
