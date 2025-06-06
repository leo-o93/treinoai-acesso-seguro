
import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { User, Users, Award } from 'lucide-react'

interface ExperienceStepProps {
  data: any
  updateData: (data: any) => void
}

export const ExperienceStep: React.FC<ExperienceStepProps> = ({ data, updateData }) => {
  const fitnessLevels = [
    {
      id: 'beginner',
      title: 'Iniciante',
      description: 'Pouca ou nenhuma experiência com exercícios',
      icon: User,
      color: 'text-green-500 bg-green-50'
    },
    {
      id: 'intermediate',
      title: 'Intermediário',
      description: 'Treino regularmente há alguns meses',
      icon: Users,
      color: 'text-blue-500 bg-blue-50'
    },
    {
      id: 'advanced',
      title: 'Avançado',
      description: 'Muita experiência e conhecimento técnico',
      icon: Award,
      color: 'text-purple-500 bg-purple-50'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Qual é o seu nível de experiência?
        </h3>
        <p className="text-gray-600">
          Isso nos ajuda a criar treinos adequados ao seu nível
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {fitnessLevels.map((level) => {
          const Icon = level.icon
          const isSelected = data.fitnessLevel === level.id
          
          return (
            <Card 
              key={level.id}
              className={`cursor-pointer transition-all ${
                isSelected 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => updateData({ fitnessLevel: level.id })}
            >
              <CardContent className="p-6 text-center">
                <div className={`p-3 rounded-lg ${level.color} inline-block mb-4`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{level.title}</h4>
                <p className="text-sm text-gray-600">{level.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="space-y-6 pt-6 border-t">
        <div>
          <Label className="text-base font-medium">
            Quantas vezes por semana você pode treinar?
          </Label>
          <p className="text-sm text-gray-600 mb-4">
            Atualmente: {data.exerciseFrequency} {data.exerciseFrequency === 1 ? 'vez' : 'vezes'} por semana
          </p>
          <Slider
            value={[data.exerciseFrequency]}
            onValueChange={([value]) => updateData({ exerciseFrequency: value })}
            max={7}
            min={1}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>1x</span>
            <span>7x</span>
          </div>
        </div>

        <div>
          <Label className="text-base font-medium">
            Quanto tempo você tem por treino?
          </Label>
          <p className="text-sm text-gray-600 mb-4">
            Atualmente: {data.preferredWorkoutDuration} minutos
          </p>
          <Slider
            value={[data.preferredWorkoutDuration]}
            onValueChange={([value]) => updateData({ preferredWorkoutDuration: value })}
            max={120}
            min={30}
            step={15}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>30min</span>
            <span>120min</span>
          </div>
        </div>
      </div>
    </div>
  )
}
