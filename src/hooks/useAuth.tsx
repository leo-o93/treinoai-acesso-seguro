
import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { User, Session } from '@supabase/supabase-js'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('=== INICIANDO useAuth ===')
    console.log('URL atual no useAuth:', window.location.href)
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('=== EVENTO DE AUTENTICAÇÃO ===')
        console.log('Evento:', event)
        console.log('Sessão:', session ? {
          user_id: session.user?.id,
          email: session.user?.email,
          provider: session.user?.app_metadata?.provider
        } : null)
        
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        
        // Se o usuário fez login via OAuth, pode estar vindo de redirecionamento
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('Login detectado, usuário autenticado:', session.user.email)
        }
      }
    )

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('=== SESSÃO INICIAL ===')
      console.log('Sessão encontrada:', session ? {
        user_id: session.user?.id,
        email: session.user?.email,
        provider: session.user?.app_metadata?.provider
      } : 'Nenhuma sessão ativa')
      
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      console.log('=== REMOVENDO LISTENER useAuth ===')
      subscription.unsubscribe()
    }
  }, [])

  return { user, session, loading }
}
