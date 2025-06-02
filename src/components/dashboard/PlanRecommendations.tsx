
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Lightbulb } from 'lucide-react'
import RecommendationsList from './recommendations/RecommendationsList'

const PlanRecommendations: React.FC = () => {
  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          Recomendações da IA
        </CardTitle>
        <p className="text-sm text-gray-600">
          Geradas pelo agente inteligente baseado na sua performance
        </p>
      </CardHeader>
      <CardContent>
        <RecommendationsList />
      </CardContent>
    </Card>
  )
}

export default PlanRecommendations
