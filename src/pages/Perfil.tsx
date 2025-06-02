
import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Navbar } from '@/components/layout/Navbar'
import { toast } from 'sonner'

const Perfil = () => {
  const { user, loading } = useAuth()
  const [profile, setProfile] = useState({
    name: '',
    whatsapp_phone: '',
    age: '',
    weight: '',
    height: '',
    objective: '',
    experience_level: '',
    training_frequency: ''
  })
  const [saving, setSaving] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)

  useEffect(() => {
    if (user) {
      loadProfile()
    }
  }, [user])

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar perfil:', error)
        toast.error('Erro ao carregar perfil')
        return
      }

      if (data) {
        setProfile({
          name: data.name || '',
          whatsapp_phone: data.whatsapp_phone || '',
          age: data.age?.toString() || '',
          weight: data.weight?.toString() || '',
          height: data.height?.toString() || '',
          objective: data.objective || '',
          experience_level: data.experience_level || '',
          training_frequency: data.training_frequency?.toString() || ''
        })
      }
    } catch (error) {
      console.error('Erro inesperado:', error)
      toast.error('Erro inesperado ao carregar perfil')
    } finally {
      setLoadingProfile(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const profileData = {
        user_id: user?.id,
        name: profile.name || null,
        whatsapp_phone: profile.whatsapp_phone || null,
        age: profile.age ? parseInt(profile.age) : null,
        weight: profile.weight ? parseFloat(profile.weight) : null,
        height: profile.height ? parseFloat(profile.height) : null,
        objective: profile.objective || null,
        experience_level: profile.experience_level || null,
        training_frequency: profile.training_frequency ? parseInt(profile.training_frequency) : null,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('user_profiles')
        .upsert(profileData, {
          onConflict: 'user_id'
        })

      if (error) {
        console.error('Erro ao salvar perfil:', error)
        toast.error('Erro ao salvar perfil')
        return
      }

      toast.success('Perfil salvo com sucesso!')
    } catch (error) {
      console.error('Erro inesperado:', error)
      toast.error('Erro inesperado ao salvar perfil')
    } finally {
      setSaving(false)
    }
  }

  if (loading || loadingProfile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto py-8">
          <div className="animate-pulse">Carregando...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto py-8">
          <div className="text-center">
            <p className="text-gray-600">Você precisa estar logado para acessar o perfil.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Meu Perfil</CardTitle>
              <CardDescription>
                Atualize suas informações pessoais e preferências de treino
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Seu nome completo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input
                      id="whatsapp"
                      value={profile.whatsapp_phone}
                      onChange={(e) => setProfile(prev => ({ ...prev, whatsapp_phone: e.target.value }))}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div>
                    <Label htmlFor="age">Idade</Label>
                    <Input
                      id="age"
                      type="number"
                      value={profile.age}
                      onChange={(e) => setProfile(prev => ({ ...prev, age: e.target.value }))}
                      placeholder="25"
                    />
                  </div>
                  <div>
                    <Label htmlFor="weight">Peso (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      value={profile.weight}
                      onChange={(e) => setProfile(prev => ({ ...prev, weight: e.target.value }))}
                      placeholder="70.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="height">Altura (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      value={profile.height}
                      onChange={(e) => setProfile(prev => ({ ...prev, height: e.target.value }))}
                      placeholder="175"
                    />
                  </div>
                  <div>
                    <Label htmlFor="training_frequency">Frequência de Treino (dias/semana)</Label>
                    <Input
                      id="training_frequency"
                      type="number"
                      min="1"
                      max="7"
                      value={profile.training_frequency}
                      onChange={(e) => setProfile(prev => ({ ...prev, training_frequency: e.target.value }))}
                      placeholder="3"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="objective">Objetivo Principal</Label>
                  <Input
                    id="objective"
                    value={profile.objective}
                    onChange={(e) => setProfile(prev => ({ ...prev, objective: e.target.value }))}
                    placeholder="Perder peso, ganhar massa muscular, etc."
                  />
                </div>
                
                <div>
                  <Label htmlFor="experience_level">Nível de Experiência</Label>
                  <Input
                    id="experience_level"
                    value={profile.experience_level}
                    onChange={(e) => setProfile(prev => ({ ...prev, experience_level: e.target.value }))}
                    placeholder="Iniciante, Intermediário, Avançado"
                  />
                </div>

                <Button type="submit" disabled={saving} className="w-full">
                  {saving ? 'Salvando...' : 'Salvar Perfil'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Perfil
