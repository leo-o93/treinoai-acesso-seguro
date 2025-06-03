
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

const UpdatePassword = () => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { updatePassword } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }

    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres')
      return
    }

    setLoading(true)

    try {
      await updatePassword(password)
      toast.success('Senha atualizada com sucesso!')
      navigate('/dashboard')
    } catch (error) {
      console.error('Erro ao atualizar senha:', error)
      toast.error('Erro ao atualizar senha. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Atualizar senha"
      subtitle="Digite sua nova senha"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="password">Nova senha</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Digite sua nova senha"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="confirmPassword">Confirmar senha</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirme sua nova senha"
            required
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Atualizando...' : 'Atualizar Senha'}
        </Button>
      </form>
    </AuthLayout>
  )
}

export default UpdatePassword
