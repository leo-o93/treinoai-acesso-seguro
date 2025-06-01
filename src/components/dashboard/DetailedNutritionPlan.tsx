
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Utensils, ShoppingCart, RefreshCw, AlertTriangle } from 'lucide-react'
import { NutritionPlan } from '@/lib/database'

interface DetailedNutritionPlanProps {
  nutritionPlan: NutritionPlan | null
}

const DetailedNutritionPlan: React.FC<DetailedNutritionPlanProps> = ({ nutritionPlan }) => {
  if (!nutritionPlan) {
    return (
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="w-5 h-5 text-orange-500" />
            Plano de Dieta Atual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Utensils className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhum plano de dieta ativo</p>
            <p className="text-sm">Aguarde a criação do seu plano nutricional</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const mealPlan = nutritionPlan.meal_plan as any
  const macros = nutritionPlan.macros as any
  const meals = mealPlan?.meals || mealPlan?.daily || []

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Utensils className="w-5 h-5 text-orange-500" />
          Plano de Dieta Atual
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Informações do Plano */}
        <div className="border-b pb-4">
          <h3 className="font-semibold text-lg text-gray-900 mb-2">{nutritionPlan.title}</h3>
          {nutritionPlan.description && (
            <p className="text-sm text-gray-600 mb-2">{nutritionPlan.description}</p>
          )}
          
          <div className="flex items-center gap-4 text-sm">
            {nutritionPlan.daily_calories && (
              <Badge variant="outline" className="bg-orange-50">
                {nutritionPlan.daily_calories} kcal/dia
              </Badge>
            )}
            <Badge variant="outline" className={nutritionPlan.status === 'active' ? 'bg-green-50' : 'bg-gray-50'}>
              {nutritionPlan.status}
            </Badge>
          </div>
        </div>

        {/* Macronutrientes */}
        {macros && (
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Distribuição de Macros</h4>
            <div className="grid grid-cols-3 gap-2">
              {macros.protein && (
                <div className="text-center p-2 bg-blue-50 rounded-lg">
                  <div className="text-sm font-medium text-blue-800">Proteína</div>
                  <div className="text-xs text-blue-600">{macros.protein}g</div>
                </div>
              )}
              {macros.carbs && (
                <div className="text-center p-2 bg-green-50 rounded-lg">
                  <div className="text-sm font-medium text-green-800">Carboidrato</div>
                  <div className="text-xs text-green-600">{macros.carbs}g</div>
                </div>
              )}
              {macros.fat && (
                <div className="text-center p-2 bg-yellow-50 rounded-lg">
                  <div className="text-sm font-medium text-yellow-800">Gordura</div>
                  <div className="text-xs text-yellow-600">{macros.fat}g</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cardápio de Hoje */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">Cardápio de Hoje</h4>
            <Button size="sm" variant="outline">
              <RefreshCw className="w-3 h-3 mr-1" />
              Atualizar
            </Button>
          </div>
          
          {meals.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {meals.slice(0, 6).map((meal: any, index: number) => (
                <div key={index} className="p-3 rounded-lg border bg-orange-50 border-orange-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900 mb-1">
                        {meal.name || meal.type || `Refeição ${index + 1}`}
                      </h5>
                      
                      {meal.time && (
                        <p className="text-xs text-gray-500 mb-2">{meal.time}</p>
                      )}
                      
                      {meal.items && meal.items.length > 0 && (
                        <div className="text-sm text-gray-700">
                          {meal.items.slice(0, 3).map((item: any) => 
                            typeof item === 'string' ? item : item.name || item.food
                          ).join(', ')}
                          {meal.items.length > 3 && ` +${meal.items.length - 3} mais`}
                        </div>
                      )}
                      
                      {meal.calories && (
                        <div className="text-xs text-orange-600 mt-1">{meal.calories} kcal</div>
                      )}
                    </div>
                    
                    <Button size="sm" variant="ghost" className="ml-2">
                      <ShoppingCart className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <p className="text-sm">Cardápio não disponível</p>
            </div>
          )}
        </div>

        {/* Restrições e Substituições */}
        {nutritionPlan.restrictions && nutritionPlan.restrictions.length > 0 && (
          <div className="mt-4 p-3 bg-gradient-to-r from-red-50 to-red-100 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <h5 className="font-medium text-red-800">Restrições Alimentares</h5>
            </div>
            <p className="text-sm text-red-700">{nutritionPlan.restrictions.join(', ')}</p>
          </div>
        )}

        {/* Sugestões */}
        {mealPlan?.suggestions && (
          <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
            <h5 className="font-medium text-green-800 mb-1">Dicas Nutricionais</h5>
            <p className="text-sm text-green-700">{mealPlan.suggestions}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default DetailedNutritionPlan
