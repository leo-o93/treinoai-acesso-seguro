
import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Navbar } from '@/components/layout/Navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const IntegracaoCallback = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [provider, setProvider] = useState('')

  useEffect(() => {
    const success = searchParams.get('success')
    const error = searchParams.get('error')
    const details = searchParams.get('details')

    console.log('=== CALLBACK PAGE ===')
    console.log('Success:', success)
    console.log('Error:', error)
    console.log('Details:', details)

    if (success === 'google_connected') {
      setStatus('success')
      setProvider('Google Calendar')
      setMessage('Google Calendar foi conectado com sucesso! Você agora pode sincronizar seus treinos com o calendário.')
      toast.success('Google Calendar conectado com sucesso!')
    } else if (success === 'strava_connected') {
      setStatus('success')
      setProvider('Strava')
      setMessage('Strava foi conectado com sucesso! Você agora pode importar suas atividades e dados de performance.')
      toast.success('Strava conectado com sucesso!')
    } else if (error) {
      setStatus('error')
      
      const errorMessages: { [key: string]: string } = {
        'access_denied': 'Acesso negado pelo usuário. Você cancelou a autorização.',
        'invalid_callback': 'Erro no callback de autenticação. Tente novamente.',
        'token_exchange_failed': 'Falha ao trocar tokens de acesso. Verifique suas credenciais.',
        'database_error': 'Erro ao salvar integração no banco de dados. Tente novamente.',
        'configuration_error': 'Erro de configuração do OAuth. Entre em contato com o suporte.',
        'internal_error': 'Erro interno do servidor. Tente novamente mais tarde.'
      }
      
      let errorMessage = errorMessages[error] || 'Erro desconhecido na integração'
      if (details) {
        errorMessage += `: ${details}`
      }
      
      setMessage(errorMessage)
      console.error('Erro na integração:', error, details)
      toast.error(`Erro na integração: ${errorMessage}`)
    } else {
      setStatus('error')
      setMessage('Nenhum status de integração foi encontrado.')
    }

    // Redirecionar automaticamente após 5 segundos
    const timer = setTimeout(() => {
      navigate('/integracoes')
    }, 5000)

    return () => clearTimeout(timer)
  }, [searchParams, navigate])

  const handleGoBack = () => {
    navigate('/integracoes')
  }

  const getIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-500" />
      case 'error':
        return <XCircle className="h-16 w-16 text-red-500" />
    }
  }

  const getTitle = () => {
    switch (status) {
      case 'loading':
        return 'Processando integração...'
      case 'success':
        return `${provider} Conectado!`
      case 'error':
        return 'Erro na Integração'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center">
            <CardHeader className="pb-4">
              <div className="flex justify-center mb-4">
                {getIcon()}
              </div>
              <CardTitle className="text-2xl">
                {getTitle()}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-gray-600 text-lg">
                {message}
              </p>
              
              {status === 'success' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-medium text-green-800 mb-2">Próximos passos:</h3>
                  <ul className="text-green-700 text-sm space-y-1 list-disc list-inside">
                    <li>Vá para a página de integrações para ver o status</li>
                    <li>Configure suas preferências de sincronização</li>
                    <li>Comece a usar os dados importados</li>
                  </ul>
                </div>
              )}

              {status === 'error' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-medium text-red-800 mb-2">O que você pode fazer:</h3>
                  <ul className="text-red-700 text-sm space-y-1 list-disc list-inside">
                    <li>Tente conectar novamente</li>
                    <li>Verifique suas permissões na conta</li>
                    <li>Entre em contato com o suporte se o problema persistir</li>
                  </ul>
                </div>
              )}

              <div className="flex gap-4 justify-center">
                <Button onClick={handleGoBack} className="px-8">
                  Voltar para Integrações
                </Button>
              </div>

              <p className="text-sm text-gray-500">
                Você será redirecionado automaticamente em alguns segundos...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default IntegracaoCallback
