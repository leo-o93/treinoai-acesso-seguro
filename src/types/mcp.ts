
// MCP (Model Context Protocol) Types for TrainerAI
export interface MCPMessage {
  mcp_version: string
  source: string
  destination: string
  type: MCPMessageType
  session_id: string
  timestamp: string
  payload: any
}

export type MCPMessageType = 
  | 'user_update'
  | 'new_plan'
  | 'progress_update'
  | 'strava_update'
  | 'feedback_request'
  | 'plan_adjustment'
  | 'ai_response'
  | 'system_notification'

export interface MCPWorkoutPlan {
  date: string
  summary: string
  description: string
  exercises?: Exercise[]
  duration_minutes?: number
  calories_target?: number
}

export interface MCPDietPlan {
  date: string
  meal_type: 'cafe' | 'almoco' | 'lanche' | 'jantar' | 'ceia'
  summary: string
  description: string
  calories?: number
  macros?: {
    protein: number
    carbs: number
    fat: number
  }
}

export interface Exercise {
  name: string
  sets?: number
  reps?: number
  weight?: number
  duration_seconds?: number
  rest_seconds?: number
}

export interface MCPStravaStats {
  last_run_pace?: string
  weekly_km?: number
  monthly_km?: number
  last_activity?: {
    name: string
    type: string
    distance: number
    duration: string
    date: string
  }
}

export interface MCPUserPayload {
  session_id: string
  objective?: string
  plan?: {
    workout: MCPWorkoutPlan[]
    diet: MCPDietPlan[]
  }
  strava_stats?: MCPStravaStats
  feedback?: Array<{
    date: string
    message: string
    rating?: number
  }>
  user_context?: {
    name?: string
    weight?: number
    height?: number
    age?: number
    experience_level?: string
  }
}

export interface MCPProgressPayload {
  session_id: string
  completed: string[]
  feedback: string
  rating?: number
  adjustments_requested?: string[]
}

export interface MCPPlanPayload {
  session_id: string
  plan_type: 'workout' | 'diet' | 'both'
  workout?: MCPWorkoutPlan[]
  diet?: MCPDietPlan[]
  duration_weeks?: number
  objective?: string
}
