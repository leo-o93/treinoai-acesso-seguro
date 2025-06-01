
import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { mcpCall, mcpConhecimento, mcpAI } from '@/lib/mcpClient'
import { Bot, User, Send, Loader2, Brain, Dumbbell, Utensils } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ChatMessage {
  id: string
  message: string
  response?: string
  message_type: 'user' | 'ai'
  created_at: string
}

const ChatTrainer: React.FC = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId] = useState(() => `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (user?.id) {
      loadChatHistory()
    }
  }, [user?.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadChatHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: true })
        .limit(50)

      if (error) throw error

      if (data) {
        const formattedMessages: ChatMessage[] = data.map(item => ({
          id: item.id,
          message: item.message,
          response: item.response || undefined,
          message_type: item.message_type as 'user' | 'ai',
          created_at: item.created_at || new Date().toISOString()
        }))
        setMessages(formattedMessages)
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
    }
  }

  const saveMessage = async (message: string, response: string, messageType: 'user' | 'ai') => {
    try {
      const { error } = await supabase
        .from('chat_history')
        .insert({
          user_id: user?.id,
          message: messageType === 'user' ? message : '',
          response: messageType === 'ai' ? response : '',
          message_type: messageType,
          session_id: sessionId
        })

      if (error) throw error
    } catch (error) {
      console.error('Erro ao salvar mensagem:', error)
    }
  }

  const getUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao buscar perfil:', error)
      return null
    }
  }

  const processAIResponse = async (userMessage: string) => {
    try {
      // Buscar perfil do usuário para contexto
      const profile = await getUserProfile()
      
      if (!profile || !profile.objetivo) {
        return "Olá! Primeiro, preciso que você complete seu perfil com suas informações básicas (objetivo, peso, altura, etc.). Vá para a página de Perfil para começar!"
      }

      // Preparar contexto para a IA
      const context = {
        objetivo: profile.objetivo,
        peso: profile.peso,
        altura: profile.altura,
        frequencia_semanal: profile.frequencia_semanal,
        alimentos_disponiveis: profile.alimentos_disponiveis,
        restricoes_alimentares: profile.restricoes_alimentares,
        experience_level: profile.experience_level
      }

      // Se a mensagem contém palavras-chave específicas, buscar conhecimento primeiro
      const keywords = ['como', 'treino', 'exercício', 'dieta', 'alimentação', 'nutrição', 'hipertrofia', 'emagrecimento']
      const needsKnowledge = keywords.some(keyword => userMessage.toLowerCase().includes(keyword))

      let knowledgeResponse = ''
      if (needsKnowledge) {
        const knowledgeResult = await mcpConhecimento.buscarConhecimento(userMessage)
        if (knowledgeResult.success) {
          knowledgeResponse = knowledgeResult.data || ''
        }
      }

      // Chamar IA principal com contexto e conhecimento
      const aiInput = {
        message: userMessage,
        context: context,
        knowledge: knowledgeResponse,
        session_id: sessionId
      }

      const result = await mcpCall('AI-AGENT', 'process_message', aiInput)
      
      if (result.success) {
        return result.data?.response || result.data || 'Desculpe, não consegui processar sua mensagem.'
      } else {
        throw new Error(result.error || 'Erro na comunicação com a IA')
      }
    } catch (error) {
      console.error('Erro ao processar resposta da IA:', error)
      return 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.'
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || !user?.id) return

    const userMessage = inputMessage.trim()
    setInputMessage('')
    setLoading(true)

    // Adicionar mensagem do usuário
    const newUserMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      message: userMessage,
      message_type: 'user',
      created_at: new Date().toISOString()
    }

    setMessages(prev => [...prev, newUserMessage])
    await saveMessage(userMessage, '', 'user')

    try {
      // Processar resposta da IA
      const aiResponse = await processAIResponse(userMessage)

      // Adicionar resposta da IA
      const newAIMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        message: '',
        response: aiResponse,
        message_type: 'ai',
        created_at: new Date().toISOString()
      }

      setMessages(prev => [...prev, newAIMessage])
      await saveMessage('', aiResponse, 'ai')

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar sua mensagem',
        variant: 'destructive'
      })
    }

    setLoading(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const quickActions = [
    { text: 'Gerar plano de treino', icon: Dumbbell },
    { text: 'Criar dieta personalizada', icon: Utensils },
    { text: 'Analisar meu progresso', icon: Brain },
    { text: 'Dicas de exercícios', icon: Dumbbell }
  ]

  return (
    <div className="container mx-auto p-6 max-w-4xl h-screen flex flex-col">
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm flex-1 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-blue-500" />
            TrainerAI - Seu Personal Trainer Virtual
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 max-h-96">
            {messages.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Bot className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold mb-2">Olá! Sou seu TrainerAI</h3>
                <p>Estou aqui para te ajudar com treinos, dietas e alcançar seus objetivos fitness.</p>
                <p className="text-sm mt-2">Comece fazendo uma pergunta ou use uma das ações rápidas abaixo!</p>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.message_type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg p-3 ${
                  msg.message_type === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <div className="flex items-start gap-2">
                    {msg.message_type === 'ai' && <Bot className="w-4 h-4 mt-1 text-blue-500" />}
                    {msg.message_type === 'user' && <User className="w-4 h-4 mt-1" />}
                    <div className="flex-1">
                      <p className="whitespace-pre-wrap">{msg.message || msg.response}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {format(new Date(msg.created_at), 'HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-blue-500" />
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-gray-600">TrainerAI está pensando...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length === 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Ações rápidas:</p>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setInputMessage(action.text)}
                    className="flex items-center gap-2 text-left justify-start"
                  >
                    <action.icon className="w-4 h-4" />
                    {action.text}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Message Input */}
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              disabled={loading}
              className="flex-1"
            />
            <Button 
              onClick={sendMessage} 
              disabled={loading || !inputMessage.trim()}
              size="icon"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ChatTrainer
