
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Zap, Settings, CheckCircle, AlertCircle, Code, Copy, Eye, Clock, Activity } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface WebhookLog {
  id: string
  source: string
  event_type: string
  payload: any
  processed: boolean
  created_at: string
  error_message?: string
}

interface ToolUsage {
  tool: string
  count: number
  lastUsed: string
  description: string
  icon: string
}

const N8nApiIntegration: React.FC = () => {
  const [copiedUrl, setCopiedUrl] = useState(false)

  // URL do webhook do Supabase
  const webhookUrl = `https://shhkccidqvvrwgxlyvqq.supabase.co/functions/v1/webhook-receiver/trainerai`

  // Buscar logs de webhook
  const { data: webhookLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['webhook-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return data as WebhookLog[]
    },
    refetchInterval: 10000 // Atualizar a cada 10 segundos
  })

  // Estatísticas das ferramentas
  const { data: toolStats = [] } = useQuery({
    queryKey: ['tool-usage-stats'],
    queryFn: async () => {
      // Simular dados de uso das ferramentas baseado nos logs
      const agendamentoLogs = webhookLogs.filter(log => 
        log.source === 'trainerai_whatsapp_n8n' && 
        log.payload?.processed_data?.message?.toLowerCase().includes('agenda')
      ).length

      const stravaLogs = webhookLogs.filter(log => 
        log.source === 'strava' || 
        (log.source === 'trainerai_whatsapp_n8n' && 
         log.payload?.processed_data?.message?.toLowerCase().includes('treino'))
      ).length

      const conhecimentoLogs = webhookLogs.filter(log => 
        log.source === 'trainerai_whatsapp_n8n' && 
        !log.payload?.processed_data?.message?.toLowerCase().includes('agenda') &&
        !log.payload?.processed_data?.message?.toLowerCase().includes('treino')
      ).length

      return [
        {
          tool: 'AGENDAMENTO-Treino-Dietas',
          count: agendamentoLogs,
          lastUsed: webhookLogs.find(log => 
            log.source === 'trainerai_whatsapp_n8n' && 
            log.payload?.processed_data?.message?.toLowerCase().includes('agenda')
          )?.created_at || 'Nunca',
          description: 'Gerenciamento de treinos e dietas no Google Calendar',
          icon: '📅'
        },
        {
          tool: 'INFORMAÇÕES-Strava',
          count: stravaLogs,
          lastUsed: webhookLogs.find(log => 
            log.source === 'strava' || 
            (log.source === 'trainerai_whatsapp_n8n' && 
             log.payload?.processed_data?.message?.toLowerCase().includes('treino'))
          )?.created_at || 'Nunca',
          description: 'Consulta de dados e estatísticas de treinos',
          icon: '🏃'
        },
        {
          tool: 'CONHECIMENTO-IA',
          count: conhecimentoLogs,
          lastUsed: webhookLogs.find(log => 
            log.source === 'trainerai_whatsapp_n8n' && 
            !log.payload?.processed_data?.message?.toLowerCase().includes('agenda') &&
            !log.payload?.processed_data?.message?.toLowerCase().includes('treino')
          )?.created_at || 'Nunca',
          description: 'Base de conhecimento para respostas especializadas',
          icon: '🧠'
        }
      ] as ToolUsage[]
    },
    enabled: webhookLogs.length > 0
  })

  const handleCopyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl)
    setCopiedUrl(true)
    toast({
      title: 'URL copiada!',
      description: 'A URL do webhook foi copiada para a área de transferência.'
    })
    setTimeout(() => setCopiedUrl(false), 2000)
  }

  const getStatusColor = (processed: boolean, hasError: boolean) => {
    if (hasError) return 'text-red-600 bg-red-50 border-red-200'
    if (processed) return 'text-green-600 bg-green-50 border-green-200'
    return 'text-yellow-600 bg-yellow-50 border-yellow-200'
  }

  const getStatusIcon = (processed: boolean, hasError: boolean) => {
    if (hasError) return <AlertCircle className="w-3 h-3" />
    if (processed) return <CheckCircle className="w-3 h-3" />
    return <Clock className="w-3 h-3" />
  }

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-500" />
          TrainerAI - Modo Passivo
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Eye className="w-3 h-3 mr-1" />
            Escutando
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="webhook" className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="webhook">Webhook URL</TabsTrigger>
            <TabsTrigger value="tools">Ferramentas IA</TabsTrigger>
            <TabsTrigger value="logs">Logs Recebidos</TabsTrigger>
            <TabsTrigger value="stats">Estatísticas</TabsTrigger>
          </TabsList>

          <TabsContent value="webhook" className="space-y-4">
            <div className="p-4 border rounded-lg bg-gradient-to-r from-purple-50 to-purple-100">
              <h4 className="font-medium text-purple-900 mb-3">🔗 URL do Webhook para n8n</h4>
              <div className="flex items-center gap-2 mb-3">
                <code className="flex-1 text-xs bg-white p-3 rounded border break-all">
                  {webhookUrl}
                </code>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleCopyWebhookUrl}
                  className={copiedUrl ? 'bg-green-50 border-green-200' : ''}
                >
                  <Copy className="w-3 h-3 mr-1" />
                  {copiedUrl ? 'Copiado!' : 'Copiar'}
                </Button>
              </div>
              
              <div className="text-sm text-purple-800 space-y-1">
                <p><strong>Método:</strong> POST</p>
                <p><strong>Headers necessários:</strong></p>
                <ul className="ml-4 text-xs">
                  <li>• Content-Type: application/json</li>
                  <li>• x-webhook-key: [TRAINERAI_WEBHOOK_KEY]</li>
                </ul>
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-gray-50">
              <h5 className="font-medium text-gray-900 mb-2">📋 Exemplo de Payload</h5>
              <pre className="text-xs bg-white p-3 rounded border overflow-auto">
{`{
  "remoteJid": "5511999999999@s.whatsapp.net",
  "message": "Mensagem do usuário",
  "type": "text",
  "date_time": "2024-01-15T10:30:00Z"
}`}
              </pre>
            </div>
          </TabsContent>

          <TabsContent value="tools" className="space-y-4">
            <div className="grid gap-4">
              {toolStats.map((tool) => (
                <div key={tool.tool} className="p-4 border rounded-lg bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{tool.icon}</span>
                      <h5 className="font-medium text-gray-900">{tool.tool}</h5>
                    </div>
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                      {tool.count} usos
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{tool.description}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>
                      Último uso: {tool.lastUsed !== 'Nunca' 
                        ? format(new Date(tool.lastUsed), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                        : 'Nunca'
                      }
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            {logsLoading ? (
              <div className="animate-pulse space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            ) : webhookLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhum webhook recebido ainda</p>
                <p className="text-sm">Os logs dos webhooks aparecerão aqui quando forem acionados</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {webhookLogs.map((log) => (
                  <div key={log.id} className="p-4 border rounded-lg bg-white">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline"
                          className={getStatusColor(log.processed, !!log.error_message)}
                        >
                          {getStatusIcon(log.processed, !!log.error_message)}
                          {log.error_message ? 'Erro' : log.processed ? 'Processado' : 'Pendente'}
                        </Badge>
                        <span className="font-medium text-sm">{log.source}</span>
                        <span className="text-xs text-gray-500">{log.event_type}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {format(new Date(log.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                      </span>
                    </div>
                    
                    {log.source === 'trainerai_whatsapp_n8n' && log.payload?.processed_data && (
                      <div className="text-sm text-gray-700 mb-2">
                        <strong>📱 {log.payload.processed_data.phone}:</strong> {log.payload.processed_data.message}
                      </div>
                    )}
                    
                    {log.error_message && (
                      <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                        Erro: {log.error_message}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg bg-gradient-to-r from-green-50 to-green-100">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h4 className="font-medium text-green-900">Webhooks Processados</h4>
                </div>
                <div className="text-2xl font-bold text-green-800">
                  {webhookLogs.filter(log => log.processed).length}
                </div>
                <p className="text-xs text-green-700">Últimas 24h</p>
              </div>

              <div className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <h4 className="font-medium text-blue-900">Total de Mensagens</h4>
                </div>
                <div className="text-2xl font-bold text-blue-800">
                  {webhookLogs.filter(log => log.source === 'trainerai_whatsapp_n8n').length}
                </div>
                <p className="text-xs text-blue-700">WhatsApp recebidas</p>
              </div>

              <div className="p-4 border rounded-lg bg-gradient-to-r from-purple-50 to-purple-100">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-purple-600" />
                  <h4 className="font-medium text-purple-900">Ferramentas Ativas</h4>
                </div>
                <div className="text-2xl font-bold text-purple-800">3</div>
                <p className="text-xs text-purple-700">Agendamento, Strava, IA</p>
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-yellow-50">
              <h4 className="font-medium text-yellow-900 mb-2">ℹ️ Fluxo do Sistema</h4>
              <div className="text-sm text-yellow-800 space-y-1">
                <p>1. Usuário envia mensagem no WhatsApp</p>
                <p>2. n8n aciona webhook: <code className="bg-white px-1 rounded">webhook.lrosystem.com/webhook/1aff07ab...</code></p>
                <p>3. Agente IA processa com OpenAI + Redis + 3 ferramentas</p>
                <p>4. Dados são enviados para este dashboard via webhook Supabase</p>
                <p>5. Dashboard exibe informações em tempo real</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default N8nApiIntegration
