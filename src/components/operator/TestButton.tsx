
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Send, CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export const TestButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [lastResponse, setLastResponse] = useState<any>(null)

  const sendTestWebhook = async () => {
    setIsLoading(true)
    try {
      const testPayload = {
        remoteJid: "5511999999999@s.whatsapp.net",
        message: "Olá! Esta é uma mensagem de teste do n8n",
        type: "text",
        date_time: new Date().toISOString()
      }

      const response = await fetch('https://shhkccidqvvrwgxlyvqq.supabase.co/functions/v1/webhook-receiver/trainerai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload)
      })

      const data = await response.json()
      console.log('Resposta do webhook:', data)
      
      setLastResponse(data)
      
      if (response.ok) {
        toast.success('Webhook enviado com sucesso!')
      } else {
        toast.error('Erro no webhook: ' + (data.error || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('Erro ao enviar webhook:', error)
      toast.error('Erro ao enviar webhook: ' + error.message)
      setLastResponse({ error: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="w-5 h-5" />
          Teste de Webhook
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={sendTestWebhook} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Enviando...' : 'Enviar Webhook de Teste'}
        </Button>
        
        {lastResponse && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                {lastResponse.success ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Sucesso
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    Erro
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                {JSON.stringify(lastResponse, null, 2)}
              </pre>
              
              {lastResponse.success && lastResponse.data && (
                <div className="mt-3 space-y-2">
                  <Badge variant="outline">
                    Session: {lastResponse.data.session_id}
                  </Badge>
                  <Badge variant="outline">
                    Phone: {lastResponse.data.phone}
                  </Badge>
                  {lastResponse.data.conversation_id && (
                    <Badge variant="outline">
                      Conv ID: {lastResponse.data.conversation_id}
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}
