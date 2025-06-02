
import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import SignIn from '@/components/auth/SignIn'
import AuthLayout from '@/components/auth/AuthLayout'

const Login = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <AuthLayout title="Entrar" subtitle="Bem-vindo de volta! Faça login em sua conta.">
      <SignIn />
    </AuthLayout>
  )
}

export default Login
