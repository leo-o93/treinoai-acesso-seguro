
import React from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Lightbulb, TrendingUp, Target, Calendar } from 'lucide-react'

interface SmartSuggestionsProps {
  onSuggestionClick: (suggestion: string) => void
}

const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({ onSuggestionClick }) => {
  const { user } = useAuth()

  const { data: userContext } = useQuery({
    queryKey: ['user-context', user?.id],
    queryFn: async () => {
      if (!user?.id) return null

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      const { data: recentActivity } = await supabase
        .from('strava_activities')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false })
        .limit(1)
        .single()

      const { data: goals } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(3)

      return { profile, recentActivity, goals }
    },
    enabled: !!user?.id
  })

  const generateSuggestions = () => {
    const suggestions = []
    const { profile, recentActivity, goals } = userContext || {}

    // Sugestões baseadas no objetivo
    if (profile?.objetivo) {
      if (profile.objetivo.includes('emagrecer') || profile.objetivo.includes('perder peso')) {
        suggestions.push('Como acelerar minha perda de peso de forma saudável?')
        suggestions.push('Quais exercícios queimam mais calorias?')
      } else if (profile.objetivo.includes('hipertrofia') || profile.objetivo.includes('ganhar massa')) {
        suggestions.push('Como otimizar meu treino para hipertrofia?')
        suggestions.push('Qual a melhor estratégia nutricional para ganho de massa?')
      } else if (profile.objetivo.includes('resistência') || profile.objetivo.includes('cardio')) {
        suggestions.push('Como melhorar minha resistência cardiovascular?')
        suggestions.push('Qual a periodização ideal para corrida?')
      }
    }

    // Sugestões baseadas na atividade recente
    if (recentActivity) {
      const daysSinceLastActivity = Math.floor((Date.now() - new Date(recentActivity.start_date).getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysSinceLastActivity > 3) {
        suggestions.push('Como voltar à rotina após alguns dias parado?')
      } else {
        suggestions.push(`Analisar minha última atividade: ${recentActivity.name}`)
      }
    }

    // Sugestões baseadas nos objetivos
    if (goals && goals.length > 0) {
      suggestions.push('Como está meu progresso nos objetivos?')
      suggestions.push('Ajustar estratégia para atingir minhas metas')
    }

    // Sugestões gerais inteligentes
    suggestions.push('Criar um plano de treino personalizado')
    suggestions.push('Sugerir refeições para hoje')
    suggestions.push('Analisar meu progresso esta semana')
    suggestions.push('Dicas de motivação para hoje')

    return suggestions.slice(0, 6) // Máximo 6 sugestões
  }

  const suggestions = generateSuggestions()

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Lightbulb className="w-4 h-4" />
        <span>Sugestões personalizadas:</span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {suggestions.map((suggestion, index) => {
          const getIcon = (suggestion: string) => {
            if (suggestion.includes('treino') || suggestion.includes('exercício')) return TrendingUp
            if (suggestion.includes('objetivo') || suggestion.includes('meta')) return Target
            if (suggestion.includes('plano') || suggestion.includes('estratégia')) return Calendar
            return Lightbulb
          }

          const IconComponent = getIcon(suggestion)

          return (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => onSuggestionClick(suggestion)}
              className="text-left justify-start h-auto p-3 text-xs bg-gradient-to-r from-blue-50 to-emerald-50 hover:from-blue-100 hover:to-emerald-100 border-blue-200"
            >
              <IconComponent className="w-3 h-3 mr-2 text-blue-600 flex-shrink-0" />
              <span className="line-clamp-2">{suggestion}</span>
            </Button>
          )
        })}
      </div>
    </div>
  )
}

export default SmartSuggestions
