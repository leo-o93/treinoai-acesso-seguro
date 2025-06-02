
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { User, Session } from '@supabase/supabase-js'
import { hasOAuthParams, hasFragmentParams, logOAuthCallback, logAuthEvent, clearOAuthParams } from './utils'

export const useAuthState = () => {
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
    const hasOAuthParamsInUrl = hasOAuthParams(window.location.search)
    const fragment = window.location.hash
    const hasFragmentParamsInUrl = hasFragmentParams(fragment)
    
    console.log('=== VERIFICAÇÃO DE PARÂMETROS OAUTH ===')
    console.log('Parâmetros de busca encontrados:', Object.fromEntries(urlParams.entries()))
    console.log('Fragment da URL:', fragment)
    console.log('Tem parâmetros OAuth na query:', hasOAuthParamsInUrl)
    console.log('Tem parâmetros OAuth no fragment:', hasFragmentParamsInUrl)
    
    if (hasOAuthParamsInUrl || hasFragmentParamsInUrl) {
      logOAuthCallback()
      
      // Processar callback manualmente se necessário
      if (hasFragmentParamsInUrl) {
        console.log('=== PROCESSANDO FRAGMENT PARAMS ===')
        const hashParams = new URLSearchParams(fragment.substring(1))
        console.log('Parâmetros do hash:', Object.fromEntries(hashParams.entries()))
        
        if (hashParams.has('access_token')) {
          console.log('Access token encontrado no fragment')
        }
        if (hashParams.has('error')) {
          console.error('Erro encontrado no fragment:', hashParams.get('error'))
          console.error('Descrição do erro:', hashParams.get('error_description'))
        }
      }
      
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
        logAuthEvent(event, session)
        
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        
        // Se o usuário fez login via OAuth e está na página de login, redirecionar
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('=== LOGIN DETECTADO ===')
          console.log('Usuário autenticado:', session.user.email)
          console.log('Provider:', session.user.app_metadata?.provider)
          console.log('Pathname atual:', window.location.pathname)
          
          // Limpar URL de parâmetros OAuth antes de redirecionar
          if (hasOAuthParamsInUrl || hasFragmentParamsInUrl) {
            clearOAuthParams()
          }
          
          // Se estamos na página de login, redirecionar para dashboard
          if (window.location.pathname === '/login') {
            console.log('=== REDIRECIONANDO PARA DASHBOARD ===')
            
            setTimeout(() => {
              console.log('Executando redirecionamento para /dashboard')
              navigate('/dashboard', { replace: true })
            }, 500)
          }
        }
        
        // Se o usuário fez logout
        if (event === 'SIGNED_OUT') {
          console.log('=== LOGOUT DETECTADO ===')
          // Limpar a URL se houver parâmetros OAuth
          if (hasOAuthParamsInUrl || hasFragmentParamsInUrl) {
            window.history.replaceState({}, document.title, window.location.pathname)
          }
        }
        
        // Log específico para token refresh
        if (event === 'TOKEN_REFRESHED') {
          console.log('=== TOKEN RENOVADO ===')
          console.log('Nova sessão após refresh:', session ? 'válida' : 'inválida')
        }
        
        // Log para eventos de erro ou problemas de autenticação
        if (event === 'SIGNED_OUT' && !session && window.location.search.includes('error')) {
          console.log('=== POSSÍVEL ERRO DE AUTENTICAÇÃO ===')
          console.log('Usuário foi deslogado devido a erro de OAuth')
          
          // Limpar parâmetros de erro da URL
          const cleanUrl = window.location.pathname
          window.history.replaceState({}, document.title, cleanUrl)
        }
      }
    )

    // Get initial session com timeout mais longo
    console.log('=== VERIFICANDO SESSÃO INICIAL ===')
    const checkSession = async () => {
      try {
        console.log('Chamando getSession...')
        const { data: { session }, error } = await supabase.auth.getSession()
        console.log('Resposta getSession:', { 
          session: session ? 'presente' : 'ausente', 
          error: error ? error.message : 'nenhum erro'
        })
        
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
          
          // Se há parâmetros OAuth mas não há sessão, algo deu errado
          if (hasOAuthParamsInUrl || hasFragmentParamsInUrl) {
            console.error('=== PROBLEMA NO CALLBACK ===')
            console.error('Parâmetros OAuth presentes mas nenhuma sessão encontrada')
            console.error('Isso indica que o callback OAuth não foi processado corretamente')
          }
        }
        
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        
        // Se já tem sessão ativa e está na página de login, redirecionar
        if (session?.user && window.location.pathname === '/login') {
          console.log('=== USUÁRIO JÁ AUTENTICADO - REDIRECIONANDO ===')
          navigate('/dashboard', { replace: true })
        }
      } catch (err) {
        console.error('=== ERRO INESPERADO AO VERIFICAR SESSÃO ===')
        console.error('Erro:', err)
        setLoading(false)
      }
    }
    
    // Aguardar um pouco antes de verificar a sessão para dar tempo do callback ser processado
    const timeoutId = setTimeout(checkSession, 1000)

    return () => {
      console.log('=== REMOVENDO LISTENER useAuth ===')
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [navigate])

  const signOut = async () => {
    console.log('=== INICIANDO SIGN OUT ===')
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Erro ao fazer logout:', error)
        throw error
      }
      console.log('=== SIGN OUT REALIZADO COM SUCESSO ===')
      navigate('/login', { replace: true })
    } catch (error) {
      console.error('Erro durante signOut:', error)
    }
  }

  // Log de debug para estado atual
  console.log('=== ESTADO ATUAL useAuth ===')
  console.log('Loading:', loading)
  console.log('User:', user ? user.email : 'não autenticado')
  console.log('Session:', session ? 'ativa' : 'inativa')

  return { user, session, loading, signOut }
}
