
import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { CalendarIcon, Target, TrendingDown, TrendingUp, Activity, Zap } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface GoalsStepProps {
  data: any
  updateData: (data: any) => void
}

export const GoalsStep: React.FC<GoalsStepProps> = ({ data, updateData }) => {
  const goals = [
    {
      id: 'lose_weight',
      title: 'Perder Peso',
      description: 'Reduzir gordura corporal e emagrecer',
      icon: TrendingDown,
      color: 'text-red-500 bg-red-50'
    },
    {
      id: 'gain_muscle',
      title: 'Ganhar Massa',
      description: 'Aumentar massa muscular',
      icon: TrendingUp,
      color: 'text-emerald-500 bg-emerald-50'
    },
    {
      id: 'maintain',
      title: 'Manter Peso',
      description: 'Manter peso e melhorar composição',
      icon: Target,
      color: 'text-blue-500 bg-blue-50'
    },
    {
      id: 'improve_fitness',
      title: 'Melhorar Condicionamento',
      description: 'Aumentar resistência e energia',
      icon: Zap,
      color: 'text-purple-500 bg-purple-50'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Qual é o seu objetivo principal?
        </h3>
        <p className="text-gray-600">
          Isso nos ajuda a personalizar seus planos de treino e nutrição
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map((goal) => {
          const Icon = goal.icon
          const isSelected = data.primaryGoal === goal.id
          
          return (
            <Card 
              key={goal.id}
              className={`cursor-pointer transition-all ${
                isSelected 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => updateData({ primaryGoal: goal.id })}
            >
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-lg ${goal.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{goal.title}</h4>
                    <p className="text-sm text-gray-600">{goal.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {(data.primaryGoal === 'lose_weight' || data.primaryGoal === 'gain_muscle') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t">
          <div>
            <Label htmlFor="targetWeight">
              Peso desejado (kg)
            </Label>
            <Input
              id="targetWeight"
              type="number"
              step="0.1"
              value={data.targetWeight || ''}
              onChange={(e) => updateData({ targetWeight: parseFloat(e.target.value) })}
              placeholder="Ex: 65"
            />
          </div>

          <div>
            <Label>Data desejada (opcional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {data.targetDate ? (
                    format(data.targetDate, 'dd/MM/yyyy', { locale: ptBR })
                  ) : (
                    'Selecionar data'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={data.targetDate}
                  onSelect={(date) => updateData({ targetDate: date })}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}
    </div>
  )
}
