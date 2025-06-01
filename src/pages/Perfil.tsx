
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
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<UserProfile>({
    user_id: '',
    alimentos_disponiveis: [],
    restricoes_alimentares: []
  })

  // Debug logs
  console.log('=== PERFIL DEBUG ===')
  console.log('User:', user)
  console.log('User ID:', user?.id)
  console.log('Loading:', loading)
  console.log('Profile user_id:', profile.user_id)

  useEffect(() => {
    // Aguardar o usuário ser carregado antes de tentar carregar o perfil
    if (!loading && user?.id) {
      console.log('=== CARREGANDO PERFIL ===')
      console.log('User ID disponível:', user.id)
      
      // Atualizar o user_id no estado imediatamente
      setProfile(prev => ({
        ...prev,
        user_id: user.id
      }))
      
      loadProfile()
    }
  }, [user?.id, loading])

  const loadProfile = async () => {
    if (!user?.id) {
      console.error('Tentativa de carregar perfil sem user_id')
      return
    }

    try {
      console.log('=== BUSCANDO PERFIL NO BANCO ===')
      console.log('Buscando perfil para user_id:', user.id)
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      console.log('Resposta do banco:', { data, error })

      if (error) {
        console.error('Erro ao buscar perfil:', error)
        throw error
      }

      if (data) {
        console.log('=== PERFIL ENCONTRADO ===')
        console.log('Dados do perfil:', data)
        
        setProfile({
          ...data,
          user_id: user.id, // Garantir que sempre tenha o user_id correto
          alimentos_disponiveis: data.alimentos_disponiveis || [],
          restricoes_alimentares: data.restricoes_alimentares || []
        })
      } else {
        console.log('=== PERFIL NÃO ENCONTRADO - CRIANDO NOVO ===')
        // Se não encontrou perfil, manter o estado inicial com user_id
        setProfile(prev => ({
          ...prev,
          user_id: user.id
        }))
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
    console.log('=== INICIANDO SALVAMENTO ===')
    
    // Verificar se o usuário está autenticado
    if (!user?.id) {
      console.error('Usuário não autenticado ao tentar salvar')
      toast({
        title: 'Erro de Autenticação',
        description: 'Você precisa estar logado para salvar o perfil',
        variant: 'destructive'
      })
      return
    }

    // Verificar se o profile tem user_id
    if (!profile.user_id) {
      console.error('Profile sem user_id ao tentar salvar')
      setProfile(prev => ({ ...prev, user_id: user.id }))
      toast({
        title: 'Erro',
        description: 'Erro interno: user_id não encontrado. Tente novamente.',
        variant: 'destructive'
      })
      return
    }

    setSaving(true)
    
    try {
      console.log('=== DADOS PARA SALVAR ===')
      console.log('User ID atual:', user.id)
      console.log('Profile user_id:', profile.user_id)
      console.log('Profile completo:', profile)

      // Preparar dados para salvar (garantindo user_id)
      const profileToSave = {
        ...profile,
        user_id: user.id, // Sempre usar o user.id atual
        updated_at: new Date().toISOString()
      }

      console.log('Dados finais para salvar:', profileToSave)

      const { data, error } = await supabase
        .from('user_profiles')
        .upsert(profileToSave)
        .select()
        .single()

      console.log('Resposta do upsert:', { data, error })

      if (error) {
        console.error('Erro no upsert:', error)
        throw error
      }

      console.log('=== PERFIL SALVO COM SUCESSO ===')
      
      toast({
        title: 'Sucesso!',
        description: 'Perfil salvo com sucesso',
      })

      // Verificar se o perfil está completo para redirecionar
      if (profile.objetivo && profile.peso && profile.altura && profile.frequencia_semanal) {
        console.log('Perfil completo, redirecionando para dashboard')
        navigate('/dashboard')
      }
    } catch (error) {
      console.error('Erro ao salvar perfil:', error)
      toast({
        title: 'Erro',
        description: `Não foi possível salvar seu perfil: ${error.message}`,
        variant: 'destructive'
      })
    }
    setSaving(false)
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

  // Mostrar loading enquanto carrega usuário
  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Carregando perfil...</p>
        </div>
      </div>
    )
  }

  // Verificar se usuário está autenticado
  if (!user) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center">
          <p className="text-red-600">Você precisa estar logado para acessar o perfil.</p>
          <Button onClick={() => navigate('/login')} className="mt-4">
            Fazer Login
          </Button>
        </div>
      </div>
    )
  }

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
          <div className="text-sm text-gray-600">
            Usuário: {user.email}
          </div>
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
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? 'Salvando...' : 'Salvar Perfil'}
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
