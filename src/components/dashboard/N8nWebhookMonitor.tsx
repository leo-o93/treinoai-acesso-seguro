import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Webhook, Settings, CheckCircle, AlertCircle, Copy, Eye, Clock, Activity, Zap, MessageCircle, Calendar, Brain, Bug, Database } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface N8nWebhookLog {
  id: string
  source: string
  event_type: string
  payload: any
  processed: boolean
  created_at: string
  error_message?: string
}

const N8nWebhookMonitor: React.FC = () => {
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [n8nWebhookUrl, setN8nWebhookUrl] = useState('https://webhook.lrosystem.com/webhook/1aff07ab-cf08-4128-be6a-d436f17a83f6')

  // URL do webhook do Supabase para receber dados do n8n
  const supabaseWebhookUrl = `https://shhkccidqvvrwgxlyvqq.supabase.co/functions/v1/webhook-receiver/trainerai`

  // Buscar logs específicos do n8n TrainerAI
  const { data: n8nLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['n8n-webhook-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_logs')
        .select('*')
        .eq('source', 'trainerai_whatsapp_n8n')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return data as N8nWebhookLog[]
    },
    refetchInterval: 5000 // Atualizar a cada 5 segundos para debug
  })

  // Estatísticas das mensagens por ferramenta
  const toolStats = React.useMemo(() => {
    const stats = {
      agendamento: 0,
      strava: 0,
      conhecimento: 0,
      total: n8nLogs.length,
      hoje: 0,
      sucesso: 0,
      erro: 0,
      errosAuth: 0,
      errosParsing: 0,
      errosValidacao: 0
    }

    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    n8nLogs.forEach(log => {
      // Contar mensagens de hoje
      if (new Date(log.created_at) >= hoje) {
        stats.hoje++
      }

      // Contar sucessos e erros
      if (log.error_message) {
        stats.erro++
        
        // Categorizar tipos de erro
        if (log.event_type === 'authentication_error') {
          stats.errosAuth++
        } else if (log.event_type === 'parse_error') {
          stats.errosParsing++
        } else if (log.event_type === 'validation_error') {
          stats.errosValidacao++
        }
      } else if (log.processed) {
        stats.sucesso++
      }

      // Analisar conteúdo da mensagem para categorizar por ferramenta
      const message = log.payload?.processed_data?.message?.toLowerCase() || ''
      
      if (message.includes('agenda') || message.includes('treino') || message.includes('dieta')) {
        stats.agendamento++
      } else if (message.includes('strava') || message.includes('corrida') || message.includes('pace')) {
        stats.strava++
      } else if (message) {
        stats.conhecimento++
      }
    })

    return stats
  }, [n8nLogs])

  const handleCopyWebhookUrl = () => {
    navigator.clipboard.writeText(supabaseWebhookUrl)
    setCopiedUrl(true)
    toast({
      title: 'URL copiada!',
      description: 'A URL do webhook foi copiada para a área de transferência.'
    })
    setTimeout(() => setCopiedUrl(false), 2000)
  }

  const getToolIcon = (message: string) => {
    const lowerMessage = message.toLowerCase()
    if (lowerMessage.includes('agenda') || lowerMessage.includes('treino') || lowerMessage.includes('dieta')) {
      return <Calendar className="w-4 h-4 text-blue-500" />
    } else if (lowerMessage.includes('strava') || lowerMessage.includes('corrida')) {
      return <Activity className="w-4 h-4 text-orange-500" />
    }
    return <Brain className="w-4 h-4 text-purple-500" />
  }

  const getToolName = (message: string) => {
    const lowerMessage = message.toLowerCase()
    if (lowerMessage.includes('agenda') || lowerMessage.includes('treino') || lowerMessage.includes('dieta')) {
      return 'AGENDAMENTO'
    } else if (lowerMessage.includes('strava') || lowerMessage.includes('corrida')) {
      return 'STRAVA'
    }
    return 'CONHECIMENTO-IA'
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

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'authentication_error': return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'parse_error': return <Bug className="w-4 h-4 text-yellow-500" />
      case 'validation_error': return <Database className="w-4 h-4 text-orange-500" />
      case 'message_received': return <MessageCircle className="w-4 h-4 text-green-500" />
      default: return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Webhook className="w-5 h-5 text-blue-500" />
          Monitor n8n TrainerAI
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Eye className="w-3 h-3 mr-1" />
            {toolStats.total} logs
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="debug">Debug</TabsTrigger>
            <TabsTrigger value="config">Configuração</TabsTrigger>
            <TabsTrigger value="messages">Mensagens</TabsTrigger>
            <TabsTrigger value="errors">Erros</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Estatísticas principais */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 border rounded-lg bg-blue-50">
                <div className="flex items-center gap-2 mb-1">
                  <MessageCircle className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-blue-900">Total</span>
                </div>
                <div className="text-lg font-bold text-blue-800">{toolStats.total}</div>
                <div className="text-xs text-blue-600">logs recebidos</div>
              </div>
              
              <div className="p-3 border rounded-lg bg-green-50">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-green-900">Processados</span>
                </div>
                <div className="text-lg font-bold text-green-800">{toolStats.sucesso}</div>
                <div className="text-xs text-green-600">com sucesso</div>
              </div>
              
              <div className="p-3 border rounded-lg bg-red-50">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium text-red-900">Erros</span>
                </div>
                <div className="text-lg font-bold text-red-800">{toolStats.erro}</div>
                <div className="text-xs text-red-600">com falhas</div>
              </div>
              
              <div className="p-3 border rounded-lg bg-purple-50">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium text-purple-900">Hoje</span>
                </div>
                <div className="text-lg font-bold text-purple-800">{toolStats.hoje}</div>
                <div className="text-xs text-purple-600">últimas 24h</div>
              </div>
            </div>

            {/* Status da conexão */}
            <div className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-blue-100">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-blue-900">Status da Integração n8n</h4>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${toolStats.total > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                  <span className="text-xs text-blue-700">
                    {toolStats.total > 0 ? 'Recebendo dados' : 'Aguardando dados'}
                  </span>
                </div>
              </div>
              <div className="text-sm text-blue-800">
                <p><strong>Webhook n8n:</strong> {n8nWebhookUrl}</p>
                <p><strong>Último log:</strong> {
                  n8nLogs.length > 0 
                    ? format(new Date(n8nLogs[0].created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })
                    : 'Nenhum dado recebido ainda'
                }</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="debug" className="space-y-4">
            {/* Breakdown de erros */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 border rounded-lg bg-red-50">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium text-red-900">Erros de Auth</span>
                </div>
                <div className="text-lg font-bold text-red-800">{toolStats.errosAuth}</div>
                <div className="text-xs text-red-600">webhook key inválida</div>
              </div>
              
              <div className="p-3 border rounded-lg bg-yellow-50">
                <div className="flex items-center gap-2 mb-1">
                  <Bug className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium text-yellow-900">Erros de Parse</span>
                </div>
                <div className="text-lg font-bold text-yellow-800">{toolStats.errosParsing}</div>
                <div className="text-xs text-yellow-600">JSON inválido</div>
              </div>
              
              <div className="p-3 border rounded-lg bg-orange-50">
                <div className="flex items-center gap-2 mb-1">
                  <Database className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium text-orange-900">Erros de Validação</span>
                </div>
                <div className="text-lg font-bold text-orange-800">{toolStats.errosValidacao}</div>
                <div className="text-xs text-orange-600">campos obrigatórios</div>
              </div>
            </div>

            {/* Logs de debug mais recentes */}
            <div className="p-4 border rounded-lg bg-gray-50">
              <h4 className="font-medium text-gray-900 mb-3">🔍 Logs de Debug Recentes</h4>
              {n8nLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="mb-3 p-3 border rounded bg-white text-xs">
                  <div className="flex items-center gap-2 mb-1">
                    {getEventTypeIcon(log.event_type)}
                    <span className="font-medium">{log.event_type}</span>
                    <span className="text-gray-500">
                      {format(new Date(log.created_at), 'HH:mm:ss', { locale: ptBR })}
                    </span>
                  </div>
                  
                  {log.payload?.debug_info && (
                    <div className="bg-gray-50 p-2 rounded mt-2">
                      <p><strong>Headers:</strong> {JSON.stringify(log.payload.debug_info.headers, null, 2)}</p>
                      <p><strong>Body Type:</strong> {log.payload.debug_info.body_type}</p>
                      <p><strong>Fields Found:</strong> {log.payload.debug_info.fields_found?.join(', ')}</p>
                    </div>
                  )}
                  
                  {log.error_message && (
                    <div className="text-red-600 bg-red-50 p-2 rounded mt-2">
                      <strong>Erro:</strong> {log.error_message}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="config" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="n8n-url">URL do Webhook n8n (origem dos dados)</Label>
                <Input
                  id="n8n-url"
                  value={n8nWebhookUrl}
                  onChange={(e) => setN8nWebhookUrl(e.target.value)}
                  placeholder="https://webhook.lrosystem.com/webhook/..."
                />
              </div>

              <div className="p-4 border rounded-lg bg-gradient-to-r from-green-50 to-green-100">
                <h4 className="font-medium text-green-900 mb-3">🔗 URL do Webhook Supabase (para configurar no n8n)</h4>
                <div className="flex items-center gap-2 mb-3">
                  <code className="flex-1 text-xs bg-white p-3 rounded border break-all">
                    {supabaseWebhookUrl}
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
                
                <div className="text-sm text-green-800 space-y-1">
                  <p><strong>Método:</strong> POST</p>
                  <p><strong>Headers necessários:</strong></p>
                  <ul className="ml-4 text-xs">
                    <li>• Content-Type: application/json</li>
                    <li>• x-webhook-key: [TRAINERAI_WEBHOOK_KEY]</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 border rounded-lg bg-gray-50">
                <h5 className="font-medium text-gray-900 mb-2">📋 Exemplo de Payload do n8n</h5>
                <pre className="text-xs bg-white p-3 rounded border overflow-auto">
{`{
  "remoteJid": "5511999999999@s.whatsapp.net",
  "message": "Mensagem do usuário processada pelo agente IA",
  "type": "text",
  "date_time": "2024-01-15T10:30:00Z"
}`}
                </pre>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
            {logsLoading ? (
              <div className="animate-pulse space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            ) : n8nLogs.filter(log => log.event_type === 'message_received').length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhuma mensagem processada ainda</p>
                <p className="text-sm">As mensagens do WhatsApp aparecerão aqui quando o n8n enviar os dados</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {n8nLogs.filter(log => log.event_type === 'message_received').map((log) => (
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
                        <div className="flex items-center gap-1">
                          {getToolIcon(log.payload?.processed_data?.message || '')}
                          <span className="text-xs font-medium">
                            {getToolName(log.payload?.processed_data?.message || '')}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {format(new Date(log.created_at), 'dd/MM HH:mm:ss', { locale: ptBR })}
                      </span>
                    </div>
                    
                    {log.payload?.processed_data && (
                      <div className="space-y-2">
                        <div className="text-sm text-gray-700">
                          <strong>📱 {log.payload.processed_data.phone}:</strong>
                        </div>
                        <div className="text-sm text-gray-800 bg-gray-50 p-2 rounded">
                          "{log.payload.processed_data.message}"
                        </div>
                      </div>
                    )}
                    
                    {log.error_message && (
                      <div className="text-xs text-red-600 bg-red-50 p-2 rounded mt-2">
                        Erro: {log.error_message}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="errors" className="space-y-4">
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {n8nLogs.filter(log => log.error_message).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-300" />
                  <p>Nenhum erro registrado</p>
                  <p className="text-sm">Todos os webhooks foram processados com sucesso</p>
                </div>
              ) : (
                n8nLogs.filter(log => log.error_message).map((log) => (
                  <div key={log.id} className="p-4 border rounded-lg bg-red-50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getEventTypeIcon(log.event_type)}
                        <span className="font-medium text-red-900">{log.event_type}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {format(new Date(log.created_at), 'dd/MM HH:mm:ss', { locale: ptBR })}
                      </span>
                    </div>
                    
                    <div className="text-sm text-red-800 mb-2">
                      <strong>Erro:</strong> {log.error_message}
                    </div>
                    
                    {log.payload && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-red-700 font-medium">
                          Ver detalhes do payload
                        </summary>
                        <pre className="mt-2 p-2 bg-white rounded border overflow-auto">
                          {JSON.stringify(log.payload, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default N8nWebhookMonitor
