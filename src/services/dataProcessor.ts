
import { supabase } from '@/integrations/supabase/client'

export interface ProcessedData {
  workoutPlans: WorkoutPlan[]
  nutritionPlans: NutritionPlan[]
  stravaActivities: StravaActivity[]
  calendarEvents: CalendarEvent[]
  insights: UserInsight[]
  metrics: UserMetrics
}

export interface WorkoutPlan {
  id: string
  title: string
  description: string
  exercises: Exercise[]
  duration: number
  difficulty: string
  frequency: number
}

export interface Exercise {
  name: string
  duration: number
  sets?: number
  reps?: number
  type: 'cardio' | 'strength' | 'flexibility'
}

export interface NutritionPlan {
  id: string
  title: string
  meals: Meal[]
  totalCalories: number
  macros: Macros
}

export interface Meal {
  name: string
  time: string
  calories: number
  description: string
}

export interface Macros {
  protein: number
  carbs: number
  fat: number
}

export interface StravaActivity {
  id: string
  name: string
  type: string
  distance: number
  duration: number
  pace: number
  calories: number
  date: string
  averageSpeed: number
  maxSpeed: number
  totalElevationGain: number
  averageHeartrate: number
  maxHeartrate: number
}

export interface CalendarEvent {
  id: string
  title: string
  description: string
  startTime: string
  endTime: string
  type: 'workout' | 'meal' | 'rest'
  status: 'scheduled' | 'completed' | 'missed'
}

export interface UserInsight {
  id: string
  type: 'progress' | 'recommendation' | 'warning' | 'achievement'
  title: string
  description: string
  impact: 'low' | 'medium' | 'high'
  createdAt: string
}

export interface UserMetrics {
  weeklyProgress: {
    workoutsCompleted: number
    workoutsPlanned: number
    totalDistance: number
    totalTime: number
    averagePace: number
    averageSpeed: number
    totalCalories: number
  }
  adherenceScore: number
  consistencyScore: number
  improvementRate: number
  nextGoals: string[]
}

class DataProcessor {
  async processUserData(userId: string): Promise<ProcessedData> {
    console.log('🔄 Iniciando processamento de dados para usuário:', userId)
    
    try {
      const [conversations, activities, events, profile, goals] = await Promise.all([
        this.getConversations(userId),
        this.getStravaActivities(userId),
        this.getCalendarEvents(userId),
        this.getUserProfile(userId),
        this.getUserGoals(userId)
      ])

      console.log('📊 Dados coletados:', {
        conversations: conversations?.length || 0,
        activities: activities?.length || 0,
        events: events?.length || 0,
        profile: !!profile,
        goals: goals?.length || 0
      })

      const workoutPlans = await this.extractWorkoutPlans(conversations, profile)
      const nutritionPlans = await this.extractNutritionPlans(conversations, profile)
      const insights = this.generateInsights(activities, events, workoutPlans, profile)
      const metrics = this.calculateMetrics(activities, events, workoutPlans)

      const result = {
        workoutPlans,
        nutritionPlans,
        stravaActivities: activities,
        calendarEvents: events,
        insights,
        metrics
      }

      console.log('✅ Processamento concluído:', result)
      return result
    } catch (error) {
      console.error('❌ Erro no processamento:', error)
      throw error
    }
  }

