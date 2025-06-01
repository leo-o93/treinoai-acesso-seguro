
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { User, Session } from '@supabase/supabase-js'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    console.log('=== INICIANDO useAuth ===')
    console.log('URL atual no useAuth:', window.location.href)
    console.log('Parâmetros da URL:', window.location.search)
    
    // Verificar se há parâmetros OAuth na URL
    const urlParams = new URLSearchParams(window.location.search)
    const hasOAuthParams = urlParams.has('code') || urlParams.has('access_token') || urlParams.has('error')
    
    if (hasOAuthParams) {
      console.log('=== CALLBACK OAUTH DETECTADO ===')
      console.log('Parâmetros OAuth encontrados na URL')
      
      // Se há erro nos parâmetros
      if (urlParams.has('error')) {
        console.error('=== ERRO NO CALLBACK OAUTH ===')
        console.error('Erro:', urlParams.get('error'))
        console.error('Descrição:', urlParams.get('error_description'))
      }
    }
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('=== EVENTO DE AUTENTICAÇÃO ===')
        console.log('Evento:', event)
        console.log('Sessão:', session ? {
          user_id: session.user?.id,
          email: session.user?.email,
          provider: session.user?.app_metadata?.provider,
          expires_at: session.expires_at
        } : null)
        
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        
        // Se o usuário fez login via OAuth e está na página de login, redirecionar
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('=== LOGIN DETECTADO ===')
          console.log('Usuário autenticado:', session.user.email)
          console.log('Provider:', session.user.app_metadata?.provider)
          
          // Se estamos na página de login, redirecionar para dashboard
          if (window.location.pathname === '/login') {
            console.log('=== REDIRECIONANDO PARA DASHBOARD ===')
            navigate('/dashboard', { replace: true })
          }
        }
        
        // Se o usuário fez logout
        if (event === 'SIGNED_OUT') {
          console.log('=== LOGOUT DETECTADO ===')
          // Limpar a URL se houver parâmetros OAuth
          if (hasOAuthParams) {
            window.history.replaceState({}, document.title, window.location.pathname)
          }
        }
      }
    )

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('=== SESSÃO INICIAL ===')
      console.log('Sessão encontrada:', session ? {
        user_id: session.user?.id,
        email: session.user?.email,
        provider: session.user?.app_metadata?.provider,
        expires_at: session.expires_at
      } : 'Nenhuma sessão ativa')
      
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      
      // Se já tem sessão ativa e está na página de login, redirecionar
      if (session?.user && window.location.pathname === '/login') {
        console.log('=== USUÁRIO JÁ AUTENTICADO - REDIRECIONANDO ===')
        navigate('/dashboard', { replace: true })
      }
    })

    return () => {
      console.log('=== REMOVENDO LISTENER useAuth ===')
      subscription.unsubscribe()
    }
  }, [navigate])

  return { user, session, loading }
}
