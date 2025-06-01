
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Activity, TrendingUp, Target, Award, Calendar } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { getStravaActivities } from '@/lib/database'

interface AdvancedMetrics {
  powerZones: { zone: string; time: number; percentage: number; color: string }[]
  heartRateZones: { zone: string; time: number; color: string }[]
  trainingLoad: { date: string; load: number; fitness: number; fatigue: number }[]
  performanceTrends: { metric: string; current: number; previous: number; change: number }[]
}

const AdvancedStravaAnalytics: React.FC = () => {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState<AdvancedMetrics | null>(null)

  const { data: activities = [] } = useQuery({
    queryKey: ['advanced-strava', user?.id],
    queryFn: () => getStravaActivities(user!.id, 100),
    enabled: !!user?.id
  })

  useEffect(() => {
    generateAdvancedMetrics()
  }, [activities])

  const generateAdvancedMetrics = () => {
    if (activities.length === 0) return

    // Simular dados avançados do Strava
    const powerZones = [
      { zone: 'Z1 (Ativo)', time: 45, percentage: 25, color: '#22c55e' },
      { zone: 'Z2 (Base)', time: 60, percentage: 33, color: '#3b82f6' },
      { zone: 'Z3 (Tempo)', time: 30, percentage: 17, color: '#f59e0b' },
      { zone: 'Z4 (Limiar)', time: 25, percentage: 14, color: '#ef4444' },
      { zone: 'Z5 (VO2)', time: 15, percentage: 8, color: '#8b5cf6' },
      { zone: 'Z6 (Neuro)', time: 5, percentage: 3, color: '#ec4899' }
    ]

    const heartRateZones = [
      { zone: 'Z1', time: 120, color: '#22c55e' },
      { zone: 'Z2', time: 180, color: '#3b82f6' },
      { zone: 'Z3', time: 90, color: '#f59e0b' },
      { zone: 'Z4', time: 60, color: '#ef4444' },
      { zone: 'Z5', time: 30, color: '#8b5cf6' }
    ]

    const trainingLoad = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      load: Math.random() * 100 + 50,
      fitness: Math.random() * 80 + 40,
      fatigue: Math.random() * 60 + 20
    }))

    const performanceTrends = [
      { metric: 'FTP', current: 285, previous: 275, change: 3.6 },
      { metric: 'VO2 Max', current: 52, previous: 50, change: 4.0 },
      { metric: 'Pace Z2', current: 4.2, previous: 4.35, change: -3.4 },
      { metric: 'FC Repouso', current: 48, previous: 52, change: -7.7 }
    ]

    setMetrics({
      powerZones,
      heartRateZones,
      trainingLoad,
      performanceTrends
    })
  }

  if (!metrics) {
    return (
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="text-center">
            <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">Carregando análises avançadas...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-orange-500" />
          Análise Avançada Strava
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="zones" className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="zones">Zonas</TabsTrigger>
            <TabsTrigger value="load">Carga</TabsTrigger>
            <TabsTrigger value="trends">Tendências</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="zones" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Zonas de Potência */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Distribuição de Zonas de Potência</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={metrics.powerZones}
                      dataKey="percentage"
                      nameKey="zone"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ zone, percentage }) => `${zone}: ${percentage}%`}
                    >
                      {metrics.powerZones.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Zonas de FC */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Tempo em Zonas de FC (min)</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={metrics.heartRateZones}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="zone" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="time" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="load">
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Carga de Treinamento (TSS)</h4>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={metrics.trainingLoad}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="load" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} name="Carga" />
                  <Area type="monotone" dataKey="fitness" stackId="2" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} name="Fitness" />
                  <Area type="monotone" dataKey="fatigue" stackId="3" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} name="Fadiga" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="trends">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {metrics.performanceTrends.map((trend) => (
                <div key={trend.metric} className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-900">{trend.metric}</h5>
                    <Badge 
                      variant="outline"
                      className={trend.change > 0 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}
                    >
                      {trend.change > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingUp className="w-3 h-3 mr-1 rotate-180" />}
                      {Math.abs(trend.change).toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{trend.current}</div>
                  <div className="text-sm text-gray-500">Anterior: {trend.previous}</div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="performance">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-900">Forma Atual</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-900">Excelente</div>
                  <div className="text-sm text-blue-700">TSB: +15</div>
                </div>

                <div className="p-4 border rounded-lg bg-gradient-to-r from-green-50 to-green-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-900">PR este mês</span>
                  </div>
                  <div className="text-2xl font-bold text-green-900">3</div>
                  <div className="text-sm text-green-700">Novos recordes</div>
                </div>

                <div className="p-4 border rounded-lg bg-gradient-to-r from-purple-50 to-purple-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    <span className="font-medium text-purple-900">Sequência</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-900">12 dias</div>
                  <div className="text-sm text-purple-700">Atividade contínua</div>
                </div>
              </div>

              <div className="p-4 border rounded-lg bg-gradient-to-r from-orange-50 to-orange-100">
                <h5 className="font-medium text-orange-900 mb-2">Recomendações de Treino</h5>
                <ul className="space-y-1 text-sm text-orange-800">
                  <li>• Adicionar mais trabalho de base (Z2) nos próximos 7 dias</li>
                  <li>• Reduzir intensidade high-end para permitir recuperação</li>
                  <li>• Focar em treinos de técnica e eficiência</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default AdvancedStravaAnalytics
