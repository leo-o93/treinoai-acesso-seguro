
import React from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { mcpAI } from '@/lib/mcpClient'
import RecommendationCard from './RecommendationCard'

interface Recommendation {
  id: string
  type: 'training' | 'nutrition' | 'recovery' | 'goal'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  actionable: boolean
  insights: string[]
}

const RecommendationsList: React.FC = () => {
  const { user } = useAuth()

  const { data: recommendations = [], isLoading } = useQuery({
    queryKey: ['ai-recommendations', user?.id],
    queryFn: async (): Promise<Recommendation[]> => {
      if (!user?.id) return []
      
      try {
        // Fetch recommendations from n8n AI agent
        const response = await mcpAI.gerarRecomendacoes()
        if (response.success && response.data?.recommendations) {
          return response.data.recommendations
        }
        return []
      } catch (error) {
        console.log('Aguardando recomendações do agente IA')
        return []
      }
    },
    enabled: !!user?.id
  })

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  if (recommendations.length === 0) {
    return (
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-4 text-gray-300">
          <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <h3 className="font-semibold text-gray-900 mb-2">Aguardando Recomendações</h3>
        <p className="text-gray-600">
          O agente IA está analisando seus dados para gerar recomendações personalizadas.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {recommendations.map((rec) => (
        <RecommendationCard key={rec.id} recommendation={rec} />
      ))}
    </div>
  )
}

export default RecommendationsList
