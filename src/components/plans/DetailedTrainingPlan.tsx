
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Clock, Target, Trophy } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface Exercise {
  name: string
  sets: number
  reps: string
  rest: string
  notes?: string
}

interface TrainingDay {
  day: string
  focus: string
  exercises: Exercise[]
  duration: string
}

const DetailedTrainingPlan = () => {
  const navigate = useNavigate()

  const trainingWeek: TrainingDay[] = [
    {
      day: 'Segunda-feira',
      focus: 'Peito e Tríceps',
      duration: '60-75 min',
      exercises: [
        { name: 'Supino Reto', sets: 4, reps: '8-12', rest: '90s', notes: 'Foque na contração' },
        { name: 'Supino Inclinado', sets: 3, reps: '10-12', rest: '90s' },
        { name: 'Crucifixo', sets: 3, reps: '12-15', rest: '60s' },
        { name: 'Paralelas', sets: 3, reps: '8-12', rest: '90s' },
        { name: 'Tríceps Testa', sets: 3, reps: '10-12', rest: '60s' },
        { name: 'Tríceps Corda', sets: 3, reps: '12-15', rest: '60s' }
      ]
    },
    {
      day: 'Terça-feira',
      focus: 'Costas e Bíceps',
      duration: '60-75 min',
      exercises: [
        { name: 'Puxada Frente', sets: 4, reps: '8-12', rest: '90s' },
        { name: 'Remada Curvada', sets: 3, reps: '10-12', rest: '90s' },
        { name: 'Remada Unilateral', sets: 3, reps: '12 cada', rest: '60s' },
        { name: 'Pulley', sets: 3, reps: '10-12', rest: '60s' },
        { name: 'Rosca Direta', sets: 3, reps: '10-12', rest: '60s' },
        { name: 'Rosca Martelo', sets: 3, reps: '12-15', rest: '60s' }
      ]
    },
    {
      day: 'Quarta-feira',
      focus: 'Cardio Moderado',
      duration: '30-45 min',
      exercises: [
        { name: 'Esteira Inclinada', sets: 1, reps: '30 min', rest: '-', notes: 'Intensidade moderada' },
        { name: 'Abdominais', sets: 3, reps: '20', rest: '45s' },
        { name: 'Prancha', sets: 3, reps: '45s', rest: '60s' }
      ]
    },
    {
      day: 'Quinta-feira',
      focus: 'Pernas e Glúteos',
      duration: '70-85 min',
      exercises: [
        { name: 'Agachamento', sets: 4, reps: '8-12', rest: '2 min', notes: 'Movimento completo' },
        { name: 'Leg Press', sets: 3, reps: '12-15', rest: '90s' },
        { name: 'Cadeira Extensora', sets: 3, reps: '12-15', rest: '60s' },
        { name: 'Mesa Flexora', sets: 3, reps: '10-12', rest: '60s' },
        { name: 'Panturrilha em Pé', sets: 4, reps: '15-20', rest: '45s' },
        { name: 'Abdução de Quadril', sets: 3, reps: '15-20', rest: '45s' }
      ]
    },
    {
      day: 'Sexta-feira',
      focus: 'Ombros e Abdômen',
      duration: '60-70 min',
      exercises: [
        { name: 'Desenvolvimento', sets: 4, reps: '8-12', rest: '90s' },
        { name: 'Elevação Lateral', sets: 3, reps: '12-15', rest: '60s' },
        { name: 'Elevação Posterior', sets: 3, reps: '12-15', rest: '60s' },
        { name: 'Encolhimento', sets: 3, reps: '10-12', rest: '60s' },
        { name: 'Abdominal Supra', sets: 4, reps: '20', rest: '45s' },
        { name: 'Abdominal Oblíquo', sets: 3, reps: '15 cada', rest: '45s' }
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/plano')} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Plano
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Plano de Treino Detalhado
          </h1>
          <p className="text-gray-600">
            Seu programa personalizado de exercícios com detalhes completos
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <p className="font-medium">Duração</p>
              <p className="text-sm text-gray-600">4-6 semanas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Target className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <p className="font-medium">Frequência</p>
              <p className="text-sm text-gray-600">5x por semana</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <p className="font-medium">Objetivo</p>
              <p className="text-sm text-gray-600">Hipertrofia</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {trainingWeek.map((day, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{day.day}</CardTitle>
                    <CardDescription>{day.focus}</CardDescription>
                  </div>
                  <Badge variant="outline">
                    <Clock className="w-3 h-3 mr-1" />
                    {day.duration}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {day.exercises.map((exercise, exerciseIndex) => (
                    <div key={exerciseIndex} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{exercise.name}</h4>
                        {exercise.notes && (
                          <p className="text-sm text-gray-600">{exercise.notes}</p>
                        )}
                      </div>
                      <div className="text-right text-sm space-y-1">
                        <div className="font-medium">{exercise.sets} séries × {exercise.reps}</div>
                        <div className="text-gray-500">Descanso: {exercise.rest}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Observações Importantes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• Sempre faça um aquecimento de 10-15 minutos antes de iniciar os exercícios</p>
              <p>• Mantenha a técnica correta em todos os exercícios</p>
              <p>• Hidrate-se adequadamente durante o treino</p>
              <p>• Respeite os tempos de descanso entre as séries</p>
              <p>• Se sentir dor ou desconforto, pare imediatamente</p>
              <p>• Ajuste as cargas conforme sua evolução</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default DetailedTrainingPlan
