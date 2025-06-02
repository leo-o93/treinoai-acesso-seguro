
import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const profileSchema = z.object({
  objetivo: z.string().min(1, 'Objetivo é obrigatório'),
  prazo: z.number().min(1, 'Prazo deve ser maior que 0'),
  peso: z.number().min(1, 'Peso é obrigatório'),
  altura: z.number().min(1, 'Altura é obrigatória'),
  age: z.number().min(1, 'Idade é obrigatória'),
  frequencia_semanal: z.number().min(1, 'Frequência semanal é obrigatória'),
  alimentos_disponiveis: z.array(z.string()).min(1, 'Pelo menos um alimento deve ser informado'),
  restricoes_alimentares: z.array(z.string()).optional(),
  experience_level: z.string().min(1, 'Nível de experiência é obrigatório'),
  hobby_activity: z.string().optional(),
  hobby_frequency: z.number().optional()
})

type ProfileFormData = z.infer<typeof profileSchema>

interface CompleteProfileFormProps {
  initialData?: Partial<ProfileFormData>
  onSubmit: (data: ProfileFormData) => Promise<void>
  onConfirm?: (data: ProfileFormData) => void
}

const CompleteProfileForm: React.FC<CompleteProfileFormProps> = ({
  initialData,
  onSubmit,
  onConfirm
}) => {
  const { toast } = useToast()
  const [newAlimento, setNewAlimento] = React.useState('')
  const [newRestricao, setNewRestricao] = React.useState('')
  const [showConfirmation, setShowConfirmation] = React.useState(false)
  const [formData, setFormData] = React.useState<ProfileFormData | null>(null)

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      objetivo: initialData?.objetivo || '',
      prazo: initialData?.prazo || 0,
      peso: initialData?.peso || 0,
      altura: initialData?.altura || 0,
      age: initialData?.age || 0,
      frequencia_semanal: initialData?.frequencia_semanal || 0,
      alimentos_disponiveis: initialData?.alimentos_disponiveis || [],
      restricoes_alimentares: initialData?.restricoes_alimentares || [],
      experience_level: initialData?.experience_level || '',
      hobby_activity: initialData?.hobby_activity || '',
      hobby_frequency: initialData?.hobby_frequency || 0
    }
  })

  const addAlimento = () => {
    if (newAlimento.trim()) {
      const current = form.getValues('alimentos_disponiveis')
      form.setValue('alimentos_disponiveis', [...current, newAlimento.trim()])
      setNewAlimento('')
    }
  }

  const removeAlimento = (index: number) => {
    const current = form.getValues('alimentos_disponiveis')
    form.setValue('alimentos_disponiveis', current.filter((_, i) => i !== index))
  }

  const addRestricao = () => {
    if (newRestricao.trim()) {
      const current = form.getValues('restricoes_alimentares') || []
      form.setValue('restricoes_alimentares', [...current, newRestricao.trim()])
      setNewRestricao('')
    }
  }

  const removeRestricao = (index: number) => {
    const current = form.getValues('restricoes_alimentares') || []
    form.setValue('restricoes_alimentares', current.filter((_, i) => i !== index))
  }

  const handleFormSubmit = async (data: ProfileFormData) => {
    setFormData(data)
    setShowConfirmation(true)
  }

  const confirmAndSubmit = async () => {
    if (!formData) return

    try {
      await onSubmit(formData)
      onConfirm?.(formData)
      setShowConfirmation(false)
      toast({
        title: 'Perfil atualizado',
        description: 'Suas informações foram salvas com sucesso!'
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o perfil',
        variant: 'destructive'
      })
    }
  }

  if (showConfirmation && formData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Confirme suas informações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg space-y-2">
            <p><strong>Objetivo:</strong> {formData.objetivo}</p>
            <p><strong>Prazo:</strong> {formData.prazo} semanas</p>
            <p><strong>Peso:</strong> {formData.peso} kg</p>
            <p><strong>Altura:</strong> {formData.altura} cm</p>
            <p><strong>Idade:</strong> {formData.age} anos</p>
            <p><strong>Frequência semanal:</strong> {formData.frequencia_semanal}x por semana</p>
            <p><strong>Nível de experiência:</strong> {formData.experience_level}</p>
            {formData.hobby_activity && (
              <p><strong>Atividade como hobby:</strong> {formData.hobby_activity} ({formData.hobby_frequency}x por semana)</p>
            )}
            <div>
              <strong>Alimentos disponíveis:</strong>
              <div className="flex flex-wrap gap-1 mt-1">
                {formData.alimentos_disponiveis.map((alimento, index) => (
                  <Badge key={index} variant="outline">{alimento}</Badge>
                ))}
              </div>
            </div>
            {formData.restricoes_alimentares && formData.restricoes_alimentares.length > 0 && (
              <div>
                <strong>Restrições alimentares:</strong>
                <div className="flex flex-wrap gap-1 mt-1">
                  {formData.restricoes_alimentares.map((restricao, index) => (
                    <Badge key={index} variant="outline" className="bg-red-50">{restricao}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={confirmAndSubmit} className="flex-1">
              Confirmar e Salvar
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmation(false)}
              className="flex-1"
            >
              Editar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="objetivo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Objetivo Principal</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione seu objetivo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="emagrecimento">Emagrecimento</SelectItem>
                        <SelectItem value="hipertrofia">Hipertrofia</SelectItem>
                        <SelectItem value="performance">Melhoria de Performance</SelectItem>
                        <SelectItem value="corrida">Melhoria na Corrida</SelectItem>
                        <SelectItem value="resistencia">Resistência Cardiovascular</SelectItem>
                        <SelectItem value="forca">Ganho de Força</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="prazo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prazo (semanas)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="frequencia_semanal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequência semanal de treino</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="peso"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Peso (kg)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="altura"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Altura (cm)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Idade</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="experience_level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nível de Experiência</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione seu nível" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="iniciante">Iniciante</SelectItem>
                        <SelectItem value="intermediario">Intermediário</SelectItem>
                        <SelectItem value="avancado">Avançado</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atividades como Hobby</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="hobby_activity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Atividade (opcional)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Ex: Academia, Futebol, Crossfit..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hobby_frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequência por semana</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alimentos Disponíveis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newAlimento}
                onChange={(e) => setNewAlimento(e.target.value)}
                placeholder="Digite um alimento e pressione Enter"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAlimento())}
              />
              <Button type="button" onClick={addAlimento}>
                Adicionar
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {form.watch('alimentos_disponiveis').map((alimento, index) => (
                <Badge key={index} variant="outline" className="flex items-center gap-1">
                  {alimento}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0"
                    onClick={() => removeAlimento(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            <FormMessage>{form.formState.errors.alimentos_disponiveis?.message}</FormMessage>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Restrições Alimentares</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newRestricao}
                onChange={(e) => setNewRestricao(e.target.value)}
                placeholder="Digite uma restrição e pressione Enter"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRestricao())}
              />
              <Button type="button" onClick={addRestricao}>
                Adicionar
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {(form.watch('restricoes_alimentares') || []).map((restricao, index) => (
                <Badge key={index} variant="outline" className="flex items-center gap-1 bg-red-50">
                  {restricao}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0"
                    onClick={() => removeRestricao(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full">
          Revisar Informações
        </Button>
      </form>
    </Form>
  )
}

export default CompleteProfileForm
