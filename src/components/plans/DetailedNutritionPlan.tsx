
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Clock, Apple, Droplets } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface Meal {
  time: string
  name: string
  foods: string[]
  calories: number
  protein: number
  carbs: number
  fat: number
}

const DetailedNutritionPlan = () => {
  const navigate = useNavigate()

  const dailyMeals: Meal[] = [
    {
      time: '07:00',
      name: 'Café da Manhã',
      foods: [
        '2 fatias de pão integral',
        '2 ovos mexidos',
        '1 fatia de queijo branco',
        '1 banana média',
        '200ml de leite desnatado'
      ],
      calories: 520,
      protein: 28,
      carbs: 65,
      fat: 12
    },
    {
      time: '10:00',
      name: 'Lanche da Manhã',
      foods: [
        '1 maçã média',
        '30g de amendoim',
        '1 copo de água (300ml)'
      ],
      calories: 280,
      protein: 8,
      carbs: 25,
      fat: 18
    },
    {
      time: '12:30',
      name: 'Almoço',
      foods: [
        '150g de frango grelhado',
        '1 xícara de arroz integral',
        '1 concha de feijão',
        'Salada verde à vontade',
        '1 colher de sopa de azeite'
      ],
      calories: 680,
      protein: 45,
      carbs: 72,
      fat: 15
    },
    {
      time: '15:30',
      name: 'Lanche da Tarde',
      foods: [
        '1 iogurte grego natural (170g)',
        '1 colher de sopa de granola',
        '1 colher de chá de mel'
      ],
      calories: 220,
      protein: 15,
      carbs: 28,
      fat: 6
    },
    {
      time: '18:00',
      name: 'Pré-Treino',
      foods: [
        '1 banana média',
        '1 fatia de pão integral',
        '1 colher de chá de mel'
      ],
      calories: 200,
      protein: 4,
      carbs: 48,
      fat: 2
    },
    {
      time: '20:30',
      name: 'Pós-Treino',
      foods: [
        'Whey protein (30g)',
        '1 banana média',
        '300ml de água'
      ],
      calories: 180,
      protein: 25,
      carbs: 27,
      fat: 1
    },
    {
      time: '22:00',
      name: 'Jantar',
      foods: [
        '150g de salmão grelhado',
        '200g de batata doce',
        'Legumes refogados',
        'Salada de folhas verdes'
      ],
      calories: 520,
      protein: 35,
      carbs: 45,
      fat: 18
    }
  ]

  const totalNutrition = dailyMeals.reduce((total, meal) => ({
    calories: total.calories + meal.calories,
    protein: total.protein + meal.protein,
    carbs: total.carbs + meal.carbs,
    fat: total.fat + meal.fat
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/plano')} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Plano
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Plano Nutricional Completo
          </h1>
          <p className="text-gray-600">
            Seu programa alimentar detalhado para atingir seus objetivos
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <Apple className="w-8 h-8 mx-auto mb-2 text-red-500" />
              <p className="font-bold text-lg">{totalNutrition.calories}</p>
              <p className="text-sm text-gray-600">Calorias</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 mx-auto mb-2 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <p className="font-bold text-lg">{totalNutrition.protein}g</p>
              <p className="text-sm text-gray-600">Proteína</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 mx-auto mb-2 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <p className="font-bold text-lg">{totalNutrition.carbs}g</p>
              <p className="text-sm text-gray-600">Carboidratos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 mx-auto mb-2 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">G</span>
              </div>
              <p className="font-bold text-lg">{totalNutrition.fat}g</p>
              <p className="text-sm text-gray-600">Gorduras</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {dailyMeals.map((meal, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      {meal.time} - {meal.name}
                    </CardTitle>
                  </div>
                  <Badge variant="outline">
                    {meal.calories} kcal
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Alimentos:</h4>
                    <ul className="space-y-1">
                      {meal.foods.map((food, foodIndex) => (
                        <li key={foodIndex} className="text-sm text-gray-600 flex items-center">
                          <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                          {food}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Macronutrientes:</h4>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="text-center p-2 bg-blue-50 rounded">
                        <p className="font-medium text-blue-700">{meal.protein}g</p>
                        <p className="text-xs text-blue-600">Proteína</p>
                      </div>
                      <div className="text-center p-2 bg-green-50 rounded">
                        <p className="font-medium text-green-700">{meal.carbs}g</p>
                        <p className="text-xs text-green-600">Carboidratos</p>
                      </div>
                      <div className="text-center p-2 bg-orange-50 rounded">
                        <p className="font-medium text-orange-700">{meal.fat}g</p>
                        <p className="text-xs text-orange-600">Gorduras</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Droplets className="w-5 h-5 mr-2 text-blue-500" />
              Hidratação e Dicas Importantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-1">💧 Meta de Hidratação</h4>
                <p className="text-sm text-blue-700">Beba pelo menos 3 litros de água por dia, distribuídos ao longo do dia</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <h4 className="font-medium mb-2">✅ Recomendações:</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Faça as refeições em horários regulares</li>
                    <li>• Mastigue bem os alimentos</li>
                    <li>• Evite líquidos durante as refeições</li>
                    <li>• Prepare as refeições com antecedência</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">⚠️ Evitar:</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Alimentos ultraprocessados</li>
                    <li>• Refrigerantes e sucos artificiais</li>
                    <li>• Frituras em excesso</li>
                    <li>• Pular refeições principais</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default DetailedNutritionPlan
