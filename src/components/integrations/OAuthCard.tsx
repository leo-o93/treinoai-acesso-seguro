
import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useIntegrationStatus } from '@/hooks/useIntegrationStatus'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

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
  const { integration, isLoading, refetch } = useIntegrationStatus(provider)
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  const handleConnect = async () => {
    setConnecting(true)
    try {
      const { data, error } = await supabase.functions.invoke(`oauth-${provider}-start`)
      
      if (error) {
        console.error(`Erro ao iniciar OAuth ${provider}:`, error)
        toast.error(`Erro ao conectar com ${title}`)
        return
      }

      if (data?.authUrl) {
        window.location.href = data.authUrl
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
    
    setDisconnecting(true)
    try {
      const { error } = await supabase
        .from('user_integrations')
        .delete()
        .eq('id', integration.id)

      if (error) {
        console.error(`Erro ao desconectar ${provider}:`, error)
        toast.error(`Erro ao desconectar ${title}`)
        return
      }

      toast.success(`${title} desconectado com sucesso`)
      refetch()
    } catch (error) {
      console.error(`Erro inesperado ao desconectar ${provider}:`, error)
      toast.error(`Erro inesperado ao desconectar ${title}`)
    } finally {
      setDisconnecting(false)
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
                onClick={handleDisconnect}
                disabled={disconnecting || isLoading}
                variant="destructive"
                className={isTokenExpired ? 'flex-1' : 'w-full'}
              >
                {disconnecting ? 'Desconectando...' : 'Desconectar'}
              </Button>
            </>
          )}
        </div>
        
        {isConnected && integration.created_at && (
          <p className="text-sm text-gray-500 mt-2">
            Conectado em {new Date(integration.created_at).toLocaleDateString('pt-BR')}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
