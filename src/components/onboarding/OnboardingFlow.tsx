
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { PersonalInfoStep } from './steps/PersonalInfoStep'
import { GoalsStep } from './steps/GoalsStep'
import { ExperienceStep } from './steps/ExperienceStep'
import { PreferencesStep } from './steps/PreferencesStep'
import { CalculationStep } from './steps/CalculationStep'
import { PlanPreviewStep } from './steps/PlanPreviewStep'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

interface OnboardingData {
  // Personal Info
  name: string
  age: number
  gender: 'male' | 'female' | 'other'
  height: number
  weight: number
  
  // Goals
  primaryGoal: 'lose_weight' | 'gain_muscle' | 'maintain' | 'improve_fitness'
  targetWeight?: number
  targetDate?: Date
  
  // Experience
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced'
  exerciseFrequency: number
  preferredWorkoutDuration: number
  
  // Preferences
  foodPreferences: string[]
  dietaryRestrictions: string[]
  dislikedFoods: string[]
  cookingSkill: 'beginner' | 'intermediate' | 'advanced'
  
  // Calculated
  bmr?: number
  tdee?: number
  targetCalories?: number
  macros?: {
    protein: number
    carbs: number
    fats: number
  }
}

interface StepProps {
  data: OnboardingData
  updateData: (data: Partial<OnboardingData>) => void
  onNext?: () => void
  onComplete?: () => Promise<void>
  isSubmitting?: boolean
}

const steps = [
  { title: 'Informações Pessoais', component: PersonalInfoStep },
  { title: 'Objetivos', component: GoalsStep },
  { title: 'Experiência', component: ExperienceStep },
  { title: 'Preferências', component: PreferencesStep },
  { title: 'Cálculos', component: CalculationStep },
  { title: 'Plano Gerado', component: PlanPreviewStep }
]

export const OnboardingFlow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [data, setData] = useState<OnboardingData>({
    name: '',
    age: 25,
    gender: 'male',
    height: 170,
    weight: 70,
    primaryGoal: 'lose_weight',
    fitnessLevel: 'beginner',
    exerciseFrequency: 3,
    preferredWorkoutDuration: 60,
    foodPreferences: [],
    dietaryRestrictions: [],
    dislikedFoods: [],
    cookingSkill: 'intermediate'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  const updateData = (stepData: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...stepData }))
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const completeOnboarding = async () => {
    if (!user?.id) return
    
    setIsSubmitting(true)
    
    try {
      // Save user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          name: data.name,
          age: data.age,
          height: data.height,
          weight: data.weight,
          objective: data.primaryGoal,
          experience_level: data.fitnessLevel,
          training_frequency: data.exerciseFrequency,
          food_preferences: data.foodPreferences,
          restrictions: data.dietaryRestrictions,
          updated_at: new Date().toISOString()
        })

      if (profileError) throw profileError

      // Create initial training plan - cast to Json type
      const trainingPlanData = {
        profile: data,
        created_via: 'onboarding'
      } as any

      const { error: trainingError } = await supabase
        .from('training_plans')
        .insert({
          user_id: user.id,
          title: `Plano Personalizado - ${data.primaryGoal}`,
          description: `Plano criado com base no seu perfil e objetivos`,
          difficulty_level: data.fitnessLevel,
          duration_weeks: 12,
          plan_data: trainingPlanData,
          status: 'active',
          created_by_ai: true
        })

      if (trainingError) throw trainingError

      // Create initial nutrition plan - cast to Json type
      const nutritionPlanData = {
        profile: data,
        macros: data.macros,
        created_via: 'onboarding'
      } as any

      const { error: nutritionError } = await supabase
        .from('nutrition_plans')
        .insert({
          user_id: user.id,
          title: `Plano Nutricional - ${data.primaryGoal}`,
          description: `Plano alimentar baseado nas suas preferências e objetivos`,
          daily_calories: data.targetCalories || 2000,
          meal_plan: nutritionPlanData,
          status: 'active',
          created_by_ai: true
        })

      if (nutritionError) throw nutritionError

      toast.success('Onboarding concluído! Seus planos foram criados.')
      navigate('/dashboard')
      
    } catch (error) {
      console.error('Erro ao completar onboarding:', error)
      toast.error('Erro ao salvar dados. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const StepComponent = steps[currentStep].component
  const progress = ((currentStep + 1) / steps.length) * 100

  // Prepare props for step components
  const stepProps: StepProps = {
    data,
    updateData,
    onNext: nextStep,
    onComplete: completeOnboarding,
    isSubmitting
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-emerald-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Vamos personalizar sua experiência
            </h1>
            <p className="text-gray-600">
              Etapa {currentStep + 1} de {steps.length}: {steps[currentStep].title}
            </p>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-xl">
              {steps[currentStep].title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StepComponent {...stepProps} />
            
            <div className="flex justify-between mt-8">
              <Button 
                variant="outline" 
                onClick={prevStep}
                disabled={currentStep === 0}
              >
                Voltar
              </Button>
              
              {currentStep < steps.length - 1 ? (
                <Button onClick={nextStep}>
                  Próxima
                </Button>
              ) : (
                <Button 
                  onClick={completeOnboarding}
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-blue-600 to-emerald-600"
                >
                  {isSubmitting ? 'Finalizando...' : 'Finalizar'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
