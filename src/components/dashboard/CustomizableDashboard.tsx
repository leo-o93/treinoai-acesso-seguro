
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Layout, Eye, EyeOff, Settings, Move, Save } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface DashboardWidget {
  id: string
  name: string
  component: string
  visible: boolean
  position: number
  size: 'small' | 'medium' | 'large'
  category: 'performance' | 'goals' | 'calendar' | 'social' | 'analytics'
}

interface DashboardLayout {
  id: string
  name: string
  widgets: DashboardWidget[]
  isDefault: boolean
}

const CustomizableDashboard: React.FC = () => {
  const [editMode, setEditMode] = useState(false)
  const [currentLayout, setCurrentLayout] = useState<string>('default')
  const [layouts, setLayouts] = useState<DashboardLayout[]>([
    {
      id: 'default',
      name: 'Layout Padrão',
      isDefault: true,
      widgets: [
        { id: '1', name: 'Estatísticas Rápidas', component: 'StatsCard', visible: true, position: 1, size: 'large', category: 'performance' },
        { id: '2', name: 'Gráfico de Performance', component: 'PerformanceChart', visible: true, position: 2, size: 'large', category: 'performance' },
        { id: '3', name: 'Próximos Eventos', component: 'UpcomingEvents', visible: true, position: 3, size: 'medium', category: 'calendar' },
        { id: '4', name: 'Resumo de Metas', component: 'GoalSummary', visible: true, position: 4, size: 'large', category: 'goals' },
        { id: '5', name: 'Mensagens Motivacionais', component: 'MotivationalMessages', visible: true, position: 5, size: 'medium', category: 'social' }
      ]
    },
    {
      id: 'performance',
      name: 'Foco em Performance',
      isDefault: false,
      widgets: [
        { id: '1', name: 'Análise Avançada Strava', component: 'AdvancedStravaAnalytics', visible: true, position: 1, size: 'large', category: 'performance' },
        { id: '2', name: 'Insights de Performance', component: 'PerformanceInsights', visible: true, position: 2, size: 'large', category: 'analytics' },
        { id: '3', name: 'Estatísticas Rápidas', component: 'StatsCard', visible: true, position: 3, size: 'medium', category: 'performance' },
        { id: '4', name: 'Conquistas', component: 'AchievementSystem', visible: true, position: 4, size: 'medium', category: 'social' }
      ]
    }
  ])

  const availableWidgets = [
    { id: 'stats', name: 'Estatísticas Rápidas', component: 'StatsCard', category: 'performance' },
    { id: 'performance-chart', name: 'Gráfico de Performance', component: 'PerformanceChart', category: 'performance' },
    { id: 'events', name: 'Próximos Eventos', component: 'UpcomingEvents', category: 'calendar' },
    { id: 'goals', name: 'Resumo de Metas', component: 'GoalSummary', category: 'goals' },
    { id: 'motivational', name: 'Mensagens Motivacionais', component: 'MotivationalMessages', category: 'social' },
    { id: 'achievements', name: 'Sistema de Conquistas', component: 'AchievementSystem', category: 'social' },
    { id: 'strava-advanced', name: 'Análise Avançada Strava', component: 'AdvancedStravaAnalytics', category: 'performance' },
    { id: 'performance-insights', name: 'Insights de Performance', component: 'PerformanceInsights', category: 'analytics' },
    { id: 'calendar-integration', name: 'Google Calendar', component: 'GoogleCalendarIntegration', category: 'calendar' },
    { id: 'n8n-integration', name: 'Integrações n8n', component: 'N8nApiIntegration', category: 'analytics' }
  ]

  const getCurrentLayoutWidgets = () => {
    const layout = layouts.find(l => l.id === currentLayout)
    return layout?.widgets || []
  }

  const toggleWidgetVisibility = (widgetId: string) => {
    setLayouts(layouts.map(layout => 
      layout.id === currentLayout 
        ? {
            ...layout,
            widgets: layout.widgets.map(widget =>
              widget.id === widgetId 
                ? { ...widget, visible: !widget.visible }
                : widget
            )
          }
        : layout
    ))
  }

  const addWidget = (widgetData: any) => {
    const newWidget: DashboardWidget = {
      id: Date.now().toString(),
      name: widgetData.name,
      component: widgetData.component,
      visible: true,
      position: getCurrentLayoutWidgets().length + 1,
      size: 'medium',
      category: widgetData.category
    }

    setLayouts(layouts.map(layout =>
      layout.id === currentLayout
        ? { ...layout, widgets: [...layout.widgets, newWidget] }
        : layout
    ))

    toast({
      title: 'Widget adicionado',
      description: `${widgetData.name} foi adicionado ao dashboard.`
    })
  }

  const removeWidget = (widgetId: string) => {
    setLayouts(layouts.map(layout =>
      layout.id === currentLayout
        ? { ...layout, widgets: layout.widgets.filter(w => w.id !== widgetId) }
        : layout
    ))

    toast({
      title: 'Widget removido',
      description: 'O widget foi removido do dashboard.'
    })
  }

  const changeWidgetSize = (widgetId: string, newSize: 'small' | 'medium' | 'large') => {
    setLayouts(layouts.map(layout =>
      layout.id === currentLayout
        ? {
            ...layout,
            widgets: layout.widgets.map(widget =>
              widget.id === widgetId 
                ? { ...widget, size: newSize }
                : widget
            )
          }
        : layout
    ))
  }

  const saveLayout = () => {
    // Aqui você salvaria no localStorage ou backend
    localStorage.setItem('dashboard-layouts', JSON.stringify(layouts))
    
    toast({
      title: 'Layout salvo',
      description: 'Suas configurações foram salvas com sucesso.'
    })
    
    setEditMode(false)
  }

  const createNewLayout = () => {
    const newLayout: DashboardLayout = {
      id: Date.now().toString(),
      name: `Layout ${layouts.length + 1}`,
      isDefault: false,
      widgets: []
    }

    setLayouts([...layouts, newLayout])
    setCurrentLayout(newLayout.id)
    setEditMode(true)

    toast({
      title: 'Novo layout criado',
      description: 'Você pode personalizar este layout agora.'
    })
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'performance': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'goals': return 'bg-green-50 text-green-700 border-green-200'
      case 'calendar': return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'social': return 'bg-orange-50 text-orange-700 border-orange-200'
      case 'analytics': return 'bg-red-50 text-red-700 border-red-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Layout className="w-5 h-5 text-emerald-500" />
            Dashboard Personalizável
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={editMode ? "default" : "outline"}
              onClick={() => setEditMode(!editMode)}
            >
              <Settings className="w-3 h-3 mr-1" />
              {editMode ? 'Sair do Modo Edição' : 'Personalizar'}
            </Button>
            {editMode && (
              <Button size="sm" onClick={saveLayout}>
                <Save className="w-3 h-3 mr-1" />
                Salvar
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="current" className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="current">Layout Atual</TabsTrigger>
            <TabsTrigger value="widgets">Widgets</TabsTrigger>
            <TabsTrigger value="layouts">Layouts</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">
                {layouts.find(l => l.id === currentLayout)?.name}
              </h4>
              {editMode && (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  Modo Edição Ativo
                </Badge>
              )}
            </div>

            <div className="space-y-3">
              {getCurrentLayoutWidgets().map((widget) => (
                <div 
                  key={widget.id} 
                  className={`p-4 border rounded-lg transition-all ${
                    editMode ? 'border-dashed border-emerald-300 bg-emerald-50' : 'bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {editMode && <Move className="w-4 h-4 text-gray-400 cursor-grab" />}
                      <div>
                        <h5 className="font-medium text-gray-900">{widget.name}</h5>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={getCategoryColor(widget.category)}>
                            {widget.category}
                          </Badge>
                          <Badge variant="outline">
                            {widget.size}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    {editMode && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleWidgetVisibility(widget.id)}
                        >
                          {widget.visible ? (
                            <Eye className="w-3 h-3" />
                          ) : (
                            <EyeOff className="w-3 h-3" />
                          )}
                        </Button>
                        
                        <select
                          value={widget.size}
                          onChange={(e) => changeWidgetSize(widget.id, e.target.value as any)}
                          className="text-xs border rounded px-2 py-1"
                        >
                          <option value="small">Pequeno</option>
                          <option value="medium">Médio</option>
                          <option value="large">Grande</option>
                        </select>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeWidget(widget.id)}
                        >
                          Remover
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="widgets" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableWidgets.map((widget) => (
                <div key={widget.id} className="p-4 border rounded-lg bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-900">{widget.name}</h5>
                    <Badge variant="outline" className={getCategoryColor(widget.category)}>
                      {widget.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Componente: {widget.component}
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => addWidget(widget)}
                    disabled={!editMode}
                  >
                    Adicionar ao Layout
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="layouts" className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Layouts Salvos</h4>
              <Button size="sm" onClick={createNewLayout}>
                Criar Novo Layout
              </Button>
            </div>

            <div className="space-y-3">
              {layouts.map((layout) => (
                <div 
                  key={layout.id} 
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    currentLayout === layout.id 
                      ? 'border-emerald-300 bg-emerald-50' 
                      : 'bg-white hover:bg-gray-50'
                  }`}
                  onClick={() => setCurrentLayout(layout.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium text-gray-900">{layout.name}</h5>
                      <p className="text-sm text-gray-600">
                        {layout.widgets.length} widgets configurados
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {layout.isDefault && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          Padrão
                        </Badge>
                      )}
                      {currentLayout === layout.id && (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          Ativo
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default CustomizableDashboard
