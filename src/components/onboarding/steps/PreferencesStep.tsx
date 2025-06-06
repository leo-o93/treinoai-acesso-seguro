
import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'

interface PreferencesStepProps {
  data: any
  updateData: (data: any) => void
}

export const PreferencesStep: React.FC<PreferencesStepProps> = ({ data, updateData }) => {
  const foodCategories = [
    'Carnes vermelhas', 'Frango', 'Peixes', 'Ovos', 'Laticínios',
    'Vegetais verdes', 'Frutas', 'Cereais integrais', 'Leguminosas',
    'Oleaginosas', 'Azeites', 'Carboidratos complexos'
  ]

  const restrictions = [
    'Vegetariano', 'Vegano', 'Sem glúten', 'Sem lactose',
    'Diabético', 'Hipertensão', 'Low carb', 'Cetogênica'
  ]

  const cookingLevels = [
    {
      id: 'beginner',
      title: 'Básico',
      description: 'Receitas simples e rápidas'
    },
    {
      id: 'intermediate',
      title: 'Intermediário',
      description: 'Preparo moderado'
    },
    {
      id: 'advanced',
      title: 'Avançado',
      description: 'Receitas elaboradas'
    }
  ]

  const togglePreference = (category: string, type: 'foodPreferences' | 'dietaryRestrictions') => {
    const current = data[type] || []
    const updated = current.includes(category)
      ? current.filter((item: string) => item !== category)
      : [...current, category]
    
    updateData({ [type]: updated })
  }

  const removeItem = (item: string, type: 'foodPreferences' | 'dietaryRestrictions' | 'dislikedFoods') => {
    const current = data[type] || []
    const updated = current.filter((i: string) => i !== item)
    updateData({ [type]: updated })
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Preferências Alimentares
        </h3>
        <p className="text-gray-600">
          Vamos personalizar seu plano nutricional
        </p>
      </div>

      <div>
        <Label className="text-base font-medium mb-4 block">
          Quais alimentos você gosta de consumir?
        </Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {foodCategories.map((category) => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox
                id={category}
                checked={data.foodPreferences?.includes(category) || false}
                onCheckedChange={() => togglePreference(category, 'foodPreferences')}
              />
              <Label htmlFor={category} className="text-sm">{category}</Label>
            </div>
          ))}
        </div>
        
        {data.foodPreferences?.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">Selecionados:</p>
            <div className="flex flex-wrap gap-2">
              {data.foodPreferences.map((item: string) => (
                <Badge key={item} variant="secondary" className="cursor-pointer">
                  {item}
                  <X 
                    className="w-3 h-3 ml-1" 
                    onClick={() => removeItem(item, 'foodPreferences')}
                  />
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <Label className="text-base font-medium mb-4 block">
          Restrições alimentares ou dietas específicas
        </Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {restrictions.map((restriction) => (
            <div key={restriction} className="flex items-center space-x-2">
              <Checkbox
                id={restriction}
                checked={data.dietaryRestrictions?.includes(restriction) || false}
                onCheckedChange={() => togglePreference(restriction, 'dietaryRestrictions')}
              />
              <Label htmlFor={restriction} className="text-sm">{restriction}</Label>
            </div>
          ))}
        </div>

        {data.dietaryRestrictions?.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">Restrições:</p>
            <div className="flex flex-wrap gap-2">
              {data.dietaryRestrictions.map((item: string) => (
                <Badge key={item} variant="destructive" className="cursor-pointer">
                  {item}
                  <X 
                    className="w-3 h-3 ml-1" 
                    onClick={() => removeItem(item, 'dietaryRestrictions')}
                  />
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <Label className="text-base font-medium mb-4 block">
          Nível de habilidade culinária
        </Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cookingLevels.map((level) => {
            const isSelected = data.cookingSkill === level.id
            
            return (
              <Card 
                key={level.id}
                className={`cursor-pointer transition-all ${
                  isSelected 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => updateData({ cookingSkill: level.id })}
              >
                <CardContent className="p-4 text-center">
                  <h4 className="font-semibold text-gray-900 mb-1">{level.title}</h4>
                  <p className="text-sm text-gray-600">{level.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
