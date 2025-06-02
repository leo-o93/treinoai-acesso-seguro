
import React from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useDataProcessor } from '@/hooks/useDataProcessor'
import Navbar from '@/components/layout/Navbar'
import DataVisualization from '@/components/dashboard/DataVisualization'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  RefreshCw, 
  BarChart3, 
  Brain,
  Activity,
  Calendar,
  TrendingUp
} from 'lucide-react'

const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const { data, isLoading, error, refreshData } = useDataProcessor()

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
        <Navbar />
        <div className="container mx-auto p-6">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-semibold text-red-700 mb-2">Erro no Processamento</h2>
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={refreshData} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar Novamente
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <Navbar />
      
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              TrainerAI - Dashboard Visual
            </h1>
            <p className="text-gray-600">
              Análises visuais dos seus dados coletados pelo agente IA
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {data && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-green-600">
                  <Activity className="w-3 h-3 mr-1" />
                  {data.stravaActivities.length} atividades
                </Badge>
                <Badge variant="outline" className="text-blue-600">
                  <Calendar className="w-3 h-3 mr-1" />
                  {data.calendarEvents.length} eventos
                </Badge>
                <Badge variant="outline" className="text-purple-600">
                  <Brain className="w-3 h-3 mr-1" />
                  {data.insights.length} insights
                </Badge>
              </div>
            )}
            
            <Button 
              onClick={refreshData} 
              disabled={isLoading}
              size="sm"
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Status do Sistema */}
        {data && (
          <Card className="bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="font-medium text-emerald-800">
                    Sistema TrainerAI Ativo - Processando dados do N8N
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-emerald-700">
                  <span>Score Aderência: {Math.round(data.metrics.adherenceScore)}%</span>
                  <span>Consistência: {Math.round(data.metrics.consistencyScore)}%</span>
                  <span>Melhoria: {data.metrics.improvementRate >= 0 ? '+' : ''}{data.metrics.improvementRate.toFixed(1)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Conteúdo Principal - Apenas Análises e Insights */}
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Análises
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Insights IA
            </TabsTrigger>
          </TabsList>

          {/* Tab de Análises - Principal */}
          <TabsContent value="analytics" className="space-y-6">
            {isLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="animate-pulse">
                        <div className="h-48 bg-gray-200 rounded-lg"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : data ? (
              <DataVisualization data={data} />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Brain className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Aguardando Dados do N8N
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Envie mensagens pelo WhatsApp para começar a ver suas análises aqui
                  </p>
                  <Button onClick={refreshData} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Verificar Novamente
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab de Insights IA */}
          <TabsContent value="insights" className="space-y-6">
            {data && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-purple-500" />
                      Recomendações Personalizadas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {data.insights.filter(insight => insight.type === 'recommendation').map((insight) => (
                        <div key={insight.id} className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                          <h4 className="font-medium text-purple-800">{insight.title}</h4>
                          <p className="text-sm text-purple-700 mt-1">{insight.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-500" />
                      Próximos Objetivos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {data.metrics.nextGoals.map((goal, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                          <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">{index + 1}</span>
                          </div>
                          <span className="text-sm text-emerald-800">{goal}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-blue-500" />
                      Análises Extraídas das Conversas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {data.insights.map((insight) => (
                        <div 
                          key={insight.id}
                          className={`p-4 rounded-lg border ${
                            insight.type === 'achievement' ? 'bg-green-50 border-green-200' :
                            insight.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                            insight.type === 'progress' ? 'bg-blue-50 border-blue-200' :
                            'bg-purple-50 border-purple-200'
                          }`}
                        >
                          <h4 className="font-medium text-sm mb-2">{insight.title}</h4>
                          <p className="text-xs text-gray-600">{insight.description}</p>
                          
                          <div className="flex items-center gap-2 mt-3">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                insight.impact === 'high' ? 'border-red-300 text-red-700' :
                                insight.impact === 'medium' ? 'border-yellow-300 text-yellow-700' :
                                'border-green-300 text-green-700'
                              }`}
                            >
                              {insight.impact === 'high' ? 'Alto Impacto' :
                               insight.impact === 'medium' ? 'Médio Impacto' :
                               'Baixo Impacto'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default Dashboard
