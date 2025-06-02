
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Dumbbell, Utensils, Calendar, CheckCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { mcpAI } from '@/lib/mcpClient'

interface PlanGenerationCardProps {
  userProfile: any
  onPlansGenerated?: () => void
}

const PlanGenerationCard: React.FC<PlanGenerationCardProps> = ({
  userProfile,
  onPlansGenerated
}) => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [requesting, setRequesting] = useState(false)

  const isProfileComplete = userProfile && 
    userProfile.objetivo && 
    userProfile.peso && 
    userProfile.altura && 
    userProfile.frequencia_semanal &&
    userProfile.alimentos_disponiveis?.length > 0

  const requestPlans = async () => {
    if (!isProfileComplete || !user) {
      toast({
        title: 'Perfil incompleto',
        description: 'Complete seu perfil primeiro para solicitar os planos',
        variant: 'destructive'
      })
      return
    }

    setRequesting(true)

    try {
      // Just send request to AI agent - don't generate locally
      console.log('🤖 Solicitando planos ao agente IA...')
      
      const request = {
        userId: user.id,
        profile: userProfile,
        requestType: 'complete_plans'
      }

      // The AI agent in n8n will handle the actual generation
      const result = await mcpAI.gerarPlanoCompleto(request)

      if (result.success) {
        toast({
          title: 'Solicitação enviada!',
          description: 'O agente IA está preparando seus planos personalizados'
        })
        onPlansGenerated?.()
      } else {
        throw new Error('Erro na comunicação com agente IA')
      }

    } catch (error) {
      console.error('Erro ao solicitar planos:', error)
      toast({
        title: 'Erro na solicitação',
        description: 'Não foi possível conectar com o agente IA. Tente novamente.',
        variant: 'destructive'
      })
    } finally {
      setRequesting(false)
    }
  }

  if (!isProfileComplete) {
    return (
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-blue-500" />
            Solicitar Planos Personalizados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-gray-500 mb-4">
              <p className="font-medium mb-2">Complete seu perfil primeiro</p>
              <p className="text-sm">Precisamos de algumas informações para seus planos personalizados:</p>
            </div>
            <div className="space-y-2 text-sm text-left max-w-md mx-auto">
              <div className="flex items-center gap-2">
                {userProfile?.objetivo ? <CheckCircle className="w-4 h-4 text-green-500" /> : <div className="w-4 h-4 border-2 border-gray-300 rounded" />}
                <span>Objetivo definido</span>
              </div>
              <div className="flex items-center gap-2">
                {userProfile?.peso ? <CheckCircle className="w-4 h-4 text-green-500" /> : <div className="w-4 h-4 border-2 border-gray-300 rounded" />}
                <span>Peso informado</span>
              </div>
              <div className="flex items-center gap-2">
                {userProfile?.altura ? <CheckCircle className="w-4 h-4 text-green-500" /> : <div className="w-4 h-4 border-2 border-gray-300 rounded" />}
                <span>Altura informada</span>
              </div>
              <div className="flex items-center gap-2">
                {userProfile?.frequencia_semanal ? <CheckCircle className="w-4 h-4 text-green-500" /> : <div className="w-4 h-4 border-2 border-gray-300 rounded" />}
                <span>Frequência de treino</span>
              </div>
              <div className="flex items-center gap-2">
                {userProfile?.alimentos_disponiveis?.length > 0 ? <CheckCircle className="w-4 h-4 text-green-500" /> : <div className="w-4 h-4 border-2 border-gray-300 rounded" />}
                <span>Alimentos disponíveis</span>
              </div>
            </div>
            <Button variant="outline" className="mt-4" onClick={() => window.location.href = '/perfil'}>
              Completar Perfil
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-blue-500" />
          Solicitar Planos Personalizados
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">Perfil Completo ✓</h4>
            <div className="flex flex-wrap gap-2 text-sm">
              <Badge variant="outline">{userProfile.objetivo}</Badge>
              <Badge variant="outline">{userProfile.peso}kg</Badge>
              <Badge variant="outline">{userProfile.altura}cm</Badge>
              <Badge variant="outline">{userProfile.frequencia_semanal}x/semana</Badge>
              <Badge variant="outline">{userProfile.alimentos_disponiveis?.length} alimentos</Badge>
            </div>
          </div>

          {requesting && (
            <div className="space-y-3 bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Enviando solicitação para o agente IA...
                </span>
              </div>
              <p className="text-xs text-blue-600">
                O agente irá gerar seus planos e agendar automaticamente no calendário
              </p>
            </div>
          )}

          <Button 
            onClick={requestPlans} 
            disabled={requesting}
            className="w-full"
          >
            {requesting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Solicitando...
              </>
            ) : (
              <>
                <Dumbbell className="w-4 h-4 mr-2" />
                Solicitar Planos ao Agente IA
              </>
            )}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            O agente IA criará seus planos e agendará automaticamente no Google Calendar
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default PlanGenerationCard
