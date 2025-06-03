
import React from 'react'
import AuthLayout from '@/components/auth/AuthLayout'
import ResetPassword from '@/components/auth/ResetPassword'

const ResetPasswordPage = () => {
  return (
    <AuthLayout
      title="Redefinir senha"
      subtitle="Digite seu email para receber as instruções"
    >
      <ResetPassword />
    </AuthLayout>
  )
}

export default ResetPasswordPage
