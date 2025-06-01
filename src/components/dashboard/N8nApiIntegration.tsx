
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Zap, Send, Settings, CheckCircle, AlertCircle, Code } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface Webhook {
  id: string
  name: string
  url: string
  status: 'active' | 'inactive'
  lastTriggered?: string
}

interface ApiEndpoint {
  id: string
  name: string
  method: string
  endpoint: string
  description: string
}

const N8nApiIntegration: React.FC = () => {
  const [webhooks, setWebhooks] = useState<Webhook[]>([
    {
      id: '1',
      name: 'Novo Treino Completado',
      url: 'https://hook.integromat.com/webhook1',
      status: 'active',
      lastTriggered: '2024-01-15 14:30'
    },
    {
      id: '2',
      name: 'Meta Atingida',
      url: 'https://hook.integromat.com/webhook2',
      status: 'active'
    }
  ])

  const [newWebhookUrl, setNewWebhookUrl] = useState('')
  const [newWebhookName, setNewWebhookName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const apiEndpoints: ApiEndpoint[] = [
    {
      id: '1',
      name: 'Obter Dados do Usuário',
      method: 'GET',
      endpoint: '/api/user/profile',
      description: 'Retorna os dados completos do perfil do usuário'
    },
    {
      id: '2',
      name: 'Listar Atividades',
      method: 'GET',
      endpoint: '/api/activities',
      description: 'Lista todas as atividades do usuário'
    },
    {
      id: '3',
      name: 'Criar Evento',
      method: 'POST',
      endpoint: '/api/calendar/events',
      description: 'Cria um novo evento no calendário'
    },
    {
      id: '4',
      name: 'Atualizar Meta',
      method: 'PUT',
      endpoint: '/api/goals/:id',
      description: 'Atualiza uma meta existente'
    }
  ]

  const handleAddWebhook = () => {
    if (!newWebhookUrl || !newWebhookName) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha nome e URL do webhook.',
        variant: 'destructive'
      })
      return
    }

    const newWebhook: Webhook = {
      id: Date.now().toString(),
      name: newWebhookName,
      url: newWebhookUrl,
      status: 'active'
    }

    setWebhooks([...webhooks, newWebhook])
    setNewWebhookName('')
    setNewWebhookUrl('')

    toast({
      title: 'Webhook adicionado',
      description: 'O webhook foi configurado com sucesso.'
    })
  }

  const handleTestWebhook = async (webhook: Webhook) => {
    setIsLoading(true)
    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'no-cors',
        body: JSON.stringify({
          event: 'test',
          timestamp: new Date().toISOString(),
          user_id: 'demo-user',
          data: {
            message: 'Teste de webhook do TrainerAI',
            source: 'dashboard'
          }
        })
      })

      // Atualizar último trigger
      setWebhooks(webhooks.map(w => 
        w.id === webhook.id 
          ? { ...w, lastTriggered: new Date().toLocaleString('pt-BR') }
          : w
      ))

      toast({
        title: 'Webhook testado',
        description: 'O webhook foi disparado com sucesso. Verifique seu fluxo n8n.'
      })
    } catch (error) {
      toast({
        title: 'Erro no teste',
        description: 'Não foi possível testar o webhook.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveWebhook = (webhookId: string) => {
    setWebhooks(webhooks.filter(w => w.id !== webhookId))
    toast({
      title: 'Webhook removido',
      description: 'O webhook foi removido com sucesso.'
    })
  }

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-500" />
          Integrações n8n / Make
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="webhooks" className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            <TabsTrigger value="api">API Endpoints</TabsTrigger>
            <TabsTrigger value="examples">Exemplos</TabsTrigger>
          </TabsList>

          <TabsContent value="webhooks" className="space-y-4">
            {/* Adicionar Webhook */}
            <div className="p-4 border rounded-lg bg-gray-50">
              <h4 className="font-medium text-gray-900 mb-3">Adicionar Novo Webhook</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  placeholder="Nome do webhook"
                  value={newWebhookName}
                  onChange={(e) => setNewWebhookName(e.target.value)}
                />
                <Input
                  placeholder="URL do webhook"
                  value={newWebhookUrl}
                  onChange={(e) => setNewWebhookUrl(e.target.value)}
                />
                <Button onClick={handleAddWebhook}>
                  <Zap className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </div>

            {/* Lista de Webhooks */}
            <div className="space-y-3">
              {webhooks.map((webhook) => (
                <div key={webhook.id} className="p-4 border rounded-lg bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h5 className="font-medium text-gray-900">{webhook.name}</h5>
                      <Badge 
                        variant="outline"
                        className={webhook.status === 'active' 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : 'bg-gray-50 text-gray-700 border-gray-200'
                        }
                      >
                        {webhook.status === 'active' ? (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        ) : (
                          <AlertCircle className="w-3 h-3 mr-1" />
                        )}
                        {webhook.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleTestWebhook(webhook)}
                        disabled={isLoading}
                      >
                        <Send className="w-3 h-3 mr-1" />
                        Testar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleRemoveWebhook(webhook.id)}
                      >
                        Remover
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{webhook.url}</p>
                  {webhook.lastTriggered && (
                    <p className="text-xs text-gray-500">
                      Último disparo: {webhook.lastTriggered}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="api" className="space-y-4">
            <div className="space-y-3">
              {apiEndpoints.map((endpoint) => (
                <div key={endpoint.id} className="p-4 border rounded-lg bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {endpoint.method}
                      </Badge>
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {endpoint.endpoint}
                      </code>
                    </div>
                    <Button size="sm" variant="outline">
                      <Code className="w-3 h-3 mr-1" />
                      Copiar
                    </Button>
                  </div>
                  <h5 className="font-medium text-gray-900 mb-1">{endpoint.name}</h5>
                  <p className="text-sm text-gray-600">{endpoint.description}</p>
                </div>
              ))}
            </div>

            <div className="p-4 border rounded-lg bg-blue-50">
              <h4 className="font-medium text-blue-900 mb-2">Autenticação</h4>
              <p className="text-sm text-blue-800 mb-2">
                Use o token de autenticação no header:
              </p>
              <code className="text-xs bg-blue-100 p-2 rounded block">
                Authorization: Bearer YOUR_API_TOKEN
              </code>
            </div>
          </TabsContent>

          <TabsContent value="examples" className="space-y-4">
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-gradient-to-r from-green-50 to-green-100">
                <h4 className="font-medium text-green-900 mb-2">🏃 Automação: Novo Treino</h4>
                <p className="text-sm text-green-800 mb-2">
                  Dispara quando um treino é completado no Strava
                </p>
                <ul className="text-xs text-green-700 space-y-1">
                  <li>• Envia notificação no Slack</li>
                  <li>• Atualiza planilha no Google Sheets</li>
                  <li>• Cria tarefa no Notion</li>
                </ul>
              </div>

              <div className="p-4 border rounded-lg bg-gradient-to-r from-purple-50 to-purple-100">
                <h4 className="font-medium text-purple-900 mb-2">🎯 Automação: Meta Atingida</h4>
                <p className="text-sm text-purple-800 mb-2">
                  Dispara quando uma meta é concluída
                </p>
                <ul className="text-xs text-purple-700 space-y-1">
                  <li>• Envia email de parabéns</li>
                  <li>• Posta nas redes sociais</li>
                  <li>• Agenda próxima avaliação</li>
                </ul>
              </div>

              <div className="p-4 border rounded-lg bg-gradient-to-r from-orange-50 to-orange-100">
                <h4 className="font-medium text-orange-900 mb-2">📊 Automação: Relatório Semanal</h4>
                <p className="text-sm text-orange-800 mb-2">
                  Gera relatório automático toda segunda-feira
                </p>
                <ul className="text-xs text-orange-700 space-y-1">
                  <li>• Compila dados da semana</li>
                  <li>• Gera PDF personalizado</li>
                  <li>• Envia por email para o coach</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default N8nApiIntegration
