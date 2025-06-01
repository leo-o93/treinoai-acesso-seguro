
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Award, Star, TrendingUp, Zap, Bell } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { getStravaActivities, getWeeklyStats } from '@/lib/database'

interface Achievement {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  category: 'distance' | 'frequency' | 'consistency' | 'performance'
  progress: number
  maxProgress: number
  isUnlocked: boolean
  unlockedDate?: Date
  points: number
}

const AchievementSystem: React.FC = () => {
  const { user } = useAuth()
  const [totalPoints, setTotalPoints] = useState(0)
  const [level, setLevel] = useState(1)
  const [levelProgress, setLevelProgress] = useState(0)

  const { data: activities = [] } = useQuery({
    queryKey: ['achievements-activities', user?.id],
    queryFn: () => getStravaActivities(user!.id, 100),
    enabled: !!user?.id
  })

  const { data: weeklyStats } = useQuery({
    queryKey: ['achievements-stats', user?.id],
    queryFn: () => getWeeklyStats(user!.id),
    enabled: !!user?.id
  })

  const [achievements, setAchievements] = useState<Achievement[]>([])

  useEffect(() => {
    generateAchievements()
  }, [activities, weeklyStats])

  const generateAchievements = () => {
    const totalDistance = activities.reduce((sum, act) => sum + (act.distance || 0), 0)
    const workoutCount = activities.length
    const weeklyWorkouts = weeklyStats?.totalWorkouts || 0

    const achievementList: Achievement[] = [
      {
        id: '1',
        title: 'Primeiros Passos',
        description: 'Complete seu primeiro treino',
        icon: <Star className="w-5 h-5" />,
        category: 'frequency',
        progress: Math.min(workoutCount, 1),
        maxProgress: 1,
        isUnlocked: workoutCount >= 1,
        points: 10
      },
      {
        id: '2',
        title: 'Maratonista Iniciante',
        description: 'Percorra 42km acumulados',
        icon: <TrendingUp className="w-5 h-5" />,
        category: 'distance',
        progress: Math.min(totalDistance, 42),
        maxProgress: 42,
        isUnlocked: totalDistance >= 42,
        points: 50
      },
      {
        id: '3',
        title: 'Consistência',
        description: 'Complete 5 treinos em uma semana',
        icon: <Zap className="w-5 h-5" />,
        category: 'consistency',
        progress: Math.min(weeklyWorkouts, 5),
        maxProgress: 5,
        isUnlocked: weeklyWorkouts >= 5,
        points: 25
      },
      {
        id: '4',
        title: 'Centena',
        description: 'Percorra 100km acumulados',
        icon: <Award className="w-5 h-5" />,
        category: 'distance',
        progress: Math.min(totalDistance, 100),
        maxProgress: 100,
        isUnlocked: totalDistance >= 100,
        points: 100
      },
      {
        id: '5',
        title: 'Atleta Dedicado',
        description: 'Complete 50 treinos',
        icon: <Star className="w-5 h-5" />,
        category: 'frequency',
        progress: Math.min(workoutCount, 50),
        maxProgress: 50,
        isUnlocked: workoutCount >= 50,
        points: 200
      }
    ]

    setAchievements(achievementList)
    
    // Calcular pontos totais e nível
    const points = achievementList
      .filter(a => a.isUnlocked)
      .reduce((sum, a) => sum + a.points, 0)
    
    setTotalPoints(points)
    
    const newLevel = Math.floor(points / 100) + 1
    const progress = (points % 100)
    
    setLevel(newLevel)
    setLevelProgress(progress)
  }

  const unlockedAchievements = achievements.filter(a => a.isUnlocked)
  const progressAchievements = achievements.filter(a => !a.isUnlocked && a.progress > 0)
  const lockedAchievements = achievements.filter(a => !a.isUnlocked && a.progress === 0)

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500" />
            Sistema de Conquistas
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{totalPoints}</div>
              <div className="text-sm text-gray-500">Pontos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">Nível {level}</div>
              <Progress value={levelProgress} className="w-20 mt-1" />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Conquistas Desbloqueadas */}
        {unlockedAchievements.length > 0 && (
          <div className="mb-6">
            <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
              <Star className="w-4 h-4" />
              Conquistas Desbloqueadas ({unlockedAchievements.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {unlockedAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="p-3 rounded-lg bg-green-50 border border-green-200 animate-fade-in"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-green-600 mt-1">
                      {achievement.icon}
                    </div>
                    <div className="flex-1">
                      <h5 className="font-medium text-green-800">{achievement.title}</h5>
                      <p className="text-sm text-green-600 mb-2">{achievement.description}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                          +{achievement.points} pontos
                        </Badge>
                        <div className="text-xs text-green-500">
                          {achievement.progress}/{achievement.maxProgress}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conquistas em Progresso */}
        {progressAchievements.length > 0 && (
          <div className="mb-6">
            <h4 className="font-semibold text-blue-700 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Em Progresso ({progressAchievements.length})
            </h4>
            <div className="space-y-3">
              {progressAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="p-3 rounded-lg bg-blue-50 border border-blue-200"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-blue-600 mt-1">
                      {achievement.icon}
                    </div>
                    <div className="flex-1">
                      <h5 className="font-medium text-blue-800">{achievement.title}</h5>
                      <p className="text-sm text-blue-600 mb-2">{achievement.description}</p>
                      <div className="space-y-2">
                        <Progress 
                          value={(achievement.progress / achievement.maxProgress) * 100} 
                          className="h-2"
                        />
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-blue-600">
                            {achievement.progress.toFixed(1)}/{achievement.maxProgress} 
                            {achievement.category === 'distance' ? ' km' : ''}
                          </span>
                          <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                            {achievement.points} pontos
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conquistas Bloqueadas */}
        {lockedAchievements.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Bell className="w-4 h-4" />
              A Descobrir ({lockedAchievements.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {lockedAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="p-3 rounded-lg bg-gray-50 border border-gray-200 opacity-60"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-gray-400 mt-1">
                      {achievement.icon}
                    </div>
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-600">{achievement.title}</h5>
                      <p className="text-sm text-gray-500 mb-2">{achievement.description}</p>
                      <Badge variant="outline" className="bg-gray-100 text-gray-500 border-gray-300">
                        {achievement.points} pontos
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resumo de Progresso */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Próximo nível: {100 - levelProgress} pontos restantes
            </span>
            <Button size="sm" variant="outline">
              Ver todas as conquistas
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default AchievementSystem
