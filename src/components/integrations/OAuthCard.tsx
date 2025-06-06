
import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useIntegrationStatus } from '@/hooks/useIntegrationStatus'
import { useIntegrationsAPI } from '@/hooks/useIntegrationsAPI'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { RefreshCw } from 'lucide-react'

interface OAuthCardProps {
  provider: 'google' | 'strava'
  title: string
  description: string
  icon: string
}

export const OAuthCard: React.FC<OAuthCardProps> = ({
  provider,
  title,
  description,
  icon
}) => {
  const { user } = useAuth()
  const { integration, isLoading, refetch } = useIntegrationStatus(provider)
  const { disconnect, isDisconnecting, refreshTokens, isRefreshing } = useIntegrationsAPI(user?.id)
  const [connecting, setConnecting] = useState(false)

  // Habilitar Strava agora
  const isProviderEnabled = true // Removendo a desabilitação do Strava

  if (!isProviderEnabled && provider === 'strava') {
    return (
      <Card className="opacity-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{icon}</span>
              <div>
                <CardTitle className="text-lg">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </div>
            </div>
            <Badge variant="secondary">Em breve</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Button disabled className="w-full">
            Integração em desenvolvimento
          </Button>
        </CardContent>
      </Card>
    )
  }

  const handleConnect = async () => {
    setConnecting(true)
    try {
      console.log(`=== INICIANDO CONEXÃO ${provider.toUpperCase()} ===`)
      
      const { data, error } = await supabase.functions.invoke(`oauth-${provider}-start`)
      
      console.log('Response data:', data)
      console.log('Response error:', error)
      
      if (error) {
        console.error(`Erro ao iniciar OAuth ${provider}:`, error)
        
        if (error.message?.includes('configuration')) {
          toast.error('Erro de configuração. Entre em contato com o suporte.')
        } else {
          toast.error(`Erro ao conectar com ${title}: ${error.message}`)
        }
        return
      }

      if (data?.authUrl) {
        console.log('Redirecionando para:', data.authUrl)
        window.location.href = data.authUrl
      } else {
        console.error('URL de autorização não retornada')
        toast.error('Erro: URL de autorização não foi gerada')
      }
    } catch (error) {
      console.error(`Erro inesperado ao conectar ${provider}:`, error)
      toast.error(`Erro inesperado ao conectar com ${title}`)
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    if (!integration) return
    
    try {
      disconnect({ provider })
      refetch()
    } catch (error) {
      console.error(`Erro inesperado ao desconectar ${provider}:`, error)
      toast.error(`Erro inesperado ao desconectar ${title}`)
    }
  }

  const handleRefreshTokens = async () => {
    try {
      refreshTokens()
      setTimeout(() => refetch(), 1000) // Aguardar um pouco antes de atualizar
    } catch (error) {
      console.error('Erro ao atualizar tokens:', error)
    }
  }

  const isConnected = !!integration
  const isTokenExpired = integration && integration.expires_at && new Date(integration.expires_at) < new Date()

  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{icon}</span>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2">
            {isConnected && (
              <Badge variant={isTokenExpired ? 'destructive' : 'default'}>
                {isTokenExpired ? 'Token Expirado' : 'Conectado'}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2">
          {!isConnected ? (
            <Button 
              onClick={handleConnect}
              disabled={connecting || isLoading}
              className="w-full"
            >
              {connecting ? 'Conectando...' : `Conectar ${title}`}
            </Button>
          ) : (
            <>
              {isTokenExpired && (
                <Button 
                  onClick={handleConnect}
                  disabled={connecting || isLoading}
                  variant="outline"
                  className="flex-1"
                >
                  {connecting ? 'Reconectando...' : 'Reconectar'}
                </Button>
              )}
              <Button 
                onClick={handleRefreshTokens}
                disabled={isRefreshing || isLoading}
                variant="outline"
                size="sm"
                className="px-3"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button 
                onClick={handleDisconnect}
                disabled={isDisconnecting || isLoading}
                variant="destructive"
                className={isTokenExpired ? 'flex-1' : 'flex-1'}
              >
                {isDisconnecting ? 'Desconectando...' : 'Desconectar'}
              </Button>
            </>
          )}
        </div>
        
        {isConnected && integration.created_at && (
          <p className="text-sm text-gray-500 mt-2">
            Conectado em {new Date(integration.created_at).toLocaleDateString('pt-BR')}
            {integration.expires_at && (
              <>
                <br />
                Expira em {new Date(integration.expires_at).toLocaleDateString('pt-BR')} às {new Date(integration.expires_at).toLocaleTimeString('pt-BR')}
              </>
            )}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
