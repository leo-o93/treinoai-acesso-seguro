
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Webhook, CheckCircle, AlertCircle, Clock, Activity, Zap } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface WebhookStats {
  total: number
  processed: number
  errors: number
  today: number
  sources: { [key: string]: number }
  recentActivity: boolean
}

const WebhookMonitor: React.FC = () => {
  // Buscar estatísticas de webhook
  const { data: stats, isLoading } = useQuery({
    queryKey: ['webhook-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const todayLogs = data.filter(log => new Date(log.created_at) >= today)
      const sources: { [key: string]: number } = {}
      
      data.forEach(log => {
        sources[log.source] = (sources[log.source] || 0) + 1
      })

      // Verificar atividade recente (últimos 5 minutos)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      const recentActivity = data.some(log => new Date(log.created_at) > fiveMinutesAgo)

      return {
        total: data.length,
        processed: data.filter(log => log.processed).length,
        errors: data.filter(log => log.error_message).length,
        today: todayLogs.length,
        sources,
        recentActivity
      } as WebhookStats
    },
    refetchInterval: 5000 // Atualizar a cada 5 segundos
  })

  // Buscar últimos webhooks recebidos
  const { data: recentWebhooks = [] } = useQuery({
    queryKey: ['recent-webhooks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      return data
    },
    refetchInterval: 5000
  })

  if (isLoading) {
    return (
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="w-5 h-5 text-blue-500" />
            Monitor de Webhooks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="h-20 bg-gray-200 rounded-lg"></div>
              <div className="h-20 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Webhook className="w-5 h-5 text-blue-500" />
          Monitor de Webhooks
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${stats?.recentActivity ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
            <span className="text-xs text-gray-500">
              {stats?.recentActivity ? 'Ativo' : 'Inativo'}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estatísticas principais */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 border rounded-lg bg-blue-50">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-900">Total</span>
            </div>
            <div className="text-lg font-bold text-blue-800">{stats?.total || 0}</div>
            <div className="text-xs text-blue-600">webhooks recebidos</div>
          </div>
          
          <div className="p-3 border rounded-lg bg-green-50">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-green-900">Processados</span>
            </div>
            <div className="text-lg font-bold text-green-800">{stats?.processed || 0}</div>
            <div className="text-xs text-green-600">com sucesso</div>
          </div>
          
          <div className="p-3 border rounded-lg bg-red-50">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium text-red-900">Erros</span>
            </div>
            <div className="text-lg font-bold text-red-800">{stats?.errors || 0}</div>
            <div className="text-xs text-red-600">com falhas</div>
          </div>
          
          <div className="p-3 border rounded-lg bg-purple-50">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium text-purple-900">Hoje</span>
            </div>
            <div className="text-lg font-bold text-purple-800">{stats?.today || 0}</div>
            <div className="text-xs text-purple-600">últimas 24h</div>
          </div>
        </div>

        {/* Fontes de webhook */}
        <div className="p-4 border rounded-lg bg-gray-50">
          <h4 className="font-medium text-gray-900 mb-3">Fontes de Webhook</h4>
          <div className="space-y-2">
            {stats?.sources && Object.entries(stats.sources).map(([source, count]) => (
              <div key={source} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{source}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {count} webhooks
                </Badge>
              </div>
            ))}
            {(!stats?.sources || Object.keys(stats.sources).length === 0) && (
              <p className="text-sm text-gray-500">Nenhuma fonte registrada ainda</p>
            )}
          </div>
        </div>

        {/* Atividade recente */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 text-sm">Últimos Webhooks Recebidos</h4>
          
          {recentWebhooks.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <Webhook className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Nenhum webhook recebido ainda</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recentWebhooks.map((webhook) => (
                <div key={webhook.id} className="flex items-center justify-between p-2 border rounded bg-white">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      webhook.error_message ? 'bg-red-500' : 
                      webhook.processed ? 'bg-green-500' : 'bg-yellow-500'
                    }`}></div>
                    <span className="text-sm font-medium">{webhook.source}</span>
                    <span className="text-xs text-gray-500">{webhook.event_type}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {format(new Date(webhook.created_at), 'HH:mm:ss', { locale: ptBR })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default WebhookMonitor
