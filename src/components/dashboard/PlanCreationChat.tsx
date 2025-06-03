
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dumbbell, Apple, Send, User, Bot, Upload } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface Message {
  id: string
  content: string
  type: 'user' | 'ai'
  timestamp: Date
}

interface PlanCreationChatProps {
  planType: 'training' | 'nutrition'
  onPlanCreated: (planData: any) => void
  onClose: () => void
}

export const PlanCreationChat: React.FC<PlanCreationChatProps> = ({
  planType,
  onPlanCreated,
  onClose
}) => {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: planType === 'training' 
        ? 'Olá! Vou te ajudar a criar um plano de treino personalizado. Para começar, me conte sobre seus objetivos, experiência com exercícios e disponibilidade de tempo.'
        : 'Olá! Vou te ajudar a criar um plano nutricional personalizado. Para começar, me conte sobre seus objetivos, preferências alimentares e restrições.',
      type: 'ai',
      timestamp: new Date()
    }
  ])
  const [currentMessage, setCurrentMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [planText, setPlanText] = useState('')
  const [showUpload, setShowUpload] = useState(false)

  const icon = planType === 'training' ? Dumbbell : Apple
  const title = planType === 'training' ? 'Criar Plano de Treino' : 'Criar Plano Nutricional'
  const color = planType === 'training' ? 'emerald' : 'orange'

  const sendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: currentMessage,
      type: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setCurrentMessage('')
    setIsLoading(true)

    try {
      const { data, error } = await supabase.functions.invoke('ai-agent-openai', {
        body: {
          message: `Como TrainerAI especialista em ${planType === 'training' ? 'treinos' : 'nutrição'}, ajude o usuário: ${currentMessage}`,
          userId: user?.id,
          sessionId: `plan-${planType}-${user?.id}`
        }
      })

      if (error) throw error

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        type: 'ai',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMessage])

      // Se a resposta contém um plano estruturado, oferecer para salvar
      if (data.response.includes('Plano') || data.response.includes('treino') || data.response.includes('dieta')) {
        setTimeout(() => {
          const saveMessage: Message = {
            id: (Date.now() + 2).toString(),
            content: 'Parece que temos um plano pronto! Gostaria que eu salve este plano para você visualizar no dashboard?',
            type: 'ai',
            timestamp: new Date()
          }
          setMessages(prev => [...prev, saveMessage])
        }, 1000)
      }

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      toast.error('Erro ao processar mensagem')
    } finally {
      setIsLoading(false)
    }
  }

  const savePlan = async () => {
    if (!user?.id) return

    try {
      const planData = {
        user_id: user.id,
        title: `Plano ${planType === 'training' ? 'de Treino' : 'Nutricional'} - ${new Date().toLocaleDateString()}`,
        description: `Plano criado via chat IA em ${new Date().toLocaleDateString()}`,
        status: 'active',
        created_by_ai: true
      }

      if (planType === 'training') {
        const { data, error } = await supabase
          .from('training_plans')
          .insert({
            ...planData,
            plan_data: {
              messages: messages.filter(m => m.type === 'ai'),
              created_via: 'ai_chat'
            },
            difficulty_level: 'intermediario',
            duration_weeks: 4
          })
          .select()
          .single()

        if (error) throw error
        onPlanCreated(data)
      } else {
        const { data, error } = await supabase
          .from('nutrition_plans')
          .insert({
            ...planData,
            meal_plan: {
              messages: messages.filter(m => m.type === 'ai'),
              created_via: 'ai_chat'
            },
            daily_calories: 2000
          })
          .select()
          .single()

        if (error) throw error
        onPlanCreated(data)
      }

      toast.success('Plano salvo com sucesso!')
      onClose()
    } catch (error) {
      console.error('Erro ao salvar plano:', error)
      toast.error('Erro ao salvar plano')
    }
  }

  const uploadExistingPlan = async () => {
    if (!planText.trim() || !user?.id) return

    try {
      const planData = {
        user_id: user.id,
        title: `Plano ${planType === 'training' ? 'de Treino' : 'Nutricional'} Enviado - ${new Date().toLocaleDateString()}`,
        description: 'Plano enviado pelo usuário',
        status: 'active',
        created_by_ai: false
      }

      if (planType === 'training') {
        const { data, error } = await supabase
          .from('training_plans')
          .insert({
            ...planData,
            plan_data: {
              content: planText,
              created_via: 'user_upload'
            },
            difficulty_level: 'personalizado'
          })
          .select()
          .single()

        if (error) throw error
        onPlanCreated(data)
      } else {
        const { data, error } = await supabase
          .from('nutrition_plans')
          .insert({
            ...planData,
            meal_plan: {
              content: planText,
              created_via: 'user_upload'
            }
          })
          .select()
          .single()

        if (error) throw error
        onPlanCreated(data)
      }

      toast.success('Plano carregado com sucesso!')
      setPlanText('')
      setShowUpload(false)
      onClose()
    } catch (error) {
      console.error('Erro ao carregar plano:', error)
      toast.error('Erro ao carregar plano')
    }
  }

  const IconComponent = icon

  return (
    <Card className="w-full max-w-2xl mx-auto h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconComponent className={`w-5 h-5 text-${color}-500`} />
            {title}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUpload(!showUpload)}
            >
              <Upload className="w-4 h-4 mr-2" />
              Enviar Plano
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        {showUpload ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                Cole seu plano {planType === 'training' ? 'de treino' : 'nutricional'} existente:
              </label>
              <Textarea
                value={planText}
                onChange={(e) => setPlanText(e.target.value)}
                placeholder={`Cole aqui seu plano ${planType === 'training' ? 'de treino' : 'nutricional'}...`}
                className="min-h-[200px] mt-2"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={uploadExistingPlan} disabled={!planText.trim()}>
                Salvar Plano
              </Button>
              <Button variant="outline" onClick={() => setShowUpload(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.type === 'user'
                        ? `bg-${color}-500 text-white`
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {message.type === 'ai' && <Bot className="w-4 h-4 mt-0.5 text-blue-500" />}
                      {message.type === 'user' && <User className="w-4 h-4 mt-0.5" />}
                      <div>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg px-4 py-2">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-blue-500" />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <div className="flex gap-2">
                <Input
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  disabled={isLoading}
                />
                <Button onClick={sendMessage} disabled={!currentMessage.trim() || isLoading}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              
              {messages.some(m => m.content.includes('salve este plano')) && (
                <div className="mt-2">
                  <Button onClick={savePlan} className={`bg-${color}-500 hover:bg-${color}-600`}>
                    Salvar Plano no Dashboard
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
