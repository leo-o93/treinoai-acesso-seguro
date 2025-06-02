
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { CheckCircle, AlertCircle, TrendingUp, Calendar, MessageSquare, Target } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { getStravaActivities } from '@/lib/database'
import { mcpAI } from '@/lib/mcpClient'
import { WeeklyFeedback } from '@/types/weekly-feedback'

interface WeeklyFeedbackCardProps {
  userProfile: any
}

const WeeklyFeedbackCard: React.FC<WeeklyFeedbackCardProps> = ({ userProfile }) => {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [adherenceScore, setAdherenceScore] = useState([7])
  const [energyLevel, setEnergyLevel] = useState([7])
  const [difficultyLevel, setDifficultyLevel] = useState([5])
  const [feedbackText, setFeedbackText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get current week start (Monday)
  const getCurrentWeekStart = () => {
    const now = new Date()
    const monday = new Date(now)
    monday.setDate(now.getDate() - now.getDay() + 1)
    monday.setHours(0, 0, 0, 0)
    return monday.toISOString().split('T')[0]
  }

  const currentWeekStart = getCurrentWeekStart()

  // Fetch this week's feedback
  const { data: currentFeedback, isLoading } = useQuery({
    queryKey: ['weekly-feedback', user?.id, currentWeekStart],
    queryFn: async (): Promise<WeeklyFeedback | null> => {
      if (!user?.id) return null
      
      try {
        const { data, error } = await (supabase as any)
          .from('weekly_feedback')
          .select('*')
          .eq('user_id', user.id)
          .eq('week_start', currentWeekStart)
          .maybeSingle()
        
        if (error && error.code !== 'PGRST116') throw error
        return data ? data as WeeklyFeedback : null
      } catch (error) {
        console.error('Error fetching weekly feedback:', error)
        return null
      }
    },
    enabled: !!user?.id
  })

  // Fetch recent activities for context
  const { data: weekActivities } = useQuery({
    queryKey: ['week-activities', user?.id, currentWeekStart],
    queryFn: async () => {
      if (!user?.id) return []
      
      const weekStart = new Date(currentWeekStart)
      const activities = await getStravaActivities(user.id, 20)
      
      return activities.filter(activity => {
        const activityDate = new Date(activity.start_date)
        return activityDate >= weekStart
      })
    },
    enabled: !!user?.id
  })

  // Fetch previous weeks for comparison
  const { data: previousFeedbacks } = useQuery({
    queryKey: ['previous-feedbacks', user?.id],
    queryFn: async (): Promise<WeeklyFeedback[]> => {
      if (!user?.id) return []
      
      try {
        const { data, error } = await (supabase as any)
          .from('weekly_feedback')
          .select('*')
          .eq('user_id', user.id)
          .order('week_start', { ascending: false })
          .limit(4)
        
        if (error) throw error
        return (data as any[]) as WeeklyFeedback[]
      } catch (error) {
        console.error('Error fetching previous feedbacks:', error)
        return []
      }
    },
    enabled: !!user?.id
  })

  // Update form when current feedback changes
  useEffect(() => {
    if (currentFeedback) {
      setAdherenceScore([currentFeedback.adherence_score])
      setEnergyLevel([currentFeedback.energy_level])
      setDifficultyLevel([currentFeedback.difficulty_level])
      setFeedbackText(currentFeedback.feedback_text || '')
    }
  }, [currentFeedback])

  // Submit feedback mutation
  const submitFeedbackMutation = useMutation({
    mutationFn: async (feedbackData: WeeklyFeedback) => {
      if (!user?.id) throw new Error('User not found')

      // Get AI recommendations based on feedback
      const aiResponse = await mcpAI.reavaliar(
        `Feedback semanal: Adesão ${feedbackData.adherence_score}/10, ` +
        `Energia ${feedbackData.energy_level}/10, ` +
        `Dificuldade ${feedbackData.difficulty_level}/10. ` +
        `Atividades Strava: ${feedbackData.strava_activities_count}. ` +
        `Comentários: ${feedbackData.feedback_text}`
      )

      const finalData = {
        ...feedbackData,
        user_id: user.id,
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
        strava_activities_count: weekActivities?.length || 0,
        user_id: user!.id
      }

      await submitFeedbackMutation.mutateAsync(feedbackData)
    } finally {
      setIsSubmitting(false)
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

  const weekActivitiesCount = weekActivities?.length || 0
  const expectedActivities = userProfile?.frequencia_semanal || 3
  const adherencePercentage = Math.round((weekActivitiesCount / expectedActivities) * 100)

  return (
    <div className="space-y-6">
      {/* Weekly Summary */}
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
                {weekActivities?.reduce((sum, a) => sum + (a.distance || 0), 0).toFixed(1)}km
              </div>
              <div className="text-sm text-purple-700">Distância total</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback Form */}
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
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Adesão ao Plano (1-10)
            </label>
            <Slider
              value={adherenceScore}
              onValueChange={setAdherenceScore}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Não segui</span>
              <span className="font-medium">{adherenceScore[0]}/10</span>
              <span>Segui completamente</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Nível de Energia (1-10)
            </label>
            <Slider
              value={energyLevel}
              onValueChange={setEnergyLevel}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Muito cansado</span>
              <span className="font-medium">{energyLevel[0]}/10</span>
              <span>Muito energizado</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Dificuldade dos Treinos (1-10)
            </label>
            <Slider
              value={difficultyLevel}
              onValueChange={setDifficultyLevel}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Muito fácil</span>
              <span className="font-medium">{difficultyLevel[0]}/10</span>
              <span>Muito difícil</span>
            </div>
          </div>

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

      {/* Previous Weeks */}
      {previousFeedbacks && previousFeedbacks.length > 0 && (
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
      )}
    </div>
  )
}

export default WeeklyFeedbackCard
