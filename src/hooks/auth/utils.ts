
export const hasOAuthParams = (url: string) => {
  const urlParams = new URLSearchParams(url)
  return urlParams.has('code') || urlParams.has('access_token') || urlParams.has('error')
}

export const hasFragmentParams = (fragment: string) => {
  return fragment.includes('access_token') || fragment.includes('error')
}

export const logOAuthCallback = () => {
  console.log('=== CALLBACK OAUTH DETECTADO ===')
  console.log('Processando callback OAuth...')
}

export const logAuthEvent = (event: string, session: any) => {
  console.log('=== EVENTO DE AUTENTICAÇÃO ===')
  console.log('Evento:', event)
  console.log('URL no momento do evento:', window.location.href)
  console.log('Timestamp:', new Date().toISOString())
  console.log('Sessão recebida:', session ? {
    user_id: session.user?.id,
    email: session.user?.email,
    provider: session.user?.app_metadata?.provider,
    expires_at: session.expires_at,
    access_token: session.access_token ? 'presente' : 'ausente',
    refresh_token: session.refresh_token ? 'presente' : 'ausente'
  } : null)
}

export const clearOAuthParams = () => {
  console.log('=== LIMPANDO PARÂMETROS OAUTH ===')
  window.history.replaceState({}, document.title, '/login')
}
