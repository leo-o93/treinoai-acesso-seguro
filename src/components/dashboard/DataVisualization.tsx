
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { 
  TrendingUp, 
  Target, 
  Activity, 
  Calendar,
  Award,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react'
import { ProcessedData } from '@/services/dataProcessor'

interface DataVisualizationProps {
  data: ProcessedData
}

const DataVisualization: React.FC<DataVisualizationProps> = ({ data }) => {
  const { metrics, stravaActivities, calendarEvents, insights } = data

  // Preparar dados para gráficos
  const weeklyActivityData = stravaActivities.slice(0, 7).reverse().map((activity, index) => ({
    day: `Dia ${index + 1}`,
    distance: activity.distance,
    duration: activity.duration,
    pace: activity.pace
  }))

  const progressData = [
    { name: 'Aderência', value: metrics.adherenceScore, color: '#22c55e' },
    { name: 'Consistência', value: metrics.consistencyScore, color: '#3b82f6' },
    { name: 'Meta', value: 100 - Math.max(metrics.adherenceScore, metrics.consistencyScore), color: '#e5e7eb' }
  ]

  const weeklyEventsData = calendarEvents
    .filter(event => new Date(event.startTime) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
    .reduce((acc, event) => {
      const day = new Date(event.startTime).toLocaleDateString('pt-BR', { weekday: 'short' })
      const existing = acc.find(item => item.day === day)
      
      if (existing) {
        existing.count += 1
        if (event.status === 'completed') existing.completed += 1
      } else {
        acc.push({
          day,
          count: 1,
          completed: event.status === 'completed' ? 1 : 0
        })
      }
      
      return acc
    }, [] as Array<{ day: string; count: number; completed: number }>)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {/* Métricas Principais */}
      <Card className="xl:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            Métricas de Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">
                {metrics.weeklyProgress.workoutsCompleted}
              </div>
              <div className="text-sm text-gray-600">Treinos Realizados</div>
              <div className="text-xs text-gray-500">
                de {metrics.weeklyProgress.workoutsPlanned} planejados
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {metrics.weeklyProgress.totalDistance.toFixed(1)}km
              </div>
              <div className="text-sm text-gray-600">Distância Total</div>
              <div className="text-xs text-gray-500">últimos 7 dias</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(metrics.weeklyProgress.totalTime)}min
              </div>
              <div className="text-sm text-gray-600">Tempo Ativo</div>
              <div className="text-xs text-gray-500">tempo de treino</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {metrics.weeklyProgress.averagePace.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Pace Médio</div>
              <div className="text-xs text-gray-500">km/h</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Progresso Semanal */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            Progresso dos Últimos Treinos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={weeklyActivityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="distance" 
                stroke="#3b82f6" 
                fill="#3b82f6" 
                fillOpacity={0.3}
                name="Distância (km)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Scores de Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-500" />
            Scores de Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Aderência</span>
                <span className="text-sm text-gray-600">{Math.round(metrics.adherenceScore)}%</span>
              </div>
              <Progress value={metrics.adherenceScore} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Consistência</span>
                <span className="text-sm text-gray-600">{Math.round(metrics.consistencyScore)}%</span>
              </div>
              <Progress value={metrics.consistencyScore} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Taxa de Melhoria</span>
                <span className={`text-sm ${metrics.improvementRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.improvementRate >= 0 ? '+' : ''}{metrics.improvementRate.toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={Math.abs(metrics.improvementRate)} 
                className="h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agenda da Semana */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-500" />
            Agenda da Semana
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyEventsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="completed" fill="#22c55e" name="Concluídos" />
              <Bar dataKey="count" fill="#e5e7eb" name="Total" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Insights e Recomendações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500" />
            Insights da IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {insights.slice(0, 4).map((insight) => (
              <div 
                key={insight.id}
                className={`p-3 rounded-lg border ${
                  insight.type === 'achievement' ? 'bg-green-50 border-green-200' :
                  insight.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                  insight.type === 'progress' ? 'bg-blue-50 border-blue-200' :
                  'bg-purple-50 border-purple-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  {insight.type === 'achievement' && <Award className="w-4 h-4 text-green-600 mt-0.5" />}
                  {insight.type === 'warning' && <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />}
                  {insight.type === 'progress' && <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5" />}
                  {insight.type === 'recommendation' && <CheckCircle2 className="w-4 h-4 text-purple-600 mt-0.5" />}
                  
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{insight.title}</h4>
                    <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
                    
                    <div className="flex items-center gap-2 mt-2">
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
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Próximas Metas */}
      <Card className="xl:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-500" />
            Próximas Metas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {metrics.nextGoals.map((goal, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{index + 1}</span>
                </div>
                <span className="text-sm font-medium text-emerald-800">{goal}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default DataVisualization
