
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StravaActivity } from '@/lib/database'
import { Activity, Clock, MapPin, Heart } from 'lucide-react'

interface RecentActivitiesProps {
  activities: StravaActivity[]
}

const RecentActivities: React.FC<RecentActivitiesProps> = ({ activities }) => {
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'run':
      case 'running':
        return '🏃'
      case 'ride':
      case 'cycling':
        return '🚴'
      case 'swim':
      case 'swimming':
        return '🏊'
      case 'walk':
      case 'walking':
        return '🚶'
      default:
        return '💪'
    }
  }

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="w-5 h-5 mr-2 text-primary" />
          Atividades Recentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-500">Nenhuma atividade registrada ainda</p>
            <p className="text-sm text-gray-400 mt-2">
              Conecte seu Strava para ver suas atividades aqui
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.slice(0, 5).map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getActivityIcon(activity.type)}</span>
                  <div>
                    <h4 className="font-medium text-gray-900">{activity.name}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3" />
                        <span>{activity.distance?.toFixed(1)} km</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDuration(activity.moving_time || 0)}</span>
                      </div>
                      {activity.average_heartrate && (
                        <div className="flex items-center space-x-1">
                          <Heart className="w-3 h-3" />
                          <span>{Math.round(activity.average_heartrate)} bpm</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-500">
                  {formatDate(activity.start_date)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default RecentActivities
