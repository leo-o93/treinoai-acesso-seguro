
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface FoodItem {
  name: string
  quantity: string
  calories: number
}

interface NutritionAnalysis {
  foods: FoodItem[]
  totalCalories: number
  macros: {
    protein: number
    carbs: number
    fat: number
    fiber: number
  }
  confidence: 'alta' | 'média' | 'baixa'
  suggestions: string[]
  healthScore: number
}

interface UseCalorieCounterReturn {
  isAnalyzing: boolean
  analyzePhoto: (imageFile: File) => Promise<NutritionAnalysis | null>
  captureFromCamera: () => Promise<File | null>
}

export const useCalorieCounter = (): UseCalorieCounterReturn => {
  const { user } = useAuth()
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  const analyzePhoto = async (imageFile: File): Promise<NutritionAnalysis | null> => {
    if (!user?.id) {
      toast.error('Você precisa estar logado para usar o contador de calorias')
      return null
    }

    if (!imageFile.type.startsWith('image/')) {
      toast.error('Por favor, selecione um arquivo de imagem válido')
      return null
    }

    // Verificar tamanho do arquivo (máximo 10MB)
    if (imageFile.size > 10 * 1024 * 1024) {
      toast.error('A imagem é muito grande. Máximo permitido: 10MB')
      return null
    }

    setIsAnalyzing(true)

    try {
      // Converter imagem para base64
      const imageData = await convertToBase64(imageFile)

      console.log('Enviando imagem para análise...')

      // Chamar Edge Function para análise
      const { data, error } = await supabase.functions.invoke('analyze-food-photo', {
        body: {
          imageData,
          userId: user.id
        }
      })

      if (error) {
        console.error('Erro na análise:', error)
        throw new Error(error.message || 'Erro ao analisar a imagem')
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro na análise da imagem')
      }

      console.log('Análise concluída:', data.data)
      toast.success('Foto analisada com sucesso!')

      return data.data as NutritionAnalysis
    } catch (error) {
      console.error('Erro ao analisar foto:', error)
      toast.error(`Erro ao analisar foto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      return null
    } finally {
      setIsAnalyzing(false)
    }
  }

  const captureFromCamera = async (): Promise<File | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      })

      return new Promise((resolve, reject) => {
        const video = document.createElement('video')
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')

        video.srcObject = stream
        video.play()

        video.addEventListener('loadedmetadata', () => {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight

          // Capturar após vídeo carregar
          setTimeout(() => {
            if (context) {
              context.drawImage(video, 0, 0)
              canvas.toBlob((blob) => {
                stream.getTracks().forEach(track => track.stop())
                if (blob) {
                  const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: 'image/jpeg' })
                  resolve(file)
                } else {
                  reject(new Error('Falha ao capturar imagem'))
                }
              }, 'image/jpeg', 0.8)
            } else {
              reject(new Error('Falha ao acessar canvas'))
            }
          }, 500)
        })

        video.addEventListener('error', () => {
          stream.getTracks().forEach(track => track.stop())
          reject(new Error('Erro ao carregar vídeo'))
        })
      })
    } catch (error) {
      console.error('Erro ao acessar câmera:', error)
      if (error instanceof Error && error.name === 'NotAllowedError') {
        toast.error('Permissão para câmera negada. Habilite nas configurações do navegador.')
      } else if (error instanceof Error && error.name === 'NotFoundError') {
        toast.error('Câmera não encontrada no dispositivo.')
      } else {
        toast.error('Erro ao acessar a câmera')
      }
      return null
    }
  }

  return {
    isAnalyzing,
    analyzePhoto,
    captureFromCamera
  }
}
