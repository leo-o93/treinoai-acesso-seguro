
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
  
  // Configuração mais robusta para o OAuth
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account',
      },
      skipBrowserRedirect: false, // Garantir que o redirecionamento aconteça
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
      console.error('AÇÃO: Verificar Google Cloud Console - OAuth 2.0 Client IDs')
      console.error('VERIFICAR: Authorized JavaScript origins deve incluir:', currentOrigin)
      console.error('VERIFICAR: Authorized redirect URIs deve incluir: https://shhkccidqvvrwgxlyvqq.supabase.co/auth/v1/callback')
    } else if (error.message?.includes('redirect_uri_mismatch')) {
      console.error('DIAGNÓSTICO: URL de redirecionamento não corresponde às configurações')
      console.error('AÇÃO: Verificar se a URL de callback está correta no Google Cloud Console')
    } else if (error.message?.includes('invalid_request')) {
      console.error('DIAGNÓSTICO: Parâmetros da requisição inválidos')
      console.error('AÇÃO: Verificar configuração do Client ID no Supabase')
    } else if (error.message?.includes('popup_blocked')) {
      console.error('DIAGNÓSTICO: Popup bloqueado pelo navegador')
      console.error('AÇÃO: Tentar novamente ou desabilitar bloqueador de popup')
    }
  } else {
    console.log('=== OAUTH INICIADO COM SUCESSO ===')
    console.log('Data retornada:', data)
    console.log('URL de redirecionamento que será usada:', data?.url)
    console.log('Provider:', data?.provider)
    console.log('Redirecionando para Google...')
    
    // Verificar se a URL de redirecionamento está correta
    if (data?.url) {
      console.log('=== ANÁLISE DA URL DE REDIRECIONAMENTO ===')
      try {
        const redirectUrlObj = new URL(data.url)
        console.log('Host de redirecionamento:', redirectUrlObj.host)
        console.log('Path de redirecionamento:', redirectUrlObj.pathname)
        console.log('Parâmetros de redirecionamento:', redirectUrlObj.searchParams.toString())
        
        if (!redirectUrlObj.host.includes('google') && !redirectUrlObj.host.includes('accounts')) {
          console.warn('AVISO: URL de redirecionamento não parece ser do Google')
        }
      } catch (urlError) {
        console.error('Erro ao analisar URL de redirecionamento:', urlError)
      }
    }
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
