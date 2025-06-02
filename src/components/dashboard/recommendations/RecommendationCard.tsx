
import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Lightbulb, TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

interface Recommendation {
  id: string
  type: 'training' | 'nutrition' | 'recovery' | 'goal'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  actionable: boolean
  insights: string[]
}

interface RecommendationCardProps {
  recommendation: Recommendation
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ recommendation }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'training': return <TrendingUp className="w-4 h-4" />
      case 'nutrition': return <Lightbulb className="w-4 h-4" />
      case 'recovery': return <Clock className="w-4 h-4" />
      case 'goal': return <CheckCircle className="w-4 h-4" />
      default: return <AlertTriangle className="w-4 h-4" />
    }
  }

  return (
    <div className={`p-4 rounded-lg border ${getPriorityColor(recommendation.priority)}`}>
      <div className="flex items-start gap-3">
        <div className={recommendation.priority === 'high' ? 'text-red-600' : recommendation.priority === 'medium' ? 'text-orange-600' : 'text-green-600'}>
          {getTypeIcon(recommendation.type)}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-900">{recommendation.title}</h4>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs">
                {recommendation.type}
              </Badge>
              <Badge 
                variant="outline" 
                className={`text-xs ${getPriorityColor(recommendation.priority)}`}
              >
                {recommendation.priority}
              </Badge>
            </div>
          </div>
          <p className="text-sm text-gray-700 mb-3">{recommendation.description}</p>
          
          {recommendation.insights.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-600">Insights da IA:</p>
              <ul className="text-xs text-gray-600 space-y-1">
                {recommendation.insights.map((insight, idx) => (
                  <li key={idx} className="flex items-start gap-1">
                    <span className="text-gray-400">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {recommendation.actionable && (
            <Button variant="outline" size="sm" className="mt-3">
              Ver Detalhes
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default RecommendationCard
