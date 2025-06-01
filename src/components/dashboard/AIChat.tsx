
import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Send, Bot, User, ThumbsUp, ThumbsDown, RefreshCw } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from '@/hooks/use-toast'

interface Message {
  id: string
  content: string
  type: 'user' | 'ai'
  timestamp: Date
  feedback?: 'positive' | 'negative'
}

const AIChat: React.FC = () => {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load recent messages on component mount
  useEffect(() => {
    loadRecentMessages()
  }, [user])

  const loadRecentMessages = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      const formattedMessages = data.reverse().map(msg => ({
        id: msg.id,
        content: msg.content,
        type: msg.message_type as 'user' | 'ai',
        timestamp: new Date(msg.created_at)
      }))

      setMessages(formattedMessages)
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error)
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || !user || isLoading) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: inputMessage,
      type: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      // Save user message to database
      await supabase.from('ai_conversations').insert({
        user_id: user.id,
        session_id: `web-${user.id}`,
        content: inputMessage,
        message_type: 'user',
        context: {
          source: 'web_dashboard',
          timestamp: new Date().toISOString()
        }
      })

      // Simulate AI response (in real implementation, this would call your AI service)
      setTimeout(() => {
        const aiResponse: Message = {
          id: `ai-${Date.now()}`,
          content: generateAIResponse(inputMessage),
          type: 'ai',
          timestamp: new Date()
        }

        setMessages(prev => [...prev, aiResponse])
        setIsLoading(false)

        // Save AI response to database
        supabase.from('ai_conversations').insert({
          user_id: user.id,
          session_id: `web-${user.id}`,
          content: aiResponse.content,
          message_type: 'ai',
          context: {
            source: 'web_dashboard',
            timestamp: new Date().toISOString()
          }
        })
      }, 1500)

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a mensagem',
        variant: 'destructive'
      })
      setIsLoading(false)
    }
  }

  const generateAIResponse = (userMessage: string): string => {
    // Simple AI response simulation - in production, this would call your actual AI service
    const responses = [
      "Ótima pergunta! Com base no seu histórico, recomendo focar em treinos de resistência esta semana.",
      "Analisando seus dados, vejo que você está progredindo bem! Que tal aumentarmos a intensidade gradualmente?",
      "Perfeito! Vou ajustar seu plano de treino baseado nessa informação.",
      "Entendi! Vou criar uma sugestão personalizada para você. Pode levar alguns minutos.",
      "Excelente feedback! Isso me ajuda a personalizar melhor suas recomendações."
    ]
    
    return responses[Math.floor(Math.random() * responses.length)]
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const provideFeedback = async (messageId: string, feedback: 'positive' | 'negative') => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId ? { ...msg, feedback } : msg
      )
    )

    toast({
      title: 'Feedback enviado',
      description: 'Obrigado pelo seu feedback! Isso nos ajuda a melhorar.'
    })
  }

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm h-[600px] flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-emerald-500" />
            TrainerAI - Assistente Pessoal
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? 'default' : 'destructive'} className="bg-green-500">
              {isConnected ? 'Online' : 'Offline'}
            </Badge>
            <Button size="sm" variant="outline" onClick={loadRecentMessages}>
              <RefreshCw className="w-3 h-3" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Converse com seu treinador virtual para ajustes em tempo real
        </p>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Olá! Sou seu TrainerAI 🤖</p>
              <p className="text-sm">Como posso ajudar você hoje?</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`
                    max-w-[80%] rounded-lg px-4 py-2 
                    ${message.type === 'user' 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-gray-100 text-gray-900'
                    }
                  `}
                >
                  <div className="flex items-start gap-2">
                    {message.type === 'ai' && (
                      <Bot className="w-4 h-4 mt-1 text-emerald-500" />
                    )}
                    {message.type === 'user' && (
                      <User className="w-4 h-4 mt-1 text-white" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 opacity-70`}>
                        {format(message.timestamp, 'HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  
                  {/* Feedback buttons for AI messages */}
                  {message.type === 'ai' && (
                    <div className="flex items-center gap-1 mt-2 justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        className={`h-6 w-6 p-0 ${message.feedback === 'positive' ? 'text-green-600' : 'text-gray-400'}`}
                        onClick={() => provideFeedback(message.id, 'positive')}
                      >
                        <ThumbsUp className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className={`h-6 w-6 p-0 ${message.feedback === 'negative' ? 'text-red-600' : 'text-gray-400'}`}
                        onClick={() => provideFeedback(message.id, 'negative')}
                      >
                        <ThumbsDown className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-[80%]">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-emerald-500" />
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="flex items-center gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Pressione Enter para enviar • Shift+Enter para nova linha
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default AIChat
