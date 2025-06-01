
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
    console.log('Pathname:', window.location.pathname)
    console.log('Search params:', window.location.search)
    console.log('Hash:', window.location.hash)
    
    // Verificar se há parâmetros OAuth na URL
    const urlParams = new URLSearchParams(window.location.search)
    const hasOAuthParams = urlParams.has('code') || urlParams.has('access_token') || urlParams.has('error')
    const fragment = window.location.hash
    const hasFragmentParams = fragment.includes('access_token') || fragment.includes('error')
    
    console.log('=== VERIFICAÇÃO DE PARÂMETROS OAUTH ===')
    console.log('Parâmetros de busca encontrados:', Object.fromEntries(urlParams.entries()))
    console.log('Fragment da URL:', fragment)
    console.log('Tem parâmetros OAuth na query:', hasOAuthParams)
    console.log('Tem parâmetros OAuth no fragment:', hasFragmentParams)
    
    if (hasOAuthParams || hasFragmentParams) {
      console.log('=== CALLBACK OAUTH DETECTADO ===')
      console.log('Processando callback OAuth...')
      
      // Se há erro nos parâmetros
      if (urlParams.has('error') || fragment.includes('error')) {
        console.error('=== ERRO NO CALLBACK OAUTH ===')
        console.error('Erro na query:', urlParams.get('error'))
        console.error('Descrição:', urlParams.get('error_description'))
        console.error('Fragment com erro:', fragment)
      }
    }
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('=== EVENTO DE AUTENTICAÇÃO ===')
        console.log('Evento:', event)
        console.log('URL no momento do evento:', window.location.href)
        console.log('Sessão recebida:', session ? {
          user_id: session.user?.id,
          email: session.user?.email,
          provider: session.user?.app_metadata?.provider,
          expires_at: session.expires_at,
          access_token: session.access_token ? 'presente' : 'ausente',
          refresh_token: session.refresh_token ? 'presente' : 'ausente'
        } : null)
        
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        
        // Se o usuário fez login via OAuth e está na página de login, redirecionar
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('=== LOGIN DETECTADO ===')
          console.log('Usuário autenticado:', session.user.email)
          console.log('Provider:', session.user.app_metadata?.provider)
          console.log('Pathname atual:', window.location.pathname)
          
          // Se estamos na página de login, redirecionar para dashboard
          if (window.location.pathname === '/login') {
            console.log('=== REDIRECIONANDO PARA DASHBOARD ===')
            console.log('Limpando parâmetros OAuth da URL...')
            
            // Limpar parâmetros OAuth da URL antes de redirecionar
            if (hasOAuthParams || hasFragmentParams) {
              window.history.replaceState({}, document.title, '/login')
            }
            
            setTimeout(() => {
              console.log('Executando redirecionamento para /dashboard')
              navigate('/dashboard', { replace: true })
            }, 100)
          }
        }
        
        // Se o usuário fez logout
        if (event === 'SIGNED_OUT') {
          console.log('=== LOGOUT DETECTADO ===')
          // Limpar a URL se houver parâmetros OAuth
          if (hasOAuthParams || hasFragmentParams) {
            window.history.replaceState({}, document.title, window.location.pathname)
          }
        }
        
        // Log específico para token refresh
        if (event === 'TOKEN_REFRESHED') {
          console.log('=== TOKEN RENOVADO ===')
          console.log('Nova sessão após refresh:', session ? 'válida' : 'inválida')
        }
        
        // Log para eventos de erro
        if (event === 'SIGNED_OUT' && !session) {
          console.log('=== POSSÍVEL ERRO DE AUTENTICAÇÃO ===')
          console.log('Usuário foi deslogado, possivelmente devido a erro')
        }
      }
    )

    // Get initial session
    console.log('=== VERIFICANDO SESSÃO INICIAL ===')
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('Resposta getSession:', { session: session ? 'presente' : 'ausente', error })
      
      if (error) {
        console.error('=== ERRO AO OBTER SESSÃO INICIAL ===')
        console.error('Erro:', error)
      }
      
      if (session) {
        console.log('=== SESSÃO INICIAL ENCONTRADA ===')
        console.log('Sessão:', {
          user_id: session.user?.id,
          email: session.user?.email,
          provider: session.user?.app_metadata?.provider,
          expires_at: session.expires_at,
          is_expired: session.expires_at ? new Date(session.expires_at * 1000) < new Date() : 'indefinido'
        })
      } else {
        console.log('=== NENHUMA SESSÃO INICIAL ENCONTRADA ===')
      }
      
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

  // Log de debug para estado atual
  console.log('=== ESTADO ATUAL useAuth ===')
  console.log('Loading:', loading)
  console.log('User:', user ? user.email : 'não autenticado')
  console.log('Session:', session ? 'ativa' : 'inativa')

  return { user, session, loading }
}
