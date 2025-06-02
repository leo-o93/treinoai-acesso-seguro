
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageCircle, Phone, Search, Filter, Users, Clock } from 'lucide-react'
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
        query = query.or(`content.ilike.%${searchTerm}%,session_id.ilike.%${searchTerm}%`)
      }

      const { data, error } = await query.limit(100)
      if (error) throw error
      return data
    },
    refetchInterval: 5000 // Atualizar a cada 5 segundos
  })

  const { data: stats } = useQuery({
    queryKey: ['operator-stats'],
    queryFn: getOperatorStats,
    refetchInterval: 30000 // Atualizar stats a cada 30 segundos
  })

  // Realtime subscription para novas mensagens
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
            toast.success('Nova mensagem recebida!')
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
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [refetch])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">TrainerAI Dashboard</h1>
          <p className="text-gray-600">Gerenciar conversas do WhatsApp</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-green-600">
            <MessageCircle className="w-4 h-4 mr-1" />
            Online
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
                  placeholder="Buscar por mensagem ou número..."
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
          <ConversationList
            conversations={conversations}
            isLoading={isLoading}
            selectedConversation={selectedConversation}
            onSelectConversation={setSelectedConversation}
          />
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
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default ConversationManager
