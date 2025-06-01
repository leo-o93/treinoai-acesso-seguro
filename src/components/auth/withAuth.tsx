
import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { getCurrentSession } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'

const withAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>
): React.FC<P> => {
  const AuthenticatedComponent: React.FC<P> = (props) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
      const checkAuth = async () => {
        try {
          const session = await getCurrentSession()
          setIsAuthenticated(!!session)
          
          if (!session) {
            toast({
              title: 'Acesso negado',
              description: 'Você precisa fazer login para acessar esta página.',
              variant: 'destructive',
            })
          }
        } catch (error) {
          console.error('Erro ao verificar autenticação:', error)
          setIsAuthenticated(false)
        } finally {
          setIsLoading(false)
        }
      }

      checkAuth()
    }, [])

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse">
              <svg
                className="w-7 h-7 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <p className="text-gray-600">Verificando autenticação...</p>
          </div>
        </div>
      )
    }

    if (isAuthenticated === false) {
      return <Navigate to="/login" replace />
    }

    return <WrappedComponent {...props} />
  }

  return AuthenticatedComponent
}

export default withAuth
