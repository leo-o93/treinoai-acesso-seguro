
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar } from 'lucide-react'

interface WeeklySummaryCardProps {
  weekActivitiesCount: number
  expectedActivities: number
  totalDistance: number
  adherencePercentage: number
}

const WeeklySummaryCard: React.FC<WeeklySummaryCardProps> = ({
  weekActivitiesCount,
  expectedActivities,
  totalDistance,
  adherencePercentage
}) => {
  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-500" />
          Resumo da Semana
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{weekActivitiesCount}</div>
            <div className="text-sm text-blue-700">Atividades realizadas</div>
            <div className="text-xs text-gray-600">Meta: {expectedActivities}</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{adherencePercentage}%</div>
            <div className="text-sm text-green-700">Adesão ao plano</div>
            <Badge variant="outline" className={adherencePercentage >= 80 ? 'bg-green-100' : 'bg-yellow-100'}>
              {adherencePercentage >= 80 ? 'Excelente' : adherencePercentage >= 60 ? 'Bom' : 'Pode melhorar'}
            </Badge>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {totalDistance.toFixed(1)}km
            </div>
            <div className="text-sm text-purple-700">Distância total</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default WeeklySummaryCard
