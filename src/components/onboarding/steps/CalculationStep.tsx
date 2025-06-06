
import React, { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Calculator, Target, TrendingUp, Activity } from 'lucide-react'

interface CalculationStepProps {
  data: any
  updateData: (data: any) => void
}

export const CalculationStep: React.FC<CalculationStepProps> = ({ data, updateData }) => {
  useEffect(() => {
    // Calcular BMR (Taxa Metabólica Basal) usando fórmula de Mifflin-St Jeor
    const calculateBMR = () => {
      const { weight, height, age, gender } = data
      
      if (gender === 'male') {
        return 10 * weight + 6.25 * height - 5 * age + 5
      } else {
        return 10 * weight + 6.25 * height - 5 * age - 161
      }
    }

    // Calcular TDEE (Total Daily Energy Expenditure)
    const calculateTDEE = (bmr: number) => {
      const activityMultipliers = {
        1: 1.2,  // Sedentário
        2: 1.375, // Levemente ativo
        3: 1.55,  // Moderadamente ativo
        4: 1.725, // Muito ativo
        5: 1.9,   // Extremamente ativo
        6: 1.9,
        7: 1.9
      }
      
      const frequency = data.exerciseFrequency
      let multiplier = 1.2 // sedentário por padrão
      
      if (frequency <= 1) multiplier = 1.2
      else if (frequency <= 2) multiplier = 1.375
      else if (frequency <= 4) multiplier = 1.55
      else if (frequency <= 6) multiplier = 1.725
      else multiplier = 1.9
      
      return bmr * multiplier
    }

    // Calcular calorias alvo baseado no objetivo
    const calculateTargetCalories = (tdee: number) => {
      switch (data.primaryGoal) {
        case 'lose_weight':
          return tdee - 500 // déficit de 500 calorias
        case 'gain_muscle':
          return tdee + 300 // superávit de 300 calorias
        case 'maintain':
          return tdee
        case 'improve_fitness':
          return tdee
        default:
          return tdee
      }
    }

    // Calcular macronutrientes
    const calculateMacros = (targetCalories: number) => {
      let proteinPercent = 0.25 // 25% proteína
      let fatPercent = 0.25     // 25% gordura
      let carbPercent = 0.5     // 50% carboidrato
      
      // Ajustar baseado no objetivo
      if (data.primaryGoal === 'gain_muscle') {
        proteinPercent = 0.3
        fatPercent = 0.25
        carbPercent = 0.45
      } else if (data.primaryGoal === 'lose_weight') {
        proteinPercent = 0.35
        fatPercent = 0.25
        carbPercent = 0.4
      }
      
      return {
        protein: Math.round((targetCalories * proteinPercent) / 4), // 4 cal/g
        carbs: Math.round((targetCalories * carbPercent) / 4),      // 4 cal/g
        fats: Math.round((targetCalories * fatPercent) / 9)         // 9 cal/g
      }
    }

    if (data.weight && data.height && data.age) {
      const bmr = calculateBMR()
      const tdee = calculateTDEE(bmr)
      const targetCalories = calculateTargetCalories(tdee)
      const macros = calculateMacros(targetCalories)
      
      updateData({
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
        targetCalories: Math.round(targetCalories),
        macros
      })
    }
  }, [data, updateData])

  const metrics = [
    {
      title: 'Taxa Metabólica Basal',
      value: data.bmr,
      unit: 'kcal/dia',
      description: 'Calorias que seu corpo queima em repouso',
      icon: Activity,
      color: 'text-blue-600'
    },
    {
      title: 'Gasto Calórico Total',
      value: data.tdee,
      unit: 'kcal/dia',
      description: 'Incluindo atividade física',
      icon: TrendingUp,
      color: 'text-emerald-600'
    },
    {
      title: 'Meta Calórica',
      value: data.targetCalories,
      unit: 'kcal/dia',
      description: 'Para atingir seus objetivos',
      icon: Target,
      color: 'text-orange-600'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Calculator className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Calculando seu plano personalizado
        </h3>
        <p className="text-gray-600">
          Baseado em ciência e seus dados pessoais
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <Card key={metric.title} className="text-center">
              <CardHeader className="pb-2">
                <Icon className={`w-8 h-8 ${metric.color} mx-auto`} />
                <CardTitle className="text-sm font-medium text-gray-600">
                  {metric.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {metric.value || '---'}
                  <span className="text-sm font-normal text-gray-500 ml-1">
                    {metric.unit}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {metric.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {data.macros && (
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Distribuição de Macronutrientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Proteínas</span>
                  <span>{data.macros.protein}g</span>
                </div>
                <Progress value={30} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Carboidratos</span>
                  <span>{data.macros.carbs}g</span>
                </div>
                <Progress value={45} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Gorduras</span>
                  <span>{data.macros.fats}g</span>
                </div>
                <Progress value={25} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">💡 Dica Importante</h4>
        <p className="text-blue-800 text-sm">
          Estes valores são estimativas baseadas em fórmulas científicas. Acompanhe seu progresso 
          e ajustaremos conforme necessário para otimizar seus resultados.
        </p>
      </div>
    </div>
  )
}
