
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
  }
  adherenceScore: number
  consistencyScore: number
  improvementRate: number
  nextGoals: string[]
}

class DataProcessor {
  async processUserData(userId: string): Promise<ProcessedData> {
    const [conversations, activities, events, profiles] = await Promise.all([
      this.getConversations(userId),
      this.getStravaActivities(userId),
      this.getCalendarEvents(userId),
      this.getUserProfile(userId)
    ])

    const workoutPlans = this.extractWorkoutPlans(conversations)
    const nutritionPlans = this.extractNutritionPlans(conversations)
    const insights = this.generateInsights(activities, events, workoutPlans)
    const metrics = this.calculateMetrics(activities, events, workoutPlans)

    return {
      workoutPlans,
      nutritionPlans,
      stravaActivities: activities,
      calendarEvents: events,
      insights,
      metrics
    }
  }

  private async getConversations(userId: string) {
    const { data } = await supabase
      .from('ai_conversations')
      .select(`
        *,
        ai_responses(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    return data || []
  }

  private async getStravaActivities(userId: string): Promise<StravaActivity[]> {
    const { data } = await supabase
      .from('strava_activities')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: false })
      .limit(30)

    return (data || []).map(activity => ({
      id: activity.id,
      name: activity.name,
      type: activity.type,
      distance: (activity.distance || 0) / 1000, // Convert to km
      duration: (activity.moving_time || 0) / 60, // Convert to minutes
      pace: activity.average_speed ? (activity.distance || 0) / (activity.moving_time || 1) * 3.6 : 0,
      calories: activity.calories || 0,
      date: activity.start_date
    }))
  }

  private async getCalendarEvents(userId: string): Promise<CalendarEvent[]> {
    const { data } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .gte('start_time', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('start_time', { ascending: false })

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
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    return data
  }

  private extractWorkoutPlans(conversations: any[]): WorkoutPlan[] {
    const workoutPlans: WorkoutPlan[] = []
    
    conversations.forEach(conversation => {
      if (conversation.ai_responses) {
        conversation.ai_responses.forEach((response: any) => {
          const planData = this.parseWorkoutPlan(response.response)
          if (planData) {
            workoutPlans.push(planData)
          }
        })
      }
    })

    return workoutPlans
  }

  private parseWorkoutPlan(response: string): WorkoutPlan | null {
    // Análise inteligente do texto para extrair planos de treino
    const workoutKeywords = ['treino', 'exercício', 'corrida', 'força', 'cardio']
    const hasWorkoutContent = workoutKeywords.some(keyword => 
      response.toLowerCase().includes(keyword)
    )

    if (!hasWorkoutContent) return null

    // Extrair exercícios usando regex
    const exercisePatterns = [
      /(\w+):\s*(\d+)\s*minutos/gi,
      /(\w+).*?duração:\s*(\d+)\s*minutos/gi,
      /(\d+)\s*séries.*?(\d+)\s*repetições/gi
    ]

    const exercises: Exercise[] = []
    exercisePatterns.forEach(pattern => {
      let match
      while ((match = pattern.exec(response)) !== null) {
        exercises.push({
          name: match[1] || 'Exercício',
          duration: parseInt(match[2]) || 30,
          type: this.determineExerciseType(match[1] || '')
        })
      }
    })

    if (exercises.length === 0) {
      // Plano básico se não conseguir extrair exercícios específicos
      exercises.push({
        name: 'Plano extraído da conversa',
        duration: 45,
        type: 'cardio'
      })
    }

    return {
      id: `plan-${Date.now()}`,
      title: 'Plano de Treino Personalizado',
      description: response.substring(0, 200) + '...',
      exercises,
      duration: exercises.reduce((total, ex) => total + ex.duration, 0),
      difficulty: 'intermediário',
      frequency: 7
    }
  }

  private determineExerciseType(exerciseName: string): 'cardio' | 'strength' | 'flexibility' {
    const cardioKeywords = ['corrida', 'caminhada', 'bicicleta', 'natação']
    const strengthKeywords = ['força', 'musculação', 'agachamento', 'flexão']
    
    const name = exerciseName.toLowerCase()
    
    if (cardioKeywords.some(keyword => name.includes(keyword))) return 'cardio'
    if (strengthKeywords.some(keyword => name.includes(keyword))) return 'strength'
    
    return 'cardio' // Default
  }

  private extractNutritionPlans(conversations: any[]): NutritionPlan[] {
    const nutritionPlans: NutritionPlan[] = []
    
    conversations.forEach(conversation => {
      if (conversation.ai_responses) {
        conversation.ai_responses.forEach((response: any) => {
          const planData = this.parseNutritionPlan(response.response)
          if (planData) {
            nutritionPlans.push(planData)
          }
        })
      }
    })

    return nutritionPlans
  }

  private parseNutritionPlan(response: string): NutritionPlan | null {
    const nutritionKeywords = ['dieta', 'alimentação', 'refeição', 'café', 'almoço', 'jantar']
    const hasNutritionContent = nutritionKeywords.some(keyword => 
      response.toLowerCase().includes(keyword)
    )

    if (!hasNutritionContent) return null

    // Extrair refeições
    const mealPatterns = [
      /(café da manhã|almoço|jantar|lanche):\s*(.+?)(?=\n|$)/gi,
      /(\d{1,2}:\d{2})\s*-\s*(.+?)(?=\n|$)/gi
    ]

    const meals: Meal[] = []
    mealPatterns.forEach(pattern => {
      let match
      while ((match = pattern.exec(response)) !== null) {
        meals.push({
          name: match[1],
          time: match[1].includes(':') ? match[1] : '12:00',
          calories: 400, // Estimativa
          description: match[2] || 'Refeição balanceada'
        })
      }
    })

    if (meals.length === 0) {
      meals.push({
        name: 'Plano Nutricional',
        time: '12:00',
        calories: 1800,
        description: 'Plano extraído da conversa'
      })
    }

    return {
      id: `nutrition-${Date.now()}`,
      title: 'Plano Nutricional Personalizado',
      meals,
      totalCalories: meals.reduce((total, meal) => total + meal.calories, 0),
      macros: {
        protein: 25,
        carbs: 50,
        fat: 25
      }
    }
  }

  private generateInsights(
    activities: StravaActivity[],
    events: CalendarEvent[],
    workoutPlans: WorkoutPlan[]
  ): UserInsight[] {
    const insights: UserInsight[] = []

    // Análise de consistência
    const recentActivities = activities.filter(activity => 
      new Date(activity.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    )

    if (recentActivities.length >= 4) {
      insights.push({
        id: 'consistency-high',
        type: 'achievement',
        title: 'Excelente Consistência!',
        description: `Você treinou ${recentActivities.length} vezes esta semana. Continue assim!`,
        impact: 'high',
        createdAt: new Date().toISOString()
      })
    } else if (recentActivities.length <= 1) {
      insights.push({
        id: 'consistency-low',
        type: 'warning',
        title: 'Baixa Atividade',
        description: 'Que tal retomar os treinos? Pequenos passos fazem grande diferença.',
        impact: 'medium',
        createdAt: new Date().toISOString()
      })
    }

    // Análise de progresso
    if (activities.length >= 2) {
      const latest = activities[0]
      const previous = activities[1]
      
      if (latest.pace > previous.pace) {
        insights.push({
          id: 'pace-improvement',
          type: 'progress',
          title: 'Pace Melhorado!',
          description: 'Seu ritmo está ficando mais rápido. Ótimo progresso!',
          impact: 'high',
          createdAt: new Date().toISOString()
        })
      }
    }

    // Recomendações baseadas em dados
    if (workoutPlans.length > 0 && recentActivities.length < 3) {
      insights.push({
        id: 'plan-adherence',
        type: 'recommendation',
        title: 'Siga seu Plano',
        description: 'Você tem um ótimo plano de treino. Que tal colocá-lo em prática?',
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
    const averagePace = weeklyActivities.length > 0 
      ? weeklyActivities.reduce((sum, activity) => sum + activity.pace, 0) / weeklyActivities.length 
      : 0

    const adherenceScore = plannedWorkouts > 0 ? (completedWorkouts / plannedWorkouts) * 100 : 0
    const consistencyScore = Math.min((weeklyActivities.length / 5) * 100, 100)

    // Calcular taxa de melhoria baseada nas últimas atividades
    let improvementRate = 0
    if (activities.length >= 4) {
      const recent = activities.slice(0, 2)
      const older = activities.slice(2, 4)
      
      const recentAvgPace = recent.reduce((sum, a) => sum + a.pace, 0) / recent.length
      const olderAvgPace = older.reduce((sum, a) => sum + a.pace, 0) / older.length
      
      if (olderAvgPace > 0) {
        improvementRate = ((recentAvgPace - olderAvgPace) / olderAvgPace) * 100
      }
    }

    return {
      weeklyProgress: {
        workoutsCompleted: completedWorkouts,
        workoutsPlanned: plannedWorkouts,
        totalDistance,
        totalTime,
        averagePace
      },
      adherenceScore,
      consistencyScore,
      improvementRate,
      nextGoals: this.generateNextGoals(activities, adherenceScore)
    }
  }

  private generateNextGoals(activities: StravaActivity[], adherenceScore: number): string[] {
    const goals: string[] = []

    if (adherenceScore < 70) {
      goals.push('Melhorar consistência nos treinos')
    }

    if (activities.length > 0) {
      const avgDistance = activities.slice(0, 5).reduce((sum, a) => sum + a.distance, 0) / Math.min(activities.length, 5)
      goals.push(`Aumentar distância média para ${(avgDistance * 1.2).toFixed(1)}km`)
    }

    if (activities.some(a => a.type === 'Run')) {
      goals.push('Melhorar pace de corrida em 5%')
    }

    goals.push('Manter rotina de exercícios por 4 semanas')

    return goals.slice(0, 3) // Retornar apenas os 3 principais
  }
}

export const dataProcessor = new DataProcessor()
