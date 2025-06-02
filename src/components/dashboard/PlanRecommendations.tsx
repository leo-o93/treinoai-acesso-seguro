
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Lightbulb, TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

interface Recommendation {
  id: string
  type: 'training' | 'nutrition' | 'recovery' | 'goal'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  actionable: boolean
  insights: string[]
}

const PlanRecommendations: React.FC = () => {
  const { user } = useAuth()

  // Fetch recommendations from backend/AI (not generated locally)
  const { data: recommendations = [], isLoading } = useQuery({
    queryKey: ['ai-recommendations', user?.id],
    queryFn: async (): Promise<Recommendation[]> => {
      if (!user?.id) return []
      
      try {
        // In a real scenario, this would come from n8n/AI agent
        // For now, fetch from a recommendations table or return empty
        const { data, error } = await supabase
          .from('ai_recommendations')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5)
        
        if (error) {
          console.log('No recommendations table found, waiting for AI agent')
          return []
        }
        return data as Recommendation[]
      } catch (error) {
        console.log('Waiting for recommendations from AI agent')
        return []
      }
    },
    enabled: !!user?.id
  })

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

  if (isLoading) {
    return (
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (recommendations.length === 0) {
    return (
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6 text-center">
          <Lightbulb className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="font-semibold text-gray-900 mb-2">Aguardando Recomendações</h3>
          <p className="text-gray-600">
            O agente IA está analisando seus dados para gerar recomendações personalizadas.
          </p>
        </CardContent>
      </Card>
    )
  }

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
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className={`p-4 rounded-lg border ${getPriorityColor(rec.priority)}`}
            >
              <div className="flex items-start gap-3">
                <div className={rec.priority === 'high' ? 'text-red-600' : rec.priority === 'medium' ? 'text-orange-600' : 'text-green-600'}>
                  {getTypeIcon(rec.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">
                        {rec.type}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getPriorityColor(rec.priority)}`}
                      >
                        {rec.priority}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">{rec.description}</p>
                  
                  {rec.insights.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-600">Insights da IA:</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {rec.insights.map((insight, idx) => (
                          <li key={idx} className="flex items-start gap-1">
                            <span className="text-gray-400">•</span>
                            <span>{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {rec.actionable && (
                    <Button variant="outline" size="sm" className="mt-3">
                      Ver Detalhes
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default PlanRecommendations
