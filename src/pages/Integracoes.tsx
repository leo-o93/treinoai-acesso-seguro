
import React, { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Navbar } from '@/components/layout/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { OAuthCard } from '@/components/integrations/OAuthCard'
import { IntegrationsList } from '@/components/integrations/IntegrationsList'
import { toast } from 'sonner'

const Integracoes = () => {
  const { user, loading } = useAuth()

  useEffect(() => {
    // Verificar parâmetros de URL para mostrar status da integração
    const urlParams = new URLSearchParams(window.location.search)
    const success = urlParams.get('success')
    const error = urlParams.get('error')

    if (success === 'google_connected') {
      toast.success('Google Calendar conectado com sucesso!')
    } else if (success === 'strava_connected') {
      toast.success('Strava conectado com sucesso!')
    } else if (error) {
      const errorMessages: { [key: string]: string } = {
        'access_denied': 'Acesso negado pelo usuário',
        'invalid_callback': 'Erro no callback de autenticação',
        'token_exchange_failed': 'Falha ao trocar tokens de acesso',
        'database_error': 'Erro ao salvar integração no banco de dados',
        'internal_error': 'Erro interno do servidor'
      }
      
      const errorMessage = errorMessages[error] || 'Erro desconhecido na integração'
      toast.error(`Erro na integração: ${errorMessage}`)
    }

    // Limpar parâmetros da URL após mostrar a mensagem
    if (success || error) {
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto py-8">
          <div className="animate-pulse">Carregando...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto py-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-600">
                Você precisa estar logado para acessar as integrações.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Integrações
            </h1>
            <p className="text-gray-600">
              Conecte suas contas para sincronizar dados de treinos e agenda
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <OAuthCard
              provider="google"
              title="Google Calendar"
              description="Sincronize seus treinos e eventos com o Google Calendar"
              icon="📅"
            />
            <OAuthCard
              provider="strava"
              title="Strava"
              description="Importe suas atividades e dados de performance"
              icon="🏃‍♂️"
            />
          </div>

          <IntegrationsList />
        </div>
      </div>
    </div>
  )
}

export default Integracoes
