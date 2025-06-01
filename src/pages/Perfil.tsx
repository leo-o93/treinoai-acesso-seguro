
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { User, Target, Scale, Ruler, Calendar, Utensils, Dumbbell, CheckCircle } from 'lucide-react'

interface UserProfile {
  id?: string
  user_id: string
  name?: string
  age?: number
  objetivo?: string
  prazo?: number
  peso?: number
  altura?: number
  frequencia_semanal?: number
  alimentos_disponiveis?: string[]
  restricoes_alimentares?: string[]
  experience_level?: string
  strava_connected?: boolean
}

const Perfil: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<UserProfile>({
    user_id: user?.id || '',
    alimentos_disponiveis: [],
    restricoes_alimentares: []
  })

  useEffect(() => {
    if (user?.id) {
      loadProfile()
    }
  }, [user?.id])

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle()

      if (error) throw error

      if (data) {
        setProfile({
          ...data,
          alimentos_disponiveis: data.alimentos_disponiveis || [],
          restricoes_alimentares: data.restricoes_alimentares || []
        })
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar seu perfil',
        variant: 'destructive'
      })
    }
  }

  const handleSave = async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          ...profile,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      toast({
        title: 'Sucesso!',
        description: 'Perfil salvo com sucesso',
      })

      // Verificar se o perfil está completo para redirecionar
      if (profile.objetivo && profile.peso && profile.altura && profile.frequencia_semanal) {
        navigate('/dashboard')
      }
    } catch (error) {
      console.error('Erro ao salvar perfil:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar seu perfil',
        variant: 'destructive'
      })
    }
    setLoading(false)
  }

  const addAlimento = (alimento: string) => {
    if (alimento && !profile.alimentos_disponiveis?.includes(alimento)) {
      setProfile(prev => ({
        ...prev,
        alimentos_disponiveis: [...(prev.alimentos_disponiveis || []), alimento]
      }))
    }
  }

  const removeAlimento = (alimento: string) => {
    setProfile(prev => ({
      ...prev,
      alimentos_disponiveis: prev.alimentos_disponiveis?.filter(a => a !== alimento) || []
    }))
  }

  const addRestricao = (restricao: string) => {
    if (restricao && !profile.restricoes_alimentares?.includes(restricao)) {
      setProfile(prev => ({
        ...prev,
        restricoes_alimentares: [...(prev.restricoes_alimentares || []), restricao]
      }))
    }
  }

  const removeRestricao = (restricao: string) => {
    setProfile(prev => ({
      ...prev,
      restricoes_alimentares: prev.restricoes_alimentares?.filter(r => r !== restricao) || []
    }))
  }

  const isProfileComplete = profile.objetivo && profile.peso && profile.altura && profile.frequencia_semanal

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-6 h-6 text-blue-500" />
            Meu Perfil TrainerAI
            {isProfileComplete && (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-gray-600" />
              Informações Básicas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={profile.name || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Seu nome"
                />
              </div>
              <div>
                <Label htmlFor="age">Idade</Label>
                <Input
                  id="age"
                  type="number"
                  value={profile.age || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, age: parseInt(e.target.value) }))}
                  placeholder="Sua idade"
                />
              </div>
            </div>
          </div>

          {/* Objetivo e Prazo */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-green-600" />
              Objetivo e Prazo
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="objetivo">Objetivo Principal *</Label>
                <Select value={profile.objetivo || ''} onValueChange={(value) => setProfile(prev => ({ ...prev, objetivo: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione seu objetivo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="emagrecer">Emagrecer</SelectItem>
                    <SelectItem value="ganhar_massa">Ganhar Massa Muscular</SelectItem>
                    <SelectItem value="manter_peso">Manter Peso</SelectItem>
                    <SelectItem value="melhorar_condicionamento">Melhorar Condicionamento</SelectItem>
                    <SelectItem value="reabilitacao">Reabilitação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="prazo">Prazo (semanas)</Label>
                <Input
                  id="prazo"
                  type="number"
                  value={profile.prazo || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, prazo: parseInt(e.target.value) }))}
                  placeholder="Ex: 12"
                />
              </div>
            </div>
          </div>

          {/* Dados Físicos */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Scale className="w-5 h-5 text-blue-600" />
              Dados Físicos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="peso">Peso (kg) *</Label>
                <Input
                  id="peso"
                  type="number"
                  step="0.1"
                  value={profile.peso || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, peso: parseFloat(e.target.value) }))}
                  placeholder="Ex: 70.5"
                />
              </div>
              <div>
                <Label htmlFor="altura">Altura (cm) *</Label>
                <Input
                  id="altura"
                  type="number"
                  value={profile.altura || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, altura: parseFloat(e.target.value) }))}
                  placeholder="Ex: 175"
                />
              </div>
            </div>
          </div>

          {/* Treino */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-orange-600" />
              Preferências de Treino
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="frequencia">Frequência Semanal *</Label>
                <Select value={profile.frequencia_semanal?.toString() || ''} onValueChange={(value) => setProfile(prev => ({ ...prev, frequencia_semanal: parseInt(value) }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Dias por semana" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1x por semana</SelectItem>
                    <SelectItem value="2">2x por semana</SelectItem>
                    <SelectItem value="3">3x por semana</SelectItem>
                    <SelectItem value="4">4x por semana</SelectItem>
                    <SelectItem value="5">5x por semana</SelectItem>
                    <SelectItem value="6">6x por semana</SelectItem>
                    <SelectItem value="7">7x por semana</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="experience">Nível de Experiência</Label>
                <Select value={profile.experience_level || ''} onValueChange={(value) => setProfile(prev => ({ ...prev, experience_level: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seu nível" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="iniciante">Iniciante</SelectItem>
                    <SelectItem value="intermediario">Intermediário</SelectItem>
                    <SelectItem value="avancado">Avançado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Alimentação */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Utensils className="w-5 h-5 text-emerald-600" />
              Alimentação
            </h3>
            
            <div>
              <Label htmlFor="alimentos">Alimentos Disponíveis em Casa</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Digite um alimento e pressione Enter"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addAlimento(e.currentTarget.value)
                      e.currentTarget.value = ''
                    }
                  }}
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {profile.alimentos_disponiveis?.map((alimento, index) => (
                  <Badge key={index} variant="outline" className="cursor-pointer" onClick={() => removeAlimento(alimento)}>
                    {alimento} ×
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="restricoes">Restrições/Alergias Alimentares</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Digite uma restrição e pressione Enter"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addRestricao(e.currentTarget.value)
                      e.currentTarget.value = ''
                    }
                  }}
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {profile.restricoes_alimentares?.map((restricao, index) => (
                  <Badge key={index} variant="outline" className="cursor-pointer bg-red-50" onClick={() => removeRestricao(restricao)}>
                    {restricao} ×
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-4 pt-6">
            <Button onClick={handleSave} disabled={loading} className="flex-1">
              {loading ? 'Salvando...' : 'Salvar Perfil'}
            </Button>
            {isProfileComplete && (
              <Button variant="outline" onClick={() => navigate('/chat')} className="flex-1">
                Ir para Chat TrainerAI
              </Button>
            )}
          </div>

          {!isProfileComplete && (
            <div className="text-center text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
              Complete os campos obrigatórios (*) para acessar todas as funcionalidades do TrainerAI
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Perfil
