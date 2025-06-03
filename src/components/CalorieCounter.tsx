
import React, { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Camera, Upload, Loader2, Utensils, TrendingUp, AlertCircle } from 'lucide-react'
import { useCalorieCounter } from '@/hooks/useCalorieCounter'
import { CameraModal } from '@/components/CameraModal'

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

const CalorieCounter: React.FC = () => {
  const { isAnalyzing, analyzePhoto } = useCalorieCounter()
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<NutritionAnalysis | null>(null)
  const [showCameraModal, setShowCameraModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      processSelectedFile(file)
    }
  }

  const processSelectedFile = (file: File) => {
    setSelectedImage(file)
    const previewUrl = URL.createObjectURL(file)
    setImagePreview(previewUrl)
    setAnalysis(null)
  }

  const handleCameraCapture = (file: File) => {
    processSelectedFile(file)
  }

  const handleAnalyze = async () => {
    if (!selectedImage) return

    const result = await analyzePhoto(selectedImage)
    if (result) {
      setAnalysis(result)
    }
  }

  const resetCounter = () => {
    setSelectedImage(null)
    setImagePreview(null)
    setAnalysis(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'alta': return 'bg-green-100 text-green-800 border-green-200'
      case 'média': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'baixa': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600'
    if (score >= 6) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Utensils className="h-6 w-6" />
            Contador de Calorias por Foto
          </CardTitle>
          <CardDescription>
            Tire uma foto do seu prato e nossa IA calculará as calorias automaticamente
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">1. Selecione uma foto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="flex-1"
              disabled={isAnalyzing}
            >
              <Upload className="h-4 w-4 mr-2" />
              Selecionar da Galeria
            </Button>
            <Button
              onClick={() => setShowCameraModal(true)}
              variant="outline"
              className="flex-1"
              disabled={isAnalyzing}
            >
              <Camera className="h-4 w-4 mr-2" />
              Usar Câmera
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {imagePreview && (
            <div className="space-y-4">
              <div className="relative max-w-sm mx-auto">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg border"
                />
              </div>
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="px-8"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analisando...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Analisar Calorias
                    </>
                  )}
                </Button>
                <Button onClick={resetCounter} variant="outline">
                  Nova Foto
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Resultados da Análise</span>
              <Badge className={getConfidenceColor(analysis.confidence)}>
                Confiança: {analysis.confidence}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Total Calories */}
            <div className="text-center bg-blue-50 p-6 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">
                {analysis.totalCalories}
              </div>
              <div className="text-blue-600 font-medium">calorias totais</div>
            </div>

            {/* Foods Detected */}
            <div>
              <h4 className="font-semibold mb-3">Alimentos Identificados</h4>
              <div className="grid gap-3">
                {analysis.foods.map((food, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{food.name}</div>
                      <div className="text-sm text-gray-600">{food.quantity}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{food.calories} cal</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Macros */}
            <div>
              <h4 className="font-semibold mb-3">Informações Nutricionais</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">{analysis.macros.protein}g</div>
                  <div className="text-sm text-green-600">Proteína</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-lg font-bold text-orange-600">{analysis.macros.carbs}g</div>
                  <div className="text-sm text-orange-600">Carboidratos</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-lg font-bold text-purple-600">{analysis.macros.fat}g</div>
                  <div className="text-sm text-purple-600">Gordura</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">{analysis.macros.fiber}g</div>
                  <div className="text-sm text-blue-600">Fibra</div>
                </div>
              </div>
            </div>

            {/* Health Score */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-gray-500" />
                <span className="font-medium">Pontuação de Saúde</span>
              </div>
              <div className={`text-xl font-bold ${getHealthScoreColor(analysis.healthScore)}`}>
                {analysis.healthScore}/10
              </div>
            </div>

            {/* AI Suggestions */}
            {analysis.suggestions.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Sugestões da IA</h4>
                <div className="space-y-2">
                  {analysis.suggestions.map((suggestion, index) => (
                    <div key={index} className="p-3 bg-blue-50 rounded-lg text-blue-800 text-sm">
                      {suggestion}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <CameraModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onCapture={handleCameraCapture}
      />
    </div>
  )
}

export default CalorieCounter
