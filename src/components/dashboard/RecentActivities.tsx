
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useQuery } from '@tanstack/react-query'
import { getStravaActivities } from '@/lib/database'
import { mcpStrava } from '@/lib/mcpClient'
import { useAuth } from '@/hooks/useAuth'
import { Activity, Clock, MapPin, Heart, Zap, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const RecentActivities: React.FC = () => {
  const { user } = useAuth()

  // Buscar atividades do banco local com mais debug
  const { data: localActivities, isLoading: localLoading, refetch: refetchLocal } = useQuery({
    queryKey: ['strava-activities-local', user?.id],
    queryFn: async () => {
      console.log('🔍 Buscando atividades locais para user:', user?.id)
      const activities = await getStravaActivities(user!.id, 10)
      console.log('📊 Atividades locais encontradas:', activities?.length || 0, activities)
      return activities
    },
    enabled: !!user?.id
  })

  // Buscar via MCP (dados mais recentes) com mais debug
  const { data: mcpActivities, isLoading: mcpLoading, refetch: refetchMcp } = useQuery({
    queryKey: ['strava-activities-mcp'],
    queryFn: async () => {
      console.log('🌐 Buscando atividades via MCP...')
      try {
        const result = await mcpStrava.getAllTrain(10)
        console.log('📡 Resultado MCP:', result)
        return result.success ? result.data : []
      } catch (error) {
        console.error('❌ Erro no MCP:', error)
        return []
      }
    },
    refetchInterval: 5 * 60 * 1000, // Atualizar a cada 5 minutos
    retry: 1
  })

  // Debug das fontes de dados
  React.useEffect(() => {
    console.log('🔄 Estado das atividades:')
    console.log('- Local activities:', localActivities?.length || 0, localActivities)
    console.log('- MCP activities:', mcpActivities?.length || 0, mcpActivities)
    console.log('- Local loading:', localLoading)
    console.log('- MCP loading:', mcpLoading)
  }, [localActivities, mcpActivities, localLoading, mcpLoading])

  // Usar dados locais como prioridade, depois MCP
  const activities = (localActivities && localActivities.length > 0) ? localActivities : (mcpActivities || [])
  const isLoading = localLoading && mcpLoading

  const handleRefresh = () => {
    console.log('🔄 Atualizando atividades...')
    refetchLocal()
    refetchMcp()
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}min`
    }
    return `${minutes}min`
  }

  const formatDistance = (meters: number) => {
    const km = meters / 1000
    return `${km.toFixed(1)} km`
  }

  const getActivityIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'run':
      case 'running':
        return '🏃‍♂️'
      case 'ride':
      case 'cycling':
        return '🚴‍♂️'
      case 'swim':
      case 'swimming':
        return '🏊‍♂️'
      case 'workout':
      case 'weighttraining':
        return '🏋️‍♂️'
      case 'walk':
      case 'walking':
        return '🚶‍♂️'
      default:
        return '💪'
    }
  }

  const getActivityColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'run':
      case 'running':
        return 'bg-red-50 text-red-700 border-red-200'
      case 'ride':
      case 'cycling':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'swim':
      case 'swimming':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200'
      case 'workout':
      case 'weighttraining':
        return 'bg-orange-50 text-orange-700 border-orange-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  if (isLoading) {
    return (
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-red-500" />
            Atividades Recentes
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
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-red-500" />
            Atividades Recentes
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Debug info para desenvolvimento */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
            <div>Local: {localActivities?.length || 0} atividades</div>
            <div>MCP: {mcpActivities?.length || 0} atividades</div>
            <div>Fonte atual: {(localActivities && localActivities.length > 0) ? 'Local' : 'MCP'}</div>
          </div>
        )}

        {activities && activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div key={activity.id || activity.strava_activity_id || index} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="text-2xl">
                  {getActivityIcon(activity.type)}
                </div>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 truncate">
                      {activity.name}
                    </h4>
                    <Badge variant="outline" className={getActivityColor(activity.type)}>
                      {activity.type}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    {activity.distance && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{formatDistance(activity.distance)}</span>
                      </div>
                    )}
                    
                    {activity.moving_time && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDuration(activity.moving_time)}</span>
                      </div>
                    )}
                    
                    {activity.average_heartrate && (
                      <div className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        <span>{Math.round(activity.average_heartrate)} bpm</span>
                      </div>
                    )}
                    
                    {activity.calories && (
                      <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        <span>{activity.calories} cal</span>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    {format(new Date(activity.start_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="font-medium mb-2">Nenhuma atividade encontrada</p>
            <p className="text-sm">
              Envie uma mensagem sobre treinos no WhatsApp ou conecte sua conta do Strava no perfil.
            </p>
            <Button 
              onClick={handleRefresh}
              variant="outline"
              className="mt-3"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar novamente
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default RecentActivities
