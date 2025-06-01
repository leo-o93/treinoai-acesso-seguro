
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
  console.log('User-Agent:', navigator.userAgent)
  console.log('Timestamp:', new Date().toISOString())
  
  // Verificar se já existe uma sessão antes de tentar OAuth
  const { data: { session: existingSession } } = await supabase.auth.getSession()
  if (existingSession) {
    console.log('=== SESSÃO EXISTENTE DETECTADA ===')
    console.log('Usuário já está logado:', existingSession.user?.email)
    return { data: null, error: { message: 'Usuário já está autenticado' } }
  }
  
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
    console.error('Timestamp do erro:', new Date().toISOString())
    
    // Log configurações necessárias
    console.log('=== CONFIGURAÇÕES NECESSÁRIAS ===')
    console.log('Google Cloud Console - Authorized JavaScript origins:', currentOrigin)
    console.log('Google Cloud Console - Authorized redirect URIs: https://shhkccidqvvrwgxlyvqq.supabase.co/auth/v1/callback')
    console.log('Supabase Site URL:', currentOrigin)
    console.log('Supabase Redirect URLs:', `${currentOrigin}/**`)
    
    // Análise detalhada do erro
    if (error.message?.includes('unauthorized_client')) {
      console.error('DIAGNÓSTICO: Client ID não autorizado ou URLs não configuradas')
    } else if (error.message?.includes('redirect_uri_mismatch')) {
      console.error('DIAGNÓSTICO: URL de redirecionamento não corresponde às configurações')
    } else if (error.message?.includes('invalid_request')) {
      console.error('DIAGNÓSTICO: Parâmetros da requisição inválidos')
    }
  } else {
    console.log('=== OAUTH INICIADO COM SUCESSO ===')
    console.log('Data retornada:', data)
    console.log('URL de redirecionamento que será usada:', data?.url)
    console.log('Provider:', data?.provider)
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
