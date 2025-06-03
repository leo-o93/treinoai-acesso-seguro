
import React from 'react'
import AuthLayout from '@/components/auth/AuthLayout'
import SignIn from '@/components/auth/SignIn'

const Login = () => {
  return (
    <AuthLayout
      title="Bem-vindo de volta"
      subtitle="Entre na sua conta para continuar"
    >
      <SignIn />
    </AuthLayout>
  )
}

export default Login
