
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { mcpAgendamento } from '@/lib/mcpClient'
import { Calendar, Clock, Dumbbell, Utensils, Plus, Edit, Trash2, CheckCircle } from 'lucide-react'
import { format, addDays, startOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface PlanoItem {
  id: string
  tipo: 'treino' | 'dieta'
  titulo: string
  descricao: string
  horario: string
  dia_semana: number // 0 = domingo, 1 = segunda, etc.
  agendado?: boolean
  event_id?: string
}

interface PlanoSemanal {
  id: string
  plan_type: string
  plan_data: {
    items: PlanoItem[]
    created_at: string
    objetivo: string
  }
  created_at: string
  status: string
}

const PlanoAtual: React.FC = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [planoAtual, setPlanoAtual] = useState<PlanoSemanal | null>(null)
  const [loading, setLoading] = useState(false)
  const [agendandoItem, setAgendandoItem] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id) {
      loadPlanoAtual()
    }
  }, [user?.id])

  const loadPlanoAtual = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('training_plans_history')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) throw error

      if (data) {
        // Parse the JSON data safely
        const parsedData = {
          id: data.id,
          plan_type: data.plan_type,
          created_at: data.created_at || new Date().toISOString(),
          status: data.status || 'active',
          plan_data: typeof data.plan_data === 'string' 
            ? JSON.parse(data.plan_data) 
            : data.plan_data || { items: [], created_at: new Date().toISOString(), objetivo: '' }
        } as PlanoSemanal
        
        setPlanoAtual(parsedData)
      }
    } catch (error) {
      console.error('Erro ao carregar plano:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar seu plano atual',
        variant: 'destructive'
      })
    }
    setLoading(false)
  }

  const agendarItem = async (item: PlanoItem) => {
    if (!user?.id || agendandoItem) return

    setAgendandoItem(item.id)
    try {
      // Calcular a data do próximo dia da semana
      const hoje = new Date()
      const inicioSemana = startOfWeek(hoje, { weekStartsOn: 1 }) // Segunda-feira
      const diaItem = addDays(inicioSemana, item.dia_semana === 0 ? 6 : item.dia_semana - 1)
      
      // Converter horário para datetime
      const [hora, minuto] = item.horario.split(':').map(Number)
      const startTime = new Date(diaItem)
      startTime.setHours(hora, minuto, 0, 0)
      
      const endTime = new Date(startTime)
      endTime.setHours(startTime.getHours() + (item.tipo === 'treino' ? 1 : 0.5)) // Treino 1h, refeição 30min

      const result = await mcpAgendamento.criarEvento(
        item.titulo,
        item.descricao,
        startTime.toISOString(),
        endTime.toISOString()
      )

      if (result.success) {
        // Atualizar o item como agendado
        const updatedItems = planoAtual?.plan_data.items.map(planItem => 
          planItem.id === item.id 
            ? { ...planItem, agendado: true, event_id: result.data?.eventId }
            : planItem
        )

        if (updatedItems && planoAtual) {
          const updatedPlan = {
            ...planoAtual,
            plan_data: {
              ...planoAtual.plan_data,
              items: updatedItems
            }
          }

          // Salvar no banco - converting to proper JSON format
          await supabase
            .from('training_plans_history')
            .update({ plan_data: updatedPlan.plan_data as any })
            .eq('id', planoAtual.id)

          setPlanoAtual(updatedPlan)
        }

        toast({
          title: 'Sucesso!',
          description: `${item.titulo} foi agendado no seu calendário`,
        })
      } else {
        throw new Error(result.error || 'Erro ao agendar')
      }
    } catch (error) {
      console.error('Erro ao agendar item:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível agendar este item',
        variant: 'destructive'
      })
    }
    setAgendandoItem(null)
  }

  const cancelarAgendamento = async (item: PlanoItem) => {
    if (!item.event_id) return

    try {
      const result = await mcpAgendamento.cancelarEvento(item.event_id)

      if (result.success) {
        // Atualizar o item como não agendado
        const updatedItems = planoAtual?.plan_data.items.map(planItem => 
          planItem.id === item.id 
            ? { ...planItem, agendado: false, event_id: undefined }
            : planItem
        )

        if (updatedItems && planoAtual) {
          const updatedPlan = {
            ...planoAtual,
            plan_data: {
              ...planoAtual.plan_data,
              items: updatedItems
            }
          }

          // Salvar no banco
          await supabase
            .from('training_plans_history')
            .update({ plan_data: updatedPlan.plan_data as any })
            .eq('id', planoAtual.id)

          setPlanoAtual(updatedPlan)
        }

        toast({
          title: 'Cancelado',
          description: `${item.titulo} foi removido do calendário`,
        })
      }
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível cancelar o agendamento',
        variant: 'destructive'
      })
    }
  }

  const diasSemana = [
    'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 
    'Quinta-feira', 'Sexta-feira', 'Sábado'
  ]

  const agruparPorDia = (items: PlanoItem[]) => {
    const grupos: { [key: number]: PlanoItem[] } = {}
    items.forEach(item => {
      if (!grupos[item.dia_semana]) {
        grupos[item.dia_semana] = []
      }
      grupos[item.dia_semana].push(item)
    })
    return grupos
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-40 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!planoAtual) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold mb-2">Nenhum plano ativo encontrado</h3>
            <p className="text-gray-600 mb-4">
              Vá para o Chat TrainerAI para gerar seu plano personalizado de treino e dieta.
            </p>
            <Button onClick={() => window.location.href = '/chat'}>
              Ir para Chat TrainerAI
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const itensAgrupados = agruparPorDia(planoAtual.plan_data.items || [])

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Meu Plano Semanal</h1>
        <div className="flex items-center gap-4 text-gray-600">
          <span>Objetivo: {planoAtual.plan_data.objetivo || 'Não especificado'}</span>
          <span>•</span>
          <span>Criado em: {format(new Date(planoAtual.created_at), 'dd/MM/yyyy', { locale: ptBR })}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {diasSemana.map((dia, index) => {
          const itensNoDia = itensAgrupados[index] || []
          
          if (itensNoDia.length === 0) return null

          return (
            <Card key={index} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  {dia}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {itensNoDia.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {item.tipo === 'treino' ? (
                          <Dumbbell className="w-4 h-4 text-orange-500" />
                        ) : (
                          <Utensils className="w-4 h-4 text-green-500" />
                        )}
                        <Badge variant="outline" className={
                          item.tipo === 'treino' ? 'bg-orange-50' : 'bg-green-50'
                        }>
                          {item.tipo}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{item.horario}</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900">{item.titulo}</h4>
                      <p className="text-sm text-gray-600 mt-1">{item.descricao}</p>
                    </div>

                    <div className="flex gap-2">
                      {item.agendado ? (
                        <>
                          <Button size="sm" variant="outline" className="flex-1 text-green-600 border-green-200">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Agendado
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => cancelarAgendamento(item)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <Button 
                          size="sm" 
                          onClick={() => agendarItem(item)}
                          disabled={agendandoItem === item.id}
                          className="flex-1"
                        >
                          {agendandoItem === item.id ? (
                            <>Agendando...</>
                          ) : (
                            <>
                              <Plus className="w-4 h-4 mr-1" />
                              Agendar
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {Object.keys(itensAgrupados).length === 0 && (
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold mb-2">Plano vazio</h3>
            <p className="text-gray-600">
              Seu plano atual não possui itens. Vá para o Chat TrainerAI para gerar um novo plano.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default PlanoAtual
