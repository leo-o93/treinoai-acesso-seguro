
import React from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Navbar } from '@/components/layout/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { OAuthCard } from '@/components/integrations/OAuthCard'
import { IntegrationsList } from '@/components/integrations/IntegrationsList'

const Integracoes = () => {
  const { user, loading } = useAuth()

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