  private async getConversations(userId: string) {
    const { data, error } = await supabase
      .from('ai_conversations')
      .select(`
        *,
        ai_responses(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Erro ao buscar conversas:', error)
      return []
    }

    return data || []
  }

  private async getStravaActivities(userId: string): Promise<StravaActivity[]> {
    const { data, error } = await supabase
      .from('strava_activities')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Erro ao buscar atividades Strava:', error)
      return []
    }

    return (data || []).map(activity => {
      // Conversões corretas
      const distanceKm = (activity.distance || 0) / 1000
      const durationMinutes = (activity.moving_time || 0) / 60
      const durationHours = durationMinutes / 60
      
      // Pace correto: minutos por km
      let pace = 0
      if (distanceKm > 0 && durationMinutes > 0) {
        pace = durationMinutes / distanceKm
      }

      // Velocidade média em km/h
      const averageSpeed = activity.average_speed ? activity.average_speed * 3.6 : 0
      const maxSpeed = activity.max_speed ? activity.max_speed * 3.6 : 0

      return {
        id: activity.id,
        name: activity.name || 'Atividade',
        type: activity.type,
        distance: distanceKm,
        duration: durationMinutes,
        pace: pace,
        calories: activity.calories || 0,
        date: activity.start_date,
        averageSpeed: averageSpeed,
        maxSpeed: maxSpeed,
        totalElevationGain: activity.total_elevation_gain || 0,
        averageHeartrate: activity.average_heartrate || 0,
        maxHeartrate: activity.max_heartrate || 0
      }
    })
  }

  private async getCalendarEvents(userId: string): Promise<CalendarEvent[]> {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .gte('start_time', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('start_time', { ascending: false })

    if (error) {
      console.error('Erro ao buscar eventos do calendário:', error)
      return []
    }

    return (data || []).map(event => ({
      id: event.id,
      title: event.title,
      description: event.description || '',
      startTime: event.start_time,
      endTime: event.end_time,
      type: event.event_type as 'workout' | 'meal' | 'rest',
      status: event.status as 'scheduled' | 'completed' | 'missed'
    }))
  }

  private async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Erro ao buscar perfil:', error)
      return null
    }

    return data
  }

  private async getUserGoals(userId: string) {
    const { data, error } = await supabase
      .from('user_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar objetivos:', error)
      return []
    }

    return data || []
  }

  private async extractWorkoutPlans(conversations: any[], profile: any): Promise<WorkoutPlan[]> {
    const workoutPlans: WorkoutPlan[] = []
    
    conversations.forEach(conversation => {
      if (conversation.ai_responses) {
        conversation.ai_responses.forEach((response: any) => {
          const planData = this.parseWorkoutPlan(response.response, profile)
          if (planData) {
            workoutPlans.push(planData)
          }
        })
      }
    })

    console.log('💪 Planos de treino extraídos:', workoutPlans.length)
    return workoutPlans
  }

  private parseWorkoutPlan(response: string, profile: any): WorkoutPlan | null {
    const workoutKeywords = [
      'treino', 'exercício', 'corrida', 'força', 'cardio', 'musculação',
      'agachamento', 'flexão', 'abdominal', 'caminhada', 'bicicleta',
      'natação', 'alongamento', 'yoga', 'pilates'
    ]
    
    const hasWorkoutContent = workoutKeywords.some(keyword => 
      response.toLowerCase().includes(keyword)
    )

    if (!hasWorkoutContent) return null

    // Extração melhorada de exercícios
    const exercises: Exercise[] = []
    
    // Padrões mais específicos para extrair exercícios
    const exercisePatterns = [
      /(\w+(?:\s+\w+)*?):\s*(\d+)\s*(?:minutos?|min)/gi,
      /(\d+)\s*(?:séries?|sets?)\s+(?:de\s+)?(\d+)\s*(?:repetições?|reps?)\s+(?:de\s+)?(.+?)(?:\n|$)/gi,
      /(\d+)x(\d+)\s+(.+?)(?:\n|$)/gi,
      /(corrida|caminhada|bicicleta|natação)\s*(?:por)?\s*(\d+)\s*(?:minutos?|min|km)/gi
    ]

    exercisePatterns.forEach(pattern => {
      let match
      while ((match = pattern.exec(response)) !== null) {
        if (match.length >= 3) {
          const exercise: Exercise = {
            name: match[3] || match[1] || 'Exercício',
            duration: parseInt(match[2]) || 30,
            type: this.determineExerciseType(match[3] || match[1] || '')
          }
          
          if (match[1] && !isNaN(parseInt(match[1]))) {
            exercise.sets = parseInt(match[1])
            exercise.reps = parseInt(match[2])
          }
          
          exercises.push(exercise)
        }
      }
    })

    // Se não encontrou exercícios específicos, criar um genérico baseado no contexto
    if (exercises.length === 0) {
      const intensity = profile?.experience_level || 'iniciante'
      const frequency = profile?.frequencia_semanal || profile?.training_frequency || 3
      
      exercises.push({
        name: 'Plano personalizado extraído da conversa',
        duration: intensity === 'avancado' ? 60 : intensity === 'intermediario' ? 45 : 30,
        type: 'cardio'
      })
    }

    return {
      id: `plan-${Date.now()}-${Math.random()}`,
      title: `Plano de Treino - ${new Date().toLocaleDateString('pt-BR')}`,
      description: response.substring(0, 200) + '...',
      exercises,
      duration: exercises.reduce((total, ex) => total + ex.duration, 0),
      difficulty: profile?.experience_level || 'intermediário',
      frequency: profile?.frequencia_semanal || profile?.training_frequency || 3
    }
  }

  private determineExerciseType(exerciseName: string): 'cardio' | 'strength' | 'flexibility' {
    const name = exerciseName.toLowerCase()
    
    const cardioKeywords = ['corrida', 'caminhada', 'bicicleta', 'natação', 'cardio', 'aeróbico']
    const strengthKeywords = ['força', 'musculação', 'agachamento', 'flexão', 'supino', 'peso']
    const flexibilityKeywords = ['alongamento', 'yoga', 'pilates', 'flexibilidade']
    
    if (cardioKeywords.some(keyword => name.includes(keyword))) return 'cardio'
    if (strengthKeywords.some(keyword => name.includes(keyword))) return 'strength'
    if (flexibilityKeywords.some(keyword => name.includes(keyword))) return 'flexibility'
    
    return 'cardio' // Default
  }

  private async extractNutritionPlans(conversations: any[], profile: any): Promise<NutritionPlan[]> {
    const nutritionPlans: NutritionPlan[] = []
    
    conversations.forEach(conversation => {
      if (conversation.ai_responses) {
        conversation.ai_responses.forEach((response: any) => {
          const planData = this.parseNutritionPlan(response.response, profile)
          if (planData) {
            nutritionPlans.push(planData)
          }
        })
      }
    })

    console.log('🍎 Planos nutricionais extraídos:', nutritionPlans.length)
    return nutritionPlans
  }

  private parseNutritionPlan(response: string, profile: any): NutritionPlan | null {
    const nutritionKeywords = [
      'dieta', 'alimentação', 'refeição', 'café', 'almoço', 'jantar', 'lanche',
      'proteína', 'carboidrato', 'gordura', 'caloria', 'nutrição'
    ]
    
    const hasNutritionContent = nutritionKeywords.some(keyword => 
      response.toLowerCase().includes(keyword)
    )

    if (!hasNutritionContent) return null

    const meals: Meal[] = []
    
    // Padrões melhorados para extrair refeições
    const mealPatterns = [
      /(café da manhã|breakfast):\s*(.+?)(?=(?:almoço|lunch|jantar|dinner|lanche|snack|\n\n|$))/gis,
      /(almoço|lunch):\s*(.+?)(?=(?:jantar|dinner|lanche|snack|\n\n|$))/gis,
      /(jantar|dinner):\s*(.+?)(?=(?:lanche|snack|\n\n|$))/gis,
      /(lanche|snack):\s*(.+?)(?=\n\n|$)/gis,
      /(\d{1,2}:\d{2})\s*[-–]\s*(.+?)(?=\n|$)/gi
    ]

    mealPatterns.forEach(pattern => {
      let match
      while ((match = pattern.exec(response)) !== null) {
        const mealName = match[1]
        const description = match[2]?.trim()
        
        if (description && description.length > 3) {
          meals.push({
            name: mealName,
            time: this.getMealTime(mealName),
            calories: this.estimateCalories(description, profile),
            description: description.substring(0, 100)
          })
        }
      }
    })

    if (meals.length === 0) {
      // Criar plano básico se não conseguir extrair
      const basicalCalories = this.calculateBasalMetabolicRate(profile)
      meals.push({
        name: 'Plano nutricional extraído',
        time: '12:00',
        calories: basicalCalories,
        description: 'Plano nutricional baseado na conversa'
      })
    }

    const totalCalories = meals.reduce((total, meal) => total + meal.calories, 0)

    return {
      id: `nutrition-${Date.now()}-${Math.random()}`,
      title: `Plano Nutricional - ${new Date().toLocaleDateString('pt-BR')}`,
      meals,
      totalCalories,
      macros: this.calculateMacros(totalCalories)
    }
  }

  private getMealTime(mealName: string): string {
    const name = mealName.toLowerCase()
    if (name.includes('café') || name.includes('breakfast')) return '07:00'
    if (name.includes('almoço') || name.includes('lunch')) return '12:00'
    if (name.includes('jantar') || name.includes('dinner')) return '19:00'
    if (name.includes('lanche') || name.includes('snack')) return '15:00'
    return '12:00'
  }

  private estimateCalories(description: string, profile: any): number {
    // Estimativa baseada no conteúdo da descrição e perfil
    const baseCalories = this.calculateBasalMetabolicRate(profile) / 4 // Dividido por 4 refeições
    
    // Ajustar baseado em palavras-chave
    const highCalorieWords = ['carne', 'frango', 'peixe', 'ovo', 'queijo', 'abacate']
    const lowCalorieWords = ['salada', 'vegetais', 'frutas', 'água']
    
    let multiplier = 1
    const desc = description.toLowerCase()
    
    if (highCalorieWords.some(word => desc.includes(word))) multiplier += 0.3
    if (lowCalorieWords.some(word => desc.includes(word))) multiplier -= 0.2
    
    return Math.round(baseCalories * Math.max(0.5, multiplier))
  }

  private calculateBasalMetabolicRate(profile: any): number {
    if (!profile) return 2000
    
    const weight = profile.peso || profile.weight || 70
    const height = profile.altura || profile.height || 170
    const age = profile.age || 30
    
    // Fórmula de Harris-Benedict (simplificada para homens)
    return Math.round(88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age))
  }

  private calculateMacros(totalCalories: number): Macros {
    return {
      protein: Math.round(totalCalories * 0.25 / 4), // 25% de proteína (4 cal/g)
      carbs: Math.round(totalCalories * 0.50 / 4),   // 50% de carboidratos (4 cal/g)
      fat: Math.round(totalCalories * 0.25 / 9)      // 25% de gordura (9 cal/g)
    }
  }

  private generateInsights(
    activities: StravaActivity[],
    events: CalendarEvent[],
    workoutPlans: WorkoutPlan[],
    profile: any
  ): UserInsight[] {
    const insights: UserInsight[] = []

    // Análise de consistência
    const recentActivities = activities.filter(activity => 
      new Date(activity.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    )

    const weeklyGoal = profile?.frequencia_semanal || profile?.training_frequency || 3

    if (recentActivities.length >= weeklyGoal) {
      insights.push({
        id: 'consistency-excellent',
        type: 'achievement',
        title: 'Excelente Consistência!',
        description: `Você atingiu sua meta semanal de ${weeklyGoal} treinos com ${recentActivities.length} atividades realizadas.`,
        impact: 'high',
        createdAt: new Date().toISOString()
      })
    } else if (recentActivities.length === 0) {
      insights.push({
        id: 'consistency-low',
        type: 'warning',
        title: 'Retome os Treinos',
        description: 'Você não teve atividades registradas esta semana. Que tal começar com uma caminhada leve?',
        impact: 'high',
        createdAt: new Date().toISOString()
      })
    } else {
      insights.push({
        id: 'consistency-partial',
        type: 'recommendation',
        title: 'Quase lá!',
        description: `Você fez ${recentActivities.length} de ${weeklyGoal} treinos planejados. Continue assim!`,
        impact: 'medium',
        createdAt: new Date().toISOString()
      })
    }

    // Análise de progresso de pace
    if (activities.length >= 3) {
      const runningActivities = activities.filter(a => a.type === 'Run').slice(0, 3)
      if (runningActivities.length >= 2) {
        const latestPace = runningActivities[0].pace
        const previousPace = runningActivities[1].pace
        
        if (latestPace > 0 && previousPace > 0 && latestPace < previousPace) {
          const improvement = ((previousPace - latestPace) / previousPace * 100).toFixed(1)
          insights.push({
            id: 'pace-improvement',
            type: 'progress',
            title: 'Pace Melhorado!',
            description: `Seu pace melhorou ${improvement}% na última corrida. Excelente evolução!`,
            impact: 'high',
            createdAt: new Date().toISOString()
          })
        }
      }
    }

    // Análise de distância
    if (recentActivities.length > 0) {
      const totalDistance = recentActivities.reduce((sum, a) => sum + a.distance, 0)
      if (totalDistance > 20) {
        insights.push({
          id: 'distance-achievement',
          type: 'achievement',
          title: 'Meta de Distância Alcançada!',
          description: `Você percorreu ${totalDistance.toFixed(1)}km esta semana. Parabéns!`,
          impact: 'medium',
          createdAt: new Date().toISOString()
        })
      }
    }

    // Recomendações baseadas no perfil
    if (profile?.objetivo) {
      insights.push({
        id: 'goal-reminder',
        type: 'recommendation',
        title: 'Foque no seu Objetivo',
        description: `Lembre-se: seu objetivo é ${profile.objetivo}. Seus treinos estão alinhados com essa meta.`,
        impact: 'medium',
        createdAt: new Date().toISOString()
      })
    }

    return insights
  }

  private calculateMetrics(
    activities: StravaActivity[],
    events: CalendarEvent[],
    workoutPlans: WorkoutPlan[]
  ): UserMetrics {
    const weeklyActivities = activities.filter(activity => 
      new Date(activity.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    )

    const weeklyEvents = events.filter(event => 
      new Date(event.startTime) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    )

    const completedWorkouts = weeklyEvents.filter(event => 
      event.type === 'workout' && event.status === 'completed'
    ).length

    const plannedWorkouts = weeklyEvents.filter(event => 
      event.type === 'workout'
    ).length

    const totalDistance = weeklyActivities.reduce((sum, activity) => sum + activity.distance, 0)
    const totalTime = weeklyActivities.reduce((sum, activity) => sum + activity.duration, 0)
    const totalCalories = weeklyActivities.reduce((sum, activity) => sum + activity.calories, 0)
    
    const averagePace = weeklyActivities.length > 0 
      ? weeklyActivities.reduce((sum, activity) => sum + activity.pace, 0) / weeklyActivities.length 
      : 0

    const averageSpeed = weeklyActivities.length > 0 
      ? weeklyActivities.reduce((sum, activity) => sum + activity.averageSpeed, 0) / weeklyActivities.length 
      : 0

    const adherenceScore = plannedWorkouts > 0 ? (completedWorkouts / plannedWorkouts) * 100 : 
                          weeklyActivities.length > 0 ? Math.min((weeklyActivities.length / 3) * 100, 100) : 0

    const consistencyScore = Math.min((weeklyActivities.length / 4) * 100, 100)

    // Calcular taxa de melhoria baseada no pace das últimas atividades
    let improvementRate = 0
    if (activities.length >= 4) {
      const recent = activities.slice(0, 2).filter(a => a.pace > 0)
      const older = activities.slice(2, 4).filter(a => a.pace > 0)
      
      if (recent.length >= 1 && older.length >= 1) {
        const recentAvgPace = recent.reduce((sum, a) => sum + a.pace, 0) / recent.length
        const olderAvgPace = older.reduce((sum, a) => sum + a.pace, 0) / older.length
        
        if (olderAvgPace > 0) {
          // Pace menor é melhor (menos tempo por km)
          improvementRate = ((olderAvgPace - recentAvgPace) / olderAvgPace) * 100
        }
      }
    }

    return {
      weeklyProgress: {
        workoutsCompleted: Math.max(completedWorkouts, weeklyActivities.length),
        workoutsPlanned: Math.max(plannedWorkouts, 3),
        totalDistance,
        totalTime,
        averagePace,
        averageSpeed,
        totalCalories
      },
      adherenceScore,
      consistencyScore,
      improvementRate,
      nextGoals: this.generateNextGoals(activities, adherenceScore, consistencyScore)
    }
  }

  private generateNextGoals(activities: StravaActivity[], adherenceScore: number, consistencyScore: number): string[] {
    const goals: string[] = []

    if (adherenceScore < 70) {
      goals.push('Melhorar consistência nos treinos para 70%+')
    }

    if (consistencyScore < 80) {
      goals.push('Treinar pelo menos 4x por semana')
    }

    if (activities.length > 0) {
      const avgDistance = activities.slice(0, 5).reduce((sum, a) => sum + a.distance, 0) / Math.min(activities.length, 5)
      if (avgDistance > 0) {
        goals.push(`Aumentar distância média para ${(avgDistance * 1.15).toFixed(1)}km`)
      }
    }

    const runningActivities = activities.filter(a => a.type === 'Run').slice(0, 3)
    if (runningActivities.length > 0) {
      goals.push('Melhorar pace de corrida em 5%')
    }

    if (goals.length === 0) {
      goals.push('Manter rotina de exercícios por 4 semanas')
    }

    return goals.slice(0, 3)
  }
}

export const dataProcessor = new DataProcessor()
