
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Bot, MessageCircle, ExternalLink, Phone, Activity } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useDataProcessor } from '@/hooks/useDataProcessor'
import ConversationViewer from '@/components/dashboard/ConversationViewer'

const ChatTrainer: React.FC = () => {
  const navigate = useNavigate()
  const { data, isLoading } = useDataProcessor()

  const conversations = data ? data.insights.map((insight, index) => ({
    id: `conv-${index}`,
    userMessage: `Conversa processada #${index + 1}`,
    aiResponse: insight.description,
    timestamp: insight.createdAt,
    category: insight.type === 'progress' ? 'strava_atividades' : 'agenda_treino',
    extractedData: {
      workouts: data.workoutPlans.length,
      meals: data.nutritionPlans.length,
      events: data.calendarEvents.length
    }
  })) : []

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-6 h-6 text-emerald-500" />
              TrainerAI - Visualizador de Conversas
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500">Modo Visualização</Badge>
              <Badge variant="outline" className="text-blue-600">
                Dados Processados
              </Badge>
            </div>
          </CardTitle>
          <p className="text-sm text-gray-600">
            Visualize as conversas processadas pelo agente IA do N8N
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Estatísticas */}
          {data && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">
                  {data.stravaActivities.length}
                </div>
                <div className="text-sm text-gray-600">Atividades Coletadas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {data.calendarEvents.length}
                </div>
                <div className="text-sm text-gray-600">Eventos na Agenda</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {data.insights.length}
                </div>
                <div className="text-sm text-gray-600">Insights Gerados</div>
              </div>
            </div>
          )}

          {/* Informações sobre o Funcionamento */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <MessageCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-800 mb-2">Como Funciona</h3>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p>• Envie mensagens pelo WhatsApp (553183932843)</p>
                    <p>• O agente IA N8N processa usando ferramentas MCP</p>
                    <p>• Os dados são enviados para o TrainerAI</p>
                    <p>• Visualize aqui todas as análises processadas</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Visualizador de Conversas */}
          <ConversationViewer 
            conversations={conversations}
            isLoading={isLoading}
          />

          {/* Ações Rápidas */}
          <div className="flex gap-3">
            <Button 
              onClick={() => navigate('/dashboard')}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600"
            >
              <Activity className="w-4 h-4 mr-2" />
              Ver Dashboard Completo
            </Button>
            
            <Button 
              onClick={() => navigate('/operator')}
              variant="outline"
              className="flex-1"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Monitoramento Avançado
            </Button>
          </div>

          {/* Contato WhatsApp */}
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-green-600" />
                  <div>
                    <span className="font-medium text-green-800">WhatsApp TrainerAI</span>
                    <p className="text-sm text-green-700">+55 31 8393-2843</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="bg-green-500 hover:bg-green-600"
                  onClick={() => window.open('https://wa.me/5531839328843', '_blank')}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Conversar
                </Button>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}

export default ChatTrainer
