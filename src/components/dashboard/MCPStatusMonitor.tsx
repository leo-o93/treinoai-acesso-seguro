
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Zap, 
  MessageSquare, 
  Send, 
  ArrowDown,
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Activity
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useMCPProtocol } from '@/lib/mcpProtocol'
import { toast } from '@/hooks/use-toast'

const MCPStatusMonitor: React.FC = () => {
  const { sendToBackend } = useMCPProtocol()

  // Buscar logs MCP
  const { data: mcpLogs = [], isLoading } = useQuery({
    queryKey: ['mcp-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_logs')
        .select('*')
        .like('source', 'mcp_%')
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      return data
    },
    refetchInterval: 5000
  })

  // Estatísticas MCP
  const mcpStats = React.useMemo(() => {
    const inbound = mcpLogs.filter(log => log.source === 'mcp_inbound').length
    const outbound = mcpLogs.filter(log => log.source === 'mcp_outbound').length
    const errors = mcpLogs.filter(log => log.error_message).length
    const successful = mcpLogs.filter(log => log.processed && !log.error_message).length

    return { inbound, outbound, errors, successful, total: mcpLogs.length }
  }, [mcpLogs])

  const handleTestMCP = async () => {
    const success = await sendToBackend(
      'system_notification',
      'test-session',
      {
        title: 'Teste MCP',
        message: 'Testando comunicação MCP entre frontend e backend',
        test: true
      }
    )

    if (success) {
      toast({
        title: 'Teste MCP enviado',
        description: 'Mensagem de teste enviada para o backend via protocolo MCP'
      })
    }
  }

  const getMessageTypeIcon = (eventType: string) => {
    if (eventType.includes('outbound')) return <Send className="w-4 h-4 text-blue-500" />
    if (eventType.includes('inbound')) return <ArrowDown className="w-4 h-4 text-green-500" />
    return <MessageSquare className="w-4 h-4 text-gray-500" />
  }

  const getStatusIcon = (log: any) => {
    if (log.error_message) return <AlertCircle className="w-4 h-4 text-red-500" />
    if (log.processed) return <CheckCircle className="w-4 h-4 text-green-500" />
    return <RefreshCw className="w-4 h-4 text-yellow-500" />
  }

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-500" />
            Monitor de Protocolo MCP
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-purple-50 text-purple-700">
              {mcpStats.total} mensagens
            </Badge>
            <Button size="sm" onClick={handleTestMCP}>
              Testar MCP
            </Button>
          </div>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Comunicação estruturada entre TrainerAI Frontend e n8n Backend
        </p>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="messages">Mensagens</TabsTrigger>
            <TabsTrigger value="protocol">Protocolo</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 border rounded-lg bg-blue-50">
                <div className="flex items-center gap-2 mb-1">
                  <Send className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-blue-900">Enviadas</span>
                </div>
                <div className="text-lg font-bold text-blue-800">{mcpStats.outbound}</div>
                <div className="text-xs text-blue-600">para backend</div>
              </div>

              <div className="p-3 border rounded-lg bg-green-50">
                <div className="flex items-center gap-2 mb-1">
                  <ArrowDown className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-green-900">Recebidas</span>
                </div>
                <div className="text-lg font-bold text-green-800">{mcpStats.inbound}</div>
                <div className="text-xs text-green-600">do backend</div>
              </div>

              <div className="p-3 border rounded-lg bg-emerald-50">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-medium text-emerald-900">Sucesso</span>
                </div>
                <div className="text-lg font-bold text-emerald-800">{mcpStats.successful}</div>
                <div className="text-xs text-emerald-600">processadas</div>
              </div>

              <div className="p-3 border rounded-lg bg-red-50">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium text-red-900">Erros</span>
                </div>
                <div className="text-lg font-bold text-red-800">{mcpStats.errors}</div>
                <div className="text-xs text-red-600">com falhas</div>
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-gradient-to-r from-purple-50 to-purple-100">
              <h4 className="font-medium text-purple-900 mb-2">Status do Protocolo MCP v1.0</h4>
              <div className="text-sm text-purple-800 space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Protocolo ativo e funcionando</span>
                </div>
                <p><strong>Última atividade:</strong> {
                  mcpLogs.length > 0 
                    ? format(new Date(mcpLogs[0].created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })
                    : 'Nenhuma atividade ainda'
                }</p>
                <p><strong>Versão:</strong> MCP 1.0 (Model Context Protocol)</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
            {isLoading ? (
              <div className="animate-pulse space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            ) : mcpLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhuma mensagem MCP ainda</p>
                <p className="text-sm">As mensagens do protocolo aparecerão aqui</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {mcpLogs.map((log) => {
                  // Type assertion para acessar propriedades do payload
                  const payload = log.payload as { mcp_message?: any; direction?: string }
                  
                  return (
                    <div key={log.id} className="p-4 border rounded-lg bg-white">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getMessageTypeIcon(log.event_type)}
                          {getStatusIcon(log)}
                          <span className="font-medium text-sm">{log.event_type}</span>
                          <Badge variant="outline" className="text-xs">
                            {log.source.replace('mcp_', '')}
                          </Badge>
                        </div>
                        <span className="text-xs text-gray-500">
                          {format(new Date(log.created_at), 'HH:mm:ss', { locale: ptBR })}
                        </span>
                      </div>

                      {payload?.mcp_message && (
                        <div className="text-sm text-gray-700 mb-2">
                          <div className="bg-gray-50 p-2 rounded text-xs">
                            <strong>Tipo:</strong> {payload.mcp_message.type} <br />
                            <strong>Sessão:</strong> {payload.mcp_message.session_id} <br />
                            <strong>Destino:</strong> {payload.mcp_message.destination}
                          </div>
                        </div>
                      )}

                      {log.error_message && (
                        <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                          Erro: {log.error_message}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="protocol" className="space-y-4">
            <div className="p-4 border rounded-lg bg-gray-50">
              <h4 className="font-medium text-gray-900 mb-3">📋 Especificação do Protocolo MCP</h4>
              <div className="text-sm text-gray-700 space-y-2">
                <p><strong>Versão:</strong> 1.0</p>
                <p><strong>Formato:</strong> JSON estruturado</p>
                <p><strong>Transporte:</strong> HTTP POST + Supabase Edge Functions</p>
                <p><strong>Autenticação:</strong> Supabase Auth + Webhook Keys</p>
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-blue-50">
              <h5 className="font-medium text-blue-900 mb-2">🔄 Tipos de Mensagem Suportados</h5>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>• user_update</div>
                <div>• new_plan</div>
                <div>• progress_update</div>
                <div>• strava_update</div>
                <div>• feedback_request</div>
                <div>• plan_adjustment</div>
                <div>• ai_response</div>
                <div>• system_notification</div>
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-green-50">
              <h5 className="font-medium text-green-900 mb-2">🌐 Endpoints Ativos</h5>
              <div className="text-xs text-green-800 space-y-1">
                <p><strong>Frontend → Backend:</strong> via webhook-receiver Edge Function</p>
                <p><strong>Backend → Frontend:</strong> via Supabase realtime + webhook_logs</p>
                <p><strong>Auditoria:</strong> Todas as mensagens são logadas</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default MCPStatusMonitor
