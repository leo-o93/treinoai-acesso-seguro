
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Se as variáveis não estão configuradas, mostrar um placeholder
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL e/ou Anon Key não configurados. Por favor, configure as variáveis de ambiente.')
}

// Usar valores placeholder se as variáveis não estiverem configuradas
const finalUrl = supabaseUrl || 'https://placeholder.supabase.co'
const finalKey = supabaseAnonKey || 'placeholder-anon-key'

export const supabase = createClient(finalUrl, finalKey)

export const signUp = async (email: string, password: string, name: string) => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return { 
      data: null, 
      error: { message: 'Supabase não configurado. Configure as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.' } 
    }
  }

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
  if (!supabaseUrl || !supabaseAnonKey) {
    return { 
      data: null, 
      error: { message: 'Supabase não configurado. Configure as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.' } 
    }
  }

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
  if (!supabaseUrl || !supabaseAnonKey) {
    return { 
      data: null, 
      error: { message: 'Supabase não configurado. Configure as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.' } 
    }
  }

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  return { data, error }
}

export const signInWithGoogle = async () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return { 
      data: null, 
      error: { message: 'Supabase não configurado. Configure as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.' } 
    }
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/dashboard`,
    },
  })
  return { data, error }
}

export const signInWithApple = async () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return { 
      data: null, 
      error: { message: 'Supabase não configurado. Configure as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.' } 
    }
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: `${window.location.origin}/dashboard`,
    },
  })
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
