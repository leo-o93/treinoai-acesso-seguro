
import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Send, Bot, User, RefreshCw, Sparkles } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useAIChat } from '@/hooks/useAIChat'
import SmartSuggestions from './ai/SmartSuggestions'

const AIChat: React.FC = () => {
  const [inputMessage, setInputMessage] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const { messages, isLoading, sendMessage, clearMessages } = useAIChat()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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

  const handleClearChat = () => {
    clearMessages()
    setShowSuggestions(true)
  }

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm h-[600px] flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="relative">
              <MessageCircle className="w-5 h-5 text-emerald-500" />
              <Sparkles className="w-3 h-3 text-yellow-400 absolute -top-1 -right-1" />
            </div>
            TrainerAI - Assistente Inteligente
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-emerald-500">
              IA Avançada
            </Badge>
            <Button size="sm" variant="outline" onClick={handleClearChat}>
              <RefreshCw className="w-3 h-3" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Assistente fitness com IA real - personalizado com seus dados
        </p>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <Bot className="w-full h-full text-emerald-500" />
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Olá! Sou seu TrainerAI Avançado 🚀</h3>
              <p className="text-gray-600 mb-4">
                Agora com IA real! Tenho acesso aos seus dados e posso oferecer análises personalizadas.
              </p>
              <p className="text-sm text-gray-500">
                Faça perguntas sobre treinos, nutrição, ou escolha uma sugestão abaixo!
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`
                    max-w-[85%] rounded-lg px-4 py-3 
                    ${message.type === 'user' 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-gradient-to-r from-gray-50 to-blue-50 text-gray-900 border border-gray-200'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    {message.type === 'ai' && (
                      <div className="relative flex-shrink-0">
                        <Bot className="w-5 h-5 mt-0.5 text-emerald-600" />
                        <Sparkles className="w-2 h-2 text-yellow-500 absolute -top-0.5 -right-0.5" />
                      </div>
                    )}
                    {message.type === 'user' && (
                      <User className="w-5 h-5 mt-0.5 text-white flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      <p className={`text-xs mt-2 opacity-70`}>
                        {format(message.timestamp, 'HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg px-4 py-3 max-w-[85%] border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Bot className="w-5 h-5 text-emerald-600" />
                    <Sparkles className="w-2 h-2 text-yellow-500 absolute -top-0.5 -right-0.5" />
                  </div>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                  <span className="text-sm text-gray-600">TrainerAI analisando...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Smart Suggestions */}
        {showSuggestions && messages.length === 0 && (
          <div className="border-t p-4 bg-gray-50/50">
            <SmartSuggestions onSuggestionClick={handleSuggestionClick} />
          </div>
        )}

        {/* Input Area */}
        <div className="border-t p-4 bg-white">
          <div className="flex items-center gap-2">
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
              disabled={!inputMessage.trim() || isLoading}
              size="sm"
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            IA avançada com acesso aos seus dados • Enter para enviar
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default AIChat
