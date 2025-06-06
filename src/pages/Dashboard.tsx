
import React from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { useAuth } from '@/hooks/useAuth'
import { Navigate } from 'react-router-dom'
import { EnhancedActivePlans } from '@/components/dashboard/EnhancedActivePlans'
import AIChat from '@/components/dashboard/AIChat'

const Dashboard = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto py-8">
          <div className="animate-pulse text-muted-foreground">Carregando...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Bem-vindo de volta! 👋
          </h1>
          <p className="text-muted-foreground">
            Acompanhe seu progresso e gerencie seus planos personalizados
          </p>
        </div>

        <div className="space-y-8">
          {/* Planos Ativos */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-6">Seus Planos</h2>
            <EnhancedActivePlans />
          </section>

          {/* Chat IA */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-6">
              Assistente IA Personalizado
            </h2>
            <AIChat />
          </section>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
