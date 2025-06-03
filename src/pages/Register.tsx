
import React from 'react'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { SignUp } from '@/components/auth/SignUp'

const Register = () => {
  return (
    <AuthLayout
      title="Crie sua conta"
      subtitle="Comece sua jornada fitness hoje"
    >
      <SignUp />
    </AuthLayout>
  )
}

export default Register
