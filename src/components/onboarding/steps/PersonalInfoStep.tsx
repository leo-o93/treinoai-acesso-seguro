
import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface PersonalInfoStepProps {
  data: any
  updateData: (data: any) => void
  onNext?: () => void
  onComplete?: () => Promise<void>
  isSubmitting?: boolean
}

export const PersonalInfoStep: React.FC<PersonalInfoStepProps> = ({ data, updateData }) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Conte-nos sobre você
        </h3>
        <p className="text-gray-600">
          Essas informações nos ajudam a criar planos mais precisos
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nome completo</Label>
          <Input
            id="name"
            value={data.name}
            onChange={(e) => updateData({ name: e.target.value })}
            placeholder="Seu nome"
          />
        </div>

        <div>
          <Label htmlFor="age">Idade</Label>
          <Input
            id="age"
            type="number"
            value={data.age}
            onChange={(e) => updateData({ age: parseInt(e.target.value) })}
            min="18"
            max="100"
          />
        </div>

        <div>
          <Label htmlFor="gender">Gênero</Label>
          <Select value={data.gender} onValueChange={(value) => updateData({ gender: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Masculino</SelectItem>
              <SelectItem value="female">Feminino</SelectItem>
              <SelectItem value="other">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="height">Altura (cm)</Label>
          <Input
            id="height"
            type="number"
            value={data.height}
            onChange={(e) => updateData({ height: parseFloat(e.target.value) })}
            min="140"
            max="220"
          />
        </div>

        <div>
          <Label htmlFor="weight">Peso atual (kg)</Label>
          <Input
            id="weight"
            type="number"
            step="0.1"
            value={data.weight}
            onChange={(e) => updateData({ weight: parseFloat(e.target.value) })}
            min="40"
            max="200"
          />
        </div>
      </div>
    </div>
  )
}
