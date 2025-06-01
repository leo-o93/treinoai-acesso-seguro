
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { StravaActivity } from '@/lib/database'

interface PerformanceChartProps {
  activities: StravaActivity[]
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ activities }) => {
  const chartData = activities
    .slice(-7) // Last 7 activities
    .map((activity, index) => ({
      name: `Treino ${index + 1}`,
      distance: activity.distance || 0,
      calories: activity.calories || 0,
      pace: activity.average_speed ? (activity.distance || 0) / (activity.moving_time || 1) * 3.6 : 0
    }))

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          Performance dos Últimos Treinos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="distance" 
              stroke="#8884d8" 
              strokeWidth={2}
              name="Distância (km)"
            />
            <Line 
              type="monotone" 
              dataKey="calories" 
              stroke="#82ca9d" 
              strokeWidth={2}
              name="Calorias"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export default PerformanceChart
