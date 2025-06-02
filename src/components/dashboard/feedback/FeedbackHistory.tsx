
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp } from 'lucide-react'
import { WeeklyFeedback } from '@/types/weekly-feedback'

interface FeedbackHistoryProps {
  previousFeedbacks: WeeklyFeedback[]
}

const FeedbackHistory: React.FC<FeedbackHistoryProps> = ({ previousFeedbacks }) => {
  if (!previousFeedbacks || previousFeedbacks.length === 0) {
    return null
  }

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-500" />
          Histórico de Feedback
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {previousFeedbacks.slice(0, 3).map((feedback) => (
            <div key={feedback.id} className="p-4 border rounded-lg bg-gray-50">
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium text-gray-900">
                  Semana de {new Date(feedback.week_start).toLocaleDateString('pt-BR')}
                </span>
                <div className="flex gap-2">
                  <Badge variant="outline">Adesão: {feedback.adherence_score}/10</Badge>
                  <Badge variant="outline">Energia: {feedback.energy_level}/10</Badge>
                </div>
              </div>
              {feedback.feedback_text && (
                <p className="text-sm text-gray-600 mb-2">{feedback.feedback_text}</p>
              )}
              {feedback.ai_recommendations && (
                <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                  <strong>IA:</strong> {feedback.ai_recommendations}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default FeedbackHistory
