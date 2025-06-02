
import { supabase } from '@/integrations/supabase/client'

export const getCurrentUser = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Erro ao obter sessão:', error)
      return null
    }
    
    return session?.user || null
  } catch (error) {
    console.error('Erro ao obter usuário atual:', error)
    return null
  }
}
