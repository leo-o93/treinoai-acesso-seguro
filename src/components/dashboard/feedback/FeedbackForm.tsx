
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MessageSquare, Target } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { mcpAI } from '@/lib/mcpClient'
import { WeeklyFeedback } from '@/types/weekly-feedback'
import FeedbackSlider from './FeedbackSlider'

interface FeedbackFormProps {
  currentFeedback: WeeklyFeedback | null
  currentWeekStart: string
  weekActivitiesCount: number
  userId: string
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({
  currentFeedback,
  currentWeekStart,
  weekActivitiesCount,
  userId
}) => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [adherenceScore, setAdherenceScore] = useState([7])
  const [energyLevel, setEnergyLevel] = useState([7])
  const [difficultyLevel, setDifficultyLevel] = useState([5])
  const [feedbackText, setFeedbackText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (currentFeedback) {
      setAdherenceScore([currentFeedback.adherence_score])
      setEnergyLevel([currentFeedback.energy_level])
      setDifficultyLevel([currentFeedback.difficulty_level])
      setFeedbackText(currentFeedback.feedback_text || '')
    }
  }, [currentFeedback])

  const submitFeedbackMutation = useMutation({
    mutationFn: async (feedbackData: WeeklyFeedback) => {
      const aiResponse = await mcpAI.reavaliar(
        `Feedback semanal: Adesão ${feedbackData.adherence_score}/10, ` +
        `Energia ${feedbackData.energy_level}/10, ` +
        `Dificuldade ${feedbackData.difficulty_level}/10. ` +
        `Atividades Strava: ${feedbackData.strava_activities_count}. ` +
        `Comentários: ${feedbackData.feedback_text}`
      )

      const finalData = {
        ...feedbackData,
        user_id: userId,
        ai_recommendations: aiResponse.success ? aiResponse.data : null,
        updated_at: new Date().toISOString()
      }

      const { error } = await (supabase as any)
        .from('weekly_feedback')
        .upsert(finalData)
      
      if (error) throw error
      return finalData
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-feedback'] })
      queryClient.invalidateQueries({ queryKey: ['previous-feedbacks'] })
      toast({
        title: 'Feedback enviado!',
        description: 'Suas informações foram registradas e a IA irá ajustar seu plano.'
      })
    },
    onError: (error) => {
      console.error('Erro ao enviar feedback:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar o feedback',
        variant: 'destructive'
      })
    }
  })

  const handleSubmitFeedback = async () => {
    setIsSubmitting(true)
    
    try {
      const feedbackData: WeeklyFeedback = {
        week_start: currentWeekStart,
        adherence_score: adherenceScore[0],
        energy_level: energyLevel[0],
        difficulty_level: difficultyLevel[0],
        feedback_text: feedbackText,
        strava_activities_count: weekActivitiesCount,
        user_id: userId
      }

      await submitFeedbackMutation.mutateAsync(feedbackData)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-orange-500" />
          Feedback Semanal
        </CardTitle>
        <p className="text-sm text-gray-600">
          Compartilhe como foi sua semana para que o TrainerAI possa ajustar seu plano
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <FeedbackSlider
          label="Adesão ao Plano (1-10)"
          value={adherenceScore}
          onValueChange={setAdherenceScore}
          leftLabel="Não segui"
          rightLabel="Segui completamente"
        />

        <FeedbackSlider
          label="Nível de Energia (1-10)"
          value={energyLevel}
          onValueChange={setEnergyLevel}
          leftLabel="Muito cansado"
          rightLabel="Muito energizado"
        />

        <FeedbackSlider
          label="Dificuldade dos Treinos (1-10)"
          value={difficultyLevel}
          onValueChange={setDifficultyLevel}
          leftLabel="Muito fácil"
          rightLabel="Muito difícil"
        />

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Comentários e Observações
          </label>
          <Textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Como foi sua semana? Teve alguma dificuldade? O que gostaria de ajustar no plano?"
            rows={4}
          />
        </div>

        <Button 
          onClick={handleSubmitFeedback}
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? 'Enviando...' : currentFeedback ? 'Atualizar Feedback' : 'Enviar Feedback'}
        </Button>

        {currentFeedback?.ai_recommendations && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Recomendações da IA
            </h4>
            <p className="text-sm text-blue-800">{currentFeedback.ai_recommendations}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default FeedbackForm
