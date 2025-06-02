
import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import AuthLayout from '@/components/auth/AuthLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const UpdatePassword = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <AuthLayout title="Atualizar Senha" subtitle="Altere sua senha de acesso.">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Atualizar Senha</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Funcionalidade de atualização de senha em desenvolvimento.
          </p>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}

export default UpdatePassword
