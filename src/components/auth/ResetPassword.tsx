
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import { resetPassword } from '@/lib/supabase'
import AuthLayout from './AuthLayout'

const ResetPassword: React.FC = () => {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      toast({
        title: 'Erro',
        description: 'Por favor, digite seu email.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const { error } = await resetPassword(email)
      
      if (error) {
        toast({
          title: 'Erro ao enviar email',
          description: error.message,
          variant: 'destructive',
        })
        return
      }

      setEmailSent(true)
      toast({
        title: 'Email enviado!',
        description: 'Verifique sua caixa de entrada para redefinir sua senha.',
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro inesperado. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <AuthLayout
        title="Email Enviado"
        subtitle="Verifique sua caixa de entrada para continuar."
      >
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 3.26a2 2 0 001.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Enviamos um link para redefinir sua senha para{' '}
            <span className="font-medium text-gray-900 dark:text-white">{email}</span>
          </p>
          
          <Button
            onClick={() => setEmailSent(false)}
            variant="outline"
            className="w-full"
          >
            Enviar para outro email
          </Button>
          
          <div className="text-center">
            <Link
              to="/login"
              className="text-sm text-primary hover:text-primary-hover transition-colors"
            >
              Voltar para login
            </Link>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Redefinir Senha"
      subtitle="Digite seu email para receber o link de redefinição."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            className="h-11"
            autoComplete="email"
          />
        </div>

        <Button
          type="submit"
          className="w-full h-11 bg-primary hover:bg-primary-hover transition-colors"
          disabled={isLoading}
        >
          {isLoading ? 'Enviando...' : 'Enviar link de reset'}
        </Button>
      </form>

      <div className="text-center mt-6">
        <Link
          to="/login"
          className="text-sm text-primary hover:text-primary-hover transition-colors"
        >
          Voltar para login
        </Link>
      </div>
    </AuthLayout>
  )
}

export default ResetPassword
