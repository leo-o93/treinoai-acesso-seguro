
import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Bot, User, Send, Loader2, Brain, Dumbbell, Utensils, Sparkles } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useAIChat } from '@/hooks/useAIChat'
import SmartSuggestions from '@/components/dashboard/ai/SmartSuggestions'

const ChatTrainer: React.FC = () => {
  const [inputMessage, setInputMessage] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const { messages, isLoading, sendMessage } = useAIChat('chat-trainer')

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return
    
    const message = inputMessage.trim()
    setInputMessage('')
    setShowSuggestions(false)
    
    await sendMessage(message)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion)
    setShowSuggestions(false)
  }

  const quickActions = [
    { text: 'Gerar plano de treino personalizado', icon: Dumbbell },
    { text: 'Criar dieta baseada no meu perfil', icon: Utensils },
    { text: 'Analisar meu progresso com IA', icon: Brain },
    { text: 'Otimizar meus treinos atuais', icon: Sparkles }
  ]

  return (
    <div className="container mx-auto p-6 max-w-4xl h-screen flex flex-col">
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm flex-1 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="relative">
              <Bot className="w-6 h-6 text-blue-500" />
              <Sparkles className="w-3 h-3 text-yellow-400 absolute -top-1 -right-1" />
            </div>
            TrainerAI - Personal Trainer Virtual Avançado
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-500">IA Avançada OpenAI</Badge>
            <Badge variant="outline" className="text-green-600">Dados Personalizados</Badge>
          </div>
          <p className="text-sm text-gray-600">
            Assistente fitness com IA real, personalizado com seus dados completos
          </p>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {messages.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <div className="relative w-20 h-20 mx-auto mb-4">
                  <Bot className="w-full h-full text-blue-400" />
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">Olá! Sou seu TrainerAI Avançado</h3>
                <p className="mb-2">Agora com IA real da OpenAI e acesso completo aos seus dados!</p>
                <p className="text-sm mt-2">Posso analisar seus treinos, criar planos personalizados e dar conselhos baseados no seu progresso real.</p>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg p-4 ${
                  msg.type === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gradient-to-r from-gray-50 to-blue-50 text-gray-900 border border-gray-200'
                }`}>
                  <div className="flex items-start gap-3">
                    {msg.type === 'ai' && (
                      <div className="relative flex-shrink-0">
                        <Bot className="w-5 h-5 mt-0.5 text-blue-600" />
                        <Sparkles className="w-2 h-2 text-yellow-500 absolute -top-0.5 -right-0.5" />
                      </div>
                    )}
                    {msg.type === 'user' && <User className="w-5 h-5 mt-0.5" />}
                    <div className="flex-1">
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      <p className="text-xs opacity-70 mt-2">
                        {format(msg.timestamp, 'HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4 max-w-[80%] border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Bot className="w-5 h-5 text-blue-600" />
                      <Sparkles className="w-2 h-2 text-yellow-500 absolute -top-0.5 -right-0.5" />
                    </div>
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    <span className="text-gray-600">TrainerAI analisando seus dados...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Smart Suggestions */}
          {showSuggestions && messages.length === 0 && (
            <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
              <SmartSuggestions onSuggestionClick={handleSuggestionClick} />
            </div>
          )}

          {/* Quick Actions */}
          {messages.length === 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3 flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Ações rápidas com IA:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestionClick(action.text)}
                    className="flex items-center gap-2 text-left justify-start bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border-blue-200"
                  >
                    <action.icon className="w-4 h-4 text-blue-600" />
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
              placeholder="Converse com seu TrainerAI inteligente..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={isLoading || !inputMessage.trim()}
              size="icon"
              className="bg-blue-500 hover:bg-blue-600"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          
          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Powered by OpenAI • Dados personalizados • Enter para enviar
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default ChatTrainer
