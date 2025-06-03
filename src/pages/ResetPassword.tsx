
import React from 'react'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { ResetPassword as ResetPasswordComponent } from '@/components/auth/ResetPassword'

const ResetPassword = () => {
  return (
    <AuthLayout
      title="Redefinir senha"
      subtitle="Digite seu email para receber as instruções"
    >
      <ResetPasswordComponent />
    </AuthLayout>
  )
}

export default ResetPassword
