
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageCircle, Phone, Search, Filter, Users, Clock, Bot } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { getTrainerAIConversations, getOperatorStats } from '@/lib/database'
import { ConversationList } from './ConversationList'
import { ConversationDetail } from './ConversationDetail'
import { OperatorStats } from './OperatorStats'
import { TestButton } from './TestButton'
import { toast } from 'sonner'

const ConversationManager: React.FC = () => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'pending' | 'responded'>('all')

  const { data: conversations = [], isLoading, refetch } = useQuery({
    queryKey: ['operator-conversations', searchTerm, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('ai_conversations')
        .select(`
          *,
          ai_responses(*)
        `)
        .eq('message_type', 'user')
        .like('session_id', 'whatsapp_%')
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        if (statusFilter === 'unread') {
          query = query.eq('read_status', 'unread')
        } else {
          query = query.eq('response_status', statusFilter)
        }
      }

      if (searchTerm) {
        // Buscar por conteúdo, telefone ou session_id
        query = query.or(`content.ilike.%${searchTerm}%,session_id.ilike.%${searchTerm}%,whatsapp_phone.ilike.%${searchTerm}%`)
      }

      const { data, error } = await query.limit(100)
      if (error) throw error
      return data
    },
    refetchInterval: 5000
  })

  const { data: stats } = useQuery({
    queryKey: ['operator-stats'],
    queryFn: getOperatorStats,
    refetchInterval: 30000
  })

  // Realtime subscription para novas mensagens WhatsApp
  useEffect(() => {
    const channel = supabase
      .channel('operator-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_conversations'
        },
        (payload) => {
          if (payload.new.message_type === 'user' && payload.new.session_id?.includes('whatsapp_')) {
            toast.success(`Nova mensagem WhatsApp de ${payload.new.whatsapp_phone || 'usuário'}!`)
            refetch()
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ai_conversations'
        },
        () => {
          refetch()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_responses'
        },
        (payload) => {
          if (payload.new.session_id?.includes('whatsapp_')) {
            toast.info('IA respondeu uma mensagem WhatsApp!')
            refetch()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [refetch])

  const getPhoneNumber = (conversation: any) => {
    return conversation.whatsapp_phone || conversation.session_id.replace('whatsapp_', '').replace('@c.us', '')
  }

  const hasAIResponse = (conversation: any) => {
    return conversation.ai_responses && conversation.ai_responses.length > 0
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">TrainerAI Dashboard</h1>
          <p className="text-gray-600">Gerenciar conversas do WhatsApp e respostas automáticas</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-green-600">
            <MessageCircle className="w-4 h-4 mr-1" />
            WhatsApp Conectado
          </Badge>
          <Badge variant="outline" className="text-blue-600">
            <Bot className="w-4 h-4 mr-1" />
            IA Ativa
          </Badge>
        </div>
      </div>

      {/* Test Button */}
      <TestButton />

      {/* Stats Cards */}
      {stats && <OperatorStats stats={stats} />}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros e Busca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por mensagem, número ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {['all', 'unread', 'pending', 'responded'].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status as any)}
                >
                  {status === 'all' ? 'Todas' : 
                   status === 'unread' ? 'Não lidas' :
                   status === 'pending' ? 'Pendentes' : 'Respondidas'}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversation List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Conversas WhatsApp ({conversations.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-gray-200 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhuma conversa encontrada</p>
                  <p className="text-sm">As conversas do WhatsApp aparecerão aqui</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {conversations.map((conversation) => {
                    const phone = getPhoneNumber(conversation)
                    const aiResponse = hasAIResponse(conversation)
                    
                    return (
                      <div
                        key={conversation.id}
                        onClick={() => setSelectedConversation(conversation.id)}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedConversation === conversation.id 
                            ? 'bg-blue-50 border-blue-200' 
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-green-500" />
                            <span className="font-medium text-sm">{phone}</span>
                          </div>
                          <div className="flex gap-1">
                            {conversation.read_status === 'unread' && (
                              <Badge variant="destructive" className="text-xs">Nova</Badge>
                            )}
                            {aiResponse && (
                              <Badge variant="secondary" className="text-xs">
                                <Bot className="w-3 h-3" />
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 truncate">
                          {conversation.content}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {format(new Date(conversation.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Conversation Detail */}
        <div className="lg:col-span-2">
          {selectedConversation ? (
            <ConversationDetail
              conversationId={selectedConversation}
              onResponseSent={() => refetch()}
            />
          ) : (
            <Card className="h-96 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Selecione uma conversa para visualizar</p>
                <p className="text-sm mt-2">As respostas automáticas da IA aparecerão em tempo real</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default ConversationManager
