
import { supabase } from '@/integrations/supabase/client'

export const signUp = async (email: string, password: string, name: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  })
  return { data, error }
}

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const resetPassword = async (email: string) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  return { data, error }
}

export const signInWithGoogle = async () => {
  const currentOrigin = window.location.origin
  const redirectUrl = `${currentOrigin}/login`
  
  console.log('=== CONFIGURAÇÃO GOOGLE OAUTH ===')
  console.log('Origin detectado:', currentOrigin)
  console.log('URL de redirecionamento:', redirectUrl)
  console.log('URL atual:', window.location.href)
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account',
      },
    },
  })
  
  if (error) {
    console.error('=== ERRO GOOGLE OAUTH ===')
    console.error('Erro completo:', error)
    console.error('Message:', error.message)
    console.error('Status:', error.status)
    
    // Log configurações necessárias
    console.log('=== CONFIGURAÇÕES NECESSÁRIAS ===')
    console.log('Google Cloud Console - Authorized JavaScript origins:', currentOrigin)
    console.log('Google Cloud Console - Authorized redirect URIs: https://shhkccidqvvrwgxlyvqq.supabase.co/auth/v1/callback')
    console.log('Supabase Site URL:', currentOrigin)
    console.log('Supabase Redirect URLs:', `${currentOrigin}/**`)
  } else {
    console.log('=== OAUTH INICIADO COM SUCESSO ===')
    console.log('Data:', data)
    console.log('Redirecionando para Google...')
  }
  
  return { data, error }
}

export const getCurrentSession = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Re-exportar o cliente para compatibilidade
export { supabase }
