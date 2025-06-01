
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { User, Edit3, Heart, Scale, Ruler, Calendar, Utensils, Dumbbell } from 'lucide-react'
import { UserProfile } from '@/lib/database'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface UserDataPanelProps {
  profile: UserProfile | null
}

const UserDataPanel: React.FC<UserDataPanelProps> = ({ profile }) => {
  const [isEditMode, setIsEditMode] = useState(false)

  if (!profile) {
    return (
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-purple-500" />
            Dados do Usuário
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Perfil não encontrado</p>
            <p className="text-sm">Complete seu perfil para começar</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const calculateAge = (birthday: string) => {
    const today = new Date()
    const birth = new Date(birthday)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const calculateBMI = () => {
    if (profile.weight && profile.height) {
      const heightInM = profile.height / 100
      return (profile.weight / (heightInM * heightInM)).toFixed(1)
    }
    return null
  }

  const bmi = calculateBMI()
  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: 'Abaixo do peso', color: 'text-blue-600' }
    if (bmi < 25) return { label: 'Peso normal', color: 'text-green-600' }
    if (bmi < 30) return { label: 'Sobrepeso', color: 'text-yellow-600' }
    return { label: 'Obesidade', color: 'text-red-600' }
  }

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-purple-500" />
            Dados do Usuário
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditMode(!isEditMode)}
          >
            <Edit3 className="w-3 h-3 mr-1" />
            Editar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informações Básicas */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-500" />
            Informações Básicas
          </h4>
          
          <div className="grid grid-cols-2 gap-4">
            {profile.name && (
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">Nome</label>
                <p className="font-medium text-gray-900">{profile.name}</p>
              </div>
            )}
            
            {profile.age && (
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">Idade</label>
                <p className="font-medium text-gray-900">{profile.age} anos</p>
              </div>
            )}
          </div>
        </div>

        {/* Dados Físicos */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <Scale className="w-4 h-4 text-blue-500" />
            Dados Físicos
          </h4>
          
          <div className="grid grid-cols-2 gap-4">
            {profile.weight && (
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">Peso</label>
                <p className="font-medium text-gray-900">{profile.weight} kg</p>
              </div>
            )}
            
            {profile.height && (
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">Altura</label>
                <p className="font-medium text-gray-900">{profile.height} cm</p>
              </div>
            )}
          </div>

          {bmi && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">IMC</span>
                <div className="text-right">
                  <span className="font-bold text-gray-900">{bmi}</span>
                  <span className={`block text-xs ${getBMICategory(parseFloat(bmi)).color}`}>
                    {getBMICategory(parseFloat(bmi)).label}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Objetivo e Prazo */}
        {(profile.objective || profile.deadline) && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-green-500" />
              Objetivo
            </h4>
            
            {profile.objective && (
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">Objetivo Principal</label>
                <p className="font-medium text-gray-900">{profile.objective}</p>
              </div>
            )}
            
            {profile.deadline && (
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">Prazo</label>
                <p className="font-medium text-gray-900">
                  {format(new Date(profile.deadline), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Preferências de Treino */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-orange-500" />
            Treino
          </h4>
          
          <div className="grid grid-cols-2 gap-4">
            {profile.training_frequency && (
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">Frequência</label>
                <p className="font-medium text-gray-900">{profile.training_frequency}x por semana</p>
              </div>
            )}
            
            {profile.experience_level && (
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">Nível</label>
                <Badge variant="outline" className="bg-orange-50">
                  {profile.experience_level}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Alimentação */}
        {(profile.food_preferences?.length || profile.restrictions?.length) && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Utensils className="w-4 h-4 text-emerald-500" />
              Alimentação
            </h4>
            
            {profile.food_preferences && profile.food_preferences.length > 0 && (
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">Preferências</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {profile.food_preferences.map((pref, index) => (
                    <Badge key={index} variant="outline" className="bg-green-50 text-xs">
                      {pref}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {profile.restrictions && profile.restrictions.length > 0 && (
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">Restrições</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {profile.restrictions.map((restriction, index) => (
                    <Badge key={index} variant="outline" className="bg-red-50 text-xs">
                      {restriction}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Conexões */}
        {profile.strava_connected && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Conexões</h4>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-orange-50">
                <span className="text-orange-600">✓ Strava conectado</span>
              </Badge>
            </div>
          </div>
        )}

        {/* Última atualização */}
        <div className="pt-4 border-t">
          <p className="text-xs text-gray-500">
            Última atualização: {format(new Date(profile.updated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default UserDataPanel
