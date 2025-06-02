
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export const IntegrationsList = () => {
  const { data: integrations, isLoading } = useQuery({
    queryKey: ['user-integrations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_integrations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar integrações:', error)
        throw error
      }

      return data
    }
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Integrações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">Carregando...</div>
        </CardContent>
      </Card>
    )
  }

  if (!integrations || integrations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Integrações</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">
            Nenhuma integração configurada ainda.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Integrações</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {integrations.map((integration) => {
            const isExpired = integration.expires_at && new Date(integration.expires_at) < new Date()
            
            return (
              <div key={integration.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">
                    {integration.provider === 'google' ? '📅' : '🏃‍♂️'}
                  </span>
                  <div>
                    <p className="font-medium">
                      {integration.provider === 'google' ? 'Google Calendar' : 'Strava'}
                    </p>
                    <p className="text-sm text-gray-500">
                      Conectado em {new Date(integration.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={isExpired ? 'destructive' : 'default'}>
                    {isExpired ? 'Expirado' : 'Ativo'}
                  </Badge>
                  {integration.athlete_id && (
                    <Badge variant="outline">
                      ID: {integration.athlete_id}
                    </Badge>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
