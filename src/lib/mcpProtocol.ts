
import { supabase } from '@/integrations/supabase/client'
import { MCPMessage, MCPMessageType, MCPUserPayload, MCPProgressPayload, MCPPlanPayload } from '@/types/mcp'
import { toast } from '@/hooks/use-toast'

export class MCPProtocol {
  private static readonly MCP_VERSION = '1.0'
  private static readonly SOURCE = 'trainerai-frontend'

  // Enviar mensagem MCP para o backend n8n
  static async sendToBackend(
    type: MCPMessageType,
    sessionId: string,
    payload: any,
    destination: string = 'n8n-backend'
  ): Promise<boolean> {
    try {
      const mcpMessage: MCPMessage = {
        mcp_version: this.MCP_VERSION,
        source: this.SOURCE,
        destination,
        type,
        session_id: sessionId,
        timestamp: new Date().toISOString(),
        payload
      }

      console.log('Enviando mensagem MCP:', mcpMessage)

      // Salvar na tabela mcp_messages para auditoria
      await this.logMCPMessage(mcpMessage, 'outbound')

      // Enviar para webhook do n8n via Edge Function
      const { error } = await supabase.functions.invoke('webhook-receiver', {
        body: {
          source: 'trainerai_frontend',
          eventType: 'mcp_message',
          data: mcpMessage
        }
      })

      if (error) throw error

      toast({
        title: 'Mensagem enviada',
        description: 'Comando enviado para o sistema backend com sucesso.'
      })

      return true
    } catch (error) {
      console.error('Erro ao enviar mensagem MCP:', error)
      toast({
        title: 'Erro de comunicação',
        description: 'Não foi possível enviar comando para o backend.',
        variant: 'destructive'
      })
      return false
    }
  }

  // Processar mensagem MCP recebida do backend
  static async processIncomingMessage(mcpMessage: MCPMessage): Promise<void> {
    try {
      console.log('Processando mensagem MCP recebida:', mcpMessage)

      // Log da mensagem recebida
      await this.logMCPMessage(mcpMessage, 'inbound')

      // Processar baseado no tipo
      switch (mcpMessage.type) {
        case 'new_plan':
          await this.handleNewPlan(mcpMessage)
          break
        case 'progress_update':
          await this.handleProgressUpdate(mcpMessage)
          break
        case 'strava_update':
          await this.handleStravaUpdate(mcpMessage)
          break
        case 'ai_response':
          await this.handleAIResponse(mcpMessage)
          break
        case 'system_notification':
          await this.handleSystemNotification(mcpMessage)
          break
        default:
          console.log('Tipo de mensagem MCP não reconhecido:', mcpMessage.type)
      }
    } catch (error) {
      console.error('Erro ao processar mensagem MCP:', error)
    }
  }

  // Solicitar feedback do usuário
  static async requestFeedback(sessionId: string, planType: 'workout' | 'diet'): Promise<boolean> {
    return this.sendToBackend('feedback_request', sessionId, {
      plan_type: planType,
      request_time: new Date().toISOString()
    })
  }

  // Enviar ajuste de plano
  static async sendPlanAdjustment(
    sessionId: string, 
    adjustments: string[], 
    feedback: string
  ): Promise<boolean> {
    const payload: MCPProgressPayload = {
      session_id: sessionId,
      completed: [],
      feedback,
      adjustments_requested: adjustments
    }

    return this.sendToBackend('plan_adjustment', sessionId, payload)
  }

  // Atualizar progresso do usuário
  static async updateProgress(
    sessionId: string,
    completedActivities: string[],
    feedback: string,
    rating?: number
  ): Promise<boolean> {
    const payload: MCPProgressPayload = {
      session_id: sessionId,
      completed: completedActivities,
      feedback,
      rating
    }

    return this.sendToBackend('progress_update', sessionId, payload)
  }

  // Handlers para tipos específicos de mensagem
  private static async handleNewPlan(message: MCPMessage): Promise<void> {
    const payload = message.payload as MCPPlanPayload
    
    // Salvar novos planos no banco
    if (payload.workout) {
      // Processar plano de treino
      for (const workout of payload.workout) {
        await supabase.from('calendar_events').insert({
          user_id: await this.getUserIdFromSession(message.session_id),
          title: workout.summary,
          description: workout.description,
          event_type: 'workout',
          start_time: workout.date,
          end_time: new Date(new Date(workout.date).getTime() + (workout.duration_minutes || 60) * 60000).toISOString(),
          status: 'scheduled'
        })
      }
    }

    if (payload.diet) {
      // Processar plano de dieta
      for (const meal of payload.diet) {
        await supabase.from('calendar_events').insert({
          user_id: await this.getUserIdFromSession(message.session_id),
          title: meal.summary,
          description: meal.description,
          event_type: 'meal',
          start_time: meal.date,
          end_time: new Date(new Date(meal.date).getTime() + 30 * 60000).toISOString(), // 30min padrão
          status: 'scheduled'
        })
      }
    }

    toast({
      title: 'Novo plano recebido!',
      description: 'Seu plano personalizado foi atualizado com sucesso.'
    })
  }

  private static async handleProgressUpdate(message: MCPMessage): Promise<void> {
    // Processar atualização de progresso
    toast({
      title: 'Progresso atualizado',
      description: 'Suas atividades foram registradas com sucesso.'
    })
  }

  private static async handleStravaUpdate(message: MCPMessage): Promise<void> {
    // Processar dados do Strava
    const stravaData = message.payload
    console.log('Dados Strava atualizados:', stravaData)
  }

  private static async handleAIResponse(message: MCPMessage): Promise<void> {
    // Processar resposta da IA
    const aiResponse = message.payload.response
    console.log('Resposta da IA recebida:', aiResponse)
  }

  private static async handleSystemNotification(message: MCPMessage): Promise<void> {
    // Processar notificação do sistema
    const notification = message.payload
    toast({
      title: notification.title || 'Notificação do Sistema',
      description: notification.message
    })
  }

  // Utilitários
  private static async logMCPMessage(message: MCPMessage, direction: 'inbound' | 'outbound'): Promise<void> {
    try {
      // Serializar corretamente o objeto MCP para JSON
      const serializedPayload = {
        mcp_message: JSON.parse(JSON.stringify(message)),
        direction,
        processed_at: new Date().toISOString()
      }

      await supabase.from('webhook_logs').insert({
        source: `mcp_${direction}`,
        event_type: `mcp_${message.type}`,
        payload: serializedPayload,
        processed: true
      })
    } catch (error) {
      console.error('Erro ao logar mensagem MCP:', error)
    }
  }

  private static async getUserIdFromSession(sessionId: string): Promise<string> {
    try {
      const phone = sessionId.replace('whatsapp_', '').replace('@c.us', '').replace('@s.whatsapp.net', '')
      
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('whatsapp_phone', phone)
        .single()

      return profile?.user_id || '48a7ab75-4bae-4b6b-8ae5-bce83d5ba595' // fallback
    } catch (error) {
      console.error('Erro ao buscar user_id:', error)
      return '48a7ab75-4bae-4b6b-8ae5-bce83d5ba595' // fallback
    }
  }
}

// Hook para usar o protocolo MCP
export const useMCPProtocol = () => {
  return {
    sendToBackend: MCPProtocol.sendToBackend,
    requestFeedback: MCPProtocol.requestFeedback,
    sendPlanAdjustment: MCPProtocol.sendPlanAdjustment,
    updateProgress: MCPProtocol.updateProgress
  }
}
