
// Sistema de comunicação com MCP (n8n)
interface MCPCallParams {
  tool: string
  input: {
    function: string
    parameters: Record<string, any>
  }
}

interface MCPResponse {
  success: boolean
  data?: any
  error?: string
}

// URLs dos webhooks MCP (configurar no .env)
const MCP_BASE_URL = import.meta.env.VITE_MCP_BASE_URL || 'https://seu-n8n-url'
const AI_AGENT_PATH = import.meta.env.VITE_MCP_AI_AGENT_PATH || '/webhook/ai-agent-trigger'
const AGENDAMENTO_PATH = import.meta.env.VITE_MCP_AGENDAMENTO_PATH || '/webhook/agendamento-trigger'

export async function mcpCall(tool: string, func: string, parameters: Record<string, any> = {}): Promise<MCPResponse> {
  try {
    const payload: MCPCallParams = {
      tool,
      input: {
        function: func,
        parameters
      }
    }

    console.log('MCP Call:', { tool, func, parameters })

    // Determinar o endpoint baseado na ferramenta
    let endpoint = AI_AGENT_PATH
    if (tool.includes('AGENDAMENTO')) {
      endpoint = AGENDAMENTO_PATH
    }

    const response = await fetch(`${MCP_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log('MCP Response:', data)

    return {
      success: true,
      data
    }
  } catch (error) {
    console.error('MCP Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

// Funções específicas para cada ferramenta MCP
export const mcpAgendamento = {
  buscarTodosEventos: (timeMin?: string, timeMax?: string) =>
    mcpCall('AGENDAMENTO-Treino-Dietas', 'buscar_todos_eventos', { timeMin, timeMax }),
  
  criarEvento: (summary: string, description: string, start: string, end: string) =>
    mcpCall('AGENDAMENTO-Treino-Dietas', 'criar_evento', { summary, description, start, end }),
  
  buscarEvento: (eventId: string) =>
    mcpCall('AGENDAMENTO-Treino-Dietas', 'buscar_evento', { eventId }),
  
  cancelarEvento: (eventId: string) =>
    mcpCall('AGENDAMENTO-Treino-Dietas', 'cancelar_evento', { eventId }),
  
  atualizarEvento: (eventId: string, summary?: string, description?: string, start?: string, end?: string) =>
    mcpCall('AGENDAMENTO-Treino-Dietas', 'atualizar_evento', { eventId, summary, description, start, end })
}

export const mcpStrava = {
  getAllTrain: (limit: number = 10) =>
    mcpCall('INFORMACOES-Strava', 'get_all_train', { limit }),
  
  getTrain: (activityId: string) =>
    mcpCall('INFORMACOES-Strava', 'get_train', { activityId }),
  
  getLaps: (activityId: string, limit: number = 5) =>
    mcpCall('INFORMACOES-Strava', 'get_laps', { activityId, limit }),
  
  getStreams: (activityId: string, keys: string[]) =>
    mcpCall('INFORMACOES-Strava', 'get_streams', { activityId, keys })
}

export const mcpConhecimento = {
  buscarConhecimento: (query: string) =>
    mcpCall('CONHECIMENTO-IA', 'buscar_conhecimento', { query })
}

export const mcpAI = {
  getObjetivo: () =>
    mcpCall('AGENDAMENTO-Treino-Dietas', 'get_objetivo', {}),
  
  gerarPlanoTreino: (objetivo: string, peso: number, altura: number, frequencia: number) =>
    mcpCall('AI-AGENT', 'gerar_plano_treino', { objetivo, peso, altura, frequencia }),
  
  gerarPlanoDieta: (objetivo: string, peso: number, altura: number, alimentos: string[], restricoes: string[]) =>
    mcpCall('AI-AGENT', 'gerar_plano_dieta', { objetivo, peso, altura, alimentos, restricoes }),
  
  gerarPlanoCompleto: (request: any) =>
    mcpCall('AI-AGENT', 'gerar_plano_completo', request),
  
  reavaliar: (feedback: string) =>
    mcpCall('AI-AGENT', 'reavaliar', { feedback })
}
