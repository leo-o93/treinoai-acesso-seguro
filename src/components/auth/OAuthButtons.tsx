
import React from 'react'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { signInWithGoogle } from '@/lib/supabase'

interface OAuthButtonsProps {
  disabled?: boolean
}

const OAuthButtons: React.FC<OAuthButtonsProps> = ({ disabled = false }) => {
  const handleGoogleSignIn = async () => {
    try {
      console.log('=== INÍCIO DO LOGIN GOOGLE ===')
      console.log('URL da aplicação:', window.location.href)
      console.log('Origin atual:', window.location.origin)
      console.log('Timestamp:', new Date().toISOString())
      console.log('Botão disabled:', disabled)
      
      const { data, error } = await signInWithGoogle()
      
      if (error) {
        console.error('=== ERRO NO LOGIN GOOGLE ===')
        console.error('Erro completo:', error)
        
        let errorMessage = 'Erro ao conectar com o Google.'
        
        if (error.message?.includes('unauthorized_client')) {
          errorMessage = 'Configuração OAuth incorreta. Verifique as URLs autorizadas no Google Cloud Console.'
        } else if (error.message?.includes('redirect_uri_mismatch')) {
          errorMessage = 'URL de redirecionamento não autorizada. Verifique as configurações no Google Cloud Console.'
        } else if (error.message?.includes('access_denied')) {
          errorMessage = 'Acesso negado pelo usuário.'
        } else if (error.message?.includes('invalid_request')) {
          errorMessage = 'Requisição inválida. Verifique as configurações do OAuth.'
        } else if (error.message?.includes('Usuário já está autenticado')) {
          errorMessage = 'Você já está logado.'
        } else if (error.message) {
          errorMessage = error.message
        }
        
        console.error('Mensagem de erro para o usuário:', errorMessage)
        
        toast({
          title: 'Erro ao fazer login com Google',
          description: errorMessage,
          variant: 'destructive',
        })
        return
      }

      console.log('=== SUCESSO - REDIRECIONANDO PARA GOOGLE ===')
      console.log('Data do Supabase:', data)
      console.log('URL para redirecionamento:', data?.url)
      
      // Mostrar feedback ao usuário
      toast({
        title: 'Redirecionando...',
        description: 'Você será redirecionado para o Google.',
      })
      
      // Log adicional para debug
      console.log('=== PROCESSO DE REDIRECIONAMENTO ===')
      console.log('window.location será alterado para:', data?.url)
      
    } catch (error) {
      console.error('=== ERRO INESPERADO ===')
      console.error('Erro capturado:', error)
      console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A')
      console.error('Timestamp do erro:', new Date().toISOString())
      
      toast({
        title: 'Erro inesperado',
        description: 'Falha na comunicação com o servidor de autenticação.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="mt-4">
      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleSignIn}
        disabled={disabled}
        className="w-full h-11"
      >
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continuar com Google
      </Button>
    </div>
  )
}

export default OAuthButtons
