
import React from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Navbar } from '@/components/layout/Navbar'
import { CustomizableDashboard } from '@/components/dashboard/CustomizableDashboard'

const Dashboard = () => {
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
          <div className="text-center">
            <p className="text-gray-600">Você precisa estar logado para acessar o dashboard.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <CustomizableDashboard />
    </div>
  )
}

export default Dashboard
