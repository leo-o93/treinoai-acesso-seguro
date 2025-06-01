
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, Activity, Target, Calendar, BarChart3, PieChart as PieChartIcon, Zap } from 'lucide-react'
import { StravaActivity } from '@/lib/database'
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface AdvancedPerformanceProps {
  activities: StravaActivity[]
}

const AdvancedPerformance: React.FC<AdvancedPerformanceProps> = ({ activities }) => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month')
  const [metricType, setMetricType] = useState<'distance' | 'time' | 'calories' | 'pace'>('distance')

  // Prepare data for charts
  const prepareChartData = () => {
    const now = new Date()
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90
    
    const chartData = []
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(now, i)
      const dayActivities = activities.filter(activity => 
        format(new Date(activity.start_date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      )
      
      const total = dayActivities.reduce((sum, activity) => {
        switch (metricType) {
          case 'distance': return sum + (activity.distance || 0)
          case 'time': return sum + (activity.moving_time || 0) / 60 // Convert to minutes
          case 'calories': return sum + (activity.calories || 0)
          case 'pace': return activity.distance ? sum + ((activity.moving_time || 0) / 60) / (activity.distance || 1) : sum
          default: return sum
        }
      }, 0)
      
      chartData.push({
        date: format(date, 'dd/MM'),
        value: Number(total.toFixed(2)),
        count: dayActivities.length
      })
    }
    
    return chartData
  }

  // Activity type distribution
  const getActivityDistribution = () => {
    const distribution = activities.reduce((acc, activity) => {
      acc[activity.type] = (acc[activity.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return Object.entries(distribution).map(([type, count]) => ({
      name: type,
      value: count
    }))
  }

  // Weekly comparison
  const getWeeklyComparison = () => {
    const thisWeek = activities.filter(activity => {
      const activityDate = new Date(activity.start_date)
      const weekStart = startOfWeek(new Date())
      const weekEnd = endOfWeek(new Date())
      return activityDate >= weekStart && activityDate <= weekEnd
    })
    
    const lastWeek = activities.filter(activity => {
      const activityDate = new Date(activity.start_date)
      const weekStart = startOfWeek(subDays(new Date(), 7))
      const weekEnd = endOfWeek(subDays(new Date(), 7))
      return activityDate >= weekStart && activityDate <= weekEnd
    })
    
    return {
      thisWeek: {
        count: thisWeek.length,
        distance: thisWeek.reduce((sum, a) => sum + (a.distance || 0), 0),
        time: thisWeek.reduce((sum, a) => sum + (a.moving_time || 0), 0),
        calories: thisWeek.reduce((sum, a) => sum + (a.calories || 0), 0)
      },
      lastWeek: {
        count: lastWeek.length,
        distance: lastWeek.reduce((sum, a) => sum + (a.distance || 0), 0),
        time: lastWeek.reduce((sum, a) => sum + (a.moving_time || 0), 0),
        calories: lastWeek.reduce((sum, a) => sum + (a.calories || 0), 0)
      }
    }
  }

  const chartData = prepareChartData()
  const activityDistribution = getActivityDistribution()
  const weeklyComparison = getWeeklyComparison()
  
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']

  const getMetricLabel = () => {
    switch (metricType) {
      case 'distance': return 'Distância (km)'
      case 'time': return 'Tempo (min)'
      case 'calories': return 'Calorias'
      case 'pace': return 'Pace (min/km)'
      default: return 'Valor'
    }
  }

  const calculateTrend = () => {
    if (chartData.length < 2) return 0
    const recent = chartData.slice(-7).reduce((sum, d) => sum + d.value, 0)
    const previous = chartData.slice(-14, -7).reduce((sum, d) => sum + d.value, 0)
    return previous > 0 ? ((recent - previous) / previous) * 100 : 0
  }

  const trend = calculateTrend()

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              Análise de Performance Avançada
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex items-center border rounded-lg">
                {['week', 'month', 'quarter'].map(range => (
                  <Button
                    key={range}
                    size="sm"
                    variant={timeRange === range ? 'default' : 'ghost'}
                    onClick={() => setTimeRange(range as any)}
                    className="rounded-none first:rounded-l-lg last:rounded-r-lg"
                  >
                    {range === 'week' ? '7D' : range === 'month' ? '30D' : '90D'}
                  </Button>
                ))}
              </div>
              <div className="flex items-center border rounded-lg">
                {['distance', 'time', 'calories', 'pace'].map(metric => (
                  <Button
                    key={metric}
                    size="sm"
                    variant={metricType === metric ? 'default' : 'ghost'}
                    onClick={() => setMetricType(metric as any)}
                    className="rounded-none first:rounded-l-lg last:rounded-r-lg text-xs"
                  >
                    {metric === 'distance' ? 'Dist' : 
                     metric === 'time' ? 'Tempo' : 
                     metric === 'calories' ? 'Cal' : 'Pace'}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Esta Semana</p>
                <p className="text-2xl font-bold text-blue-800">{weeklyComparison.thisWeek.count}</p>
                <p className="text-xs text-blue-600">atividades</p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-gradient-to-r from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">Distância Total</p>
                <p className="text-2xl font-bold text-green-800">
                  {weeklyComparison.thisWeek.distance.toFixed(1)}
                </p>
                <p className="text-xs text-green-600">km esta semana</p>
              </div>
              <Target className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-gradient-to-r from-orange-50 to-orange-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600">Calorias</p>
                <p className="text-2xl font-bold text-orange-800">
                  {Math.round(weeklyComparison.thisWeek.calories)}
                </p>
                <p className="text-xs text-orange-600">queimadas</p>
              </div>
              <Zap className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-gradient-to-r from-purple-50 to-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600">Tendência</p>
                <p className={`text-2xl font-bold ${trend >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                  {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
                </p>
                <p className="text-xs text-purple-600">vs semana anterior</p>
              </div>
              <TrendingUp className={`w-8 h-8 ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Performance Chart */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Evolução - {getMetricLabel()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [value, getMetricLabel()]}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Activity Distribution */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-green-500" />
              Distribuição por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={activityDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {activityDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Comparison */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-500" />
            Comparação Semanal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Esta Semana</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Atividades:</span>
                  <span className="font-medium">{weeklyComparison.thisWeek.count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Distância:</span>
                  <span className="font-medium">{weeklyComparison.thisWeek.distance.toFixed(1)} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Tempo:</span>
                  <span className="font-medium">{Math.round(weeklyComparison.thisWeek.time / 60)} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Calorias:</span>
                  <span className="font-medium">{Math.round(weeklyComparison.thisWeek.calories)}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Semana Anterior</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Atividades:</span>
                  <span className="font-medium">{weeklyComparison.lastWeek.count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Distância:</span>
                  <span className="font-medium">{weeklyComparison.lastWeek.distance.toFixed(1)} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Tempo:</span>
                  <span className="font-medium">{Math.round(weeklyComparison.lastWeek.time / 60)} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Calorias:</span>
                  <span className="font-medium">{Math.round(weeklyComparison.lastWeek.calories)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdvancedPerformance
