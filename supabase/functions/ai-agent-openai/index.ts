
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface UserContext {
  profile?: any;
  recentActivities?: any[];
  activePlans?: any[];
  goals?: any[];
  recentFeedback?: any[];
}

async function getUserContext(userId: string): Promise<UserContext> {
  try {
    // Buscar perfil do usuário
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Buscar atividades recentes do Strava
    const { data: recentActivities } = await supabase
      .from('strava_activities')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: false })
      .limit(5);

    // Buscar planos ativos
    const { data: trainingPlans } = await supabase
      .from('training_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .limit(2);

    const { data: nutritionPlans } = await supabase
      .from('nutrition_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .limit(2);

    // Buscar objetivos
    const { data: goals } = await supabase
      .from('user_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active');

    // Buscar feedback recente
    const { data: recentFeedback } = await supabase
      .from('weekly_feedback')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3);

    return {
      profile,
      recentActivities: recentActivities || [],
      activePlans: [...(trainingPlans || []), ...(nutritionPlans || [])],
      goals: goals || [],
      recentFeedback: recentFeedback || []
    };
  } catch (error) {
    console.error('Erro ao buscar contexto do usuário:', error);
    return {};
  }
}

function buildSystemPrompt(context: UserContext): string {
  const { profile, recentActivities, activePlans, goals, recentFeedback } = context;

  let prompt = `Você é o TrainerAI, um personal trainer virtual especializado e assistente fitness inteligente. Sua personalidade é:

- Motivador e encorajador, mas realista
- Especialista em treinos, nutrição e bem-estar
- Analítico e baseado em dados
- Empático e compreensivo
- Foca em resultados sustentáveis

INSTRUÇÕES IMPORTANTES:
- Sempre responda em português brasileiro
- Use dados específicos do usuário quando disponível
- Seja preciso e prático nas recomendações
- Mantenha respostas focadas e actionable
- Se não tiver dados suficientes, peça informações específicas

`;

  // Adicionar contexto do perfil
  if (profile) {
    prompt += `\nPERFIL DO USUÁRIO:
- Nome: ${profile.name || 'Não informado'}
- Objetivo: ${profile.objetivo || profile.objective || 'Não definido'}
- Peso: ${profile.peso || profile.weight || 'Não informado'}kg
- Altura: ${profile.altura || profile.height || 'Não informado'}cm
- Frequência de treino: ${profile.frequencia_semanal || profile.training_frequency || 'Não informado'}x/semana
- Nível de experiência: ${profile.experience_level || 'Não informado'}
- Restrições alimentares: ${profile.restricoes_alimentares?.join(', ') || profile.restrictions?.join(', ') || 'Nenhuma'}
`;
  }

  // Adicionar atividades recentes
  if (recentActivities.length > 0) {
    prompt += `\nATIVIDADES RECENTES (Strava):
`;
    recentActivities.slice(0, 3).forEach(activity => {
      const date = new Date(activity.start_date).toLocaleDateString('pt-BR');
      prompt += `- ${activity.name} (${activity.type}) - ${date} - ${activity.distance?.toFixed(1) || 'N/A'}km em ${Math.floor((activity.moving_time || 0) / 60)}min\n`;
    });
  }

  // Adicionar planos ativos
  if (activePlans.length > 0) {
    prompt += `\nPLANOS ATIVOS:
`;
    activePlans.forEach(plan => {
      const type = plan.plan_data ? 'Treino' : 'Nutrição';
      prompt += `- ${type}: ${plan.title}\n`;
    });
  }

  // Adicionar objetivos
  if (goals.length > 0) {
    prompt += `\nOBJETIVOS ATIVOS:
`;
    goals.forEach(goal => {
      prompt += `- ${goal.goal_type}: ${goal.current_value || 0}/${goal.target_value} ${goal.unit}\n`;
    });
  }

  // Adicionar feedback recente
  if (recentFeedback.length > 0) {
    const latestFeedback = recentFeedback[0];
    prompt += `\nÚLTIMO FEEDBACK:
- Aderência: ${latestFeedback.adherence_score}/10
- Nível de energia: ${latestFeedback.energy_level}/10
- Dificuldade: ${latestFeedback.difficulty_level}/10
- Comentários: ${latestFeedback.feedback_text || 'Nenhum'}
`;
  }

  prompt += `\nUSE ESSAS INFORMAÇÕES para personalizar suas respostas e dar conselhos específicos baseados na situação atual do usuário.`;

  return prompt;
}

async function processAIMessage(userMessage: string, userId: string, sessionId: string): Promise<string> {
  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY não configurada');
    }

    // Buscar contexto do usuário
    console.log('Buscando contexto do usuário:', userId);
    const context = await getUserContext(userId);

    // Buscar histórico recente da conversa
    const { data: recentMessages } = await supabase
      .from('ai_conversations')
      .select('content, message_type, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(6);

    // Construir prompt do sistema
    const systemPrompt = buildSystemPrompt(context);

    // Construir histórico de mensagens
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Adicionar histórico recente (em ordem cronológica)
    if (recentMessages) {
      recentMessages.reverse().forEach(msg => {
        if (msg.message_type === 'user') {
          messages.push({ role: 'user', content: msg.content });
        } else if (msg.message_type === 'ai') {
          messages.push({ role: 'assistant', content: msg.content });
        }
      });
    }

    // Adicionar mensagem atual
    messages.push({ role: 'user', content: userMessage });

    console.log('Enviando para OpenAI:', messages.length, 'mensagens');

    // Chamar OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Erro OpenAI:', response.status, errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Resposta OpenAI recebida:', data.usage);

    return data.choices[0].message.content;

  } catch (error) {
    console.error('Erro ao processar mensagem IA:', error);
    return 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente em alguns instantes.';
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userId, sessionId } = await req.json();

    if (!message || !userId) {
      throw new Error('Parâmetros obrigatórios: message, userId');
    }

    console.log('Processando mensagem:', { userId, sessionId, messageLength: message.length });

    // Processar com IA
    const aiResponse = await processAIMessage(message, userId, sessionId || `web-${userId}`);

    // Salvar conversa do usuário
    const { data: conversation } = await supabase
      .from('ai_conversations')
      .insert({
        user_id: userId,
        session_id: sessionId || `web-${userId}`,
        content: message,
        message_type: 'user',
        context: {
          source: 'web_dashboard',
          timestamp: new Date().toISOString()
        }
      })
      .select()
      .single();

    // Salvar resposta da IA
    if (conversation) {
      await supabase
        .from('ai_conversations')
        .insert({
          user_id: userId,
          session_id: sessionId || `web-${userId}`,
          content: aiResponse,
          message_type: 'ai',
          context: {
            source: 'openai_agent',
            timestamp: new Date().toISOString(),
            conversation_id: conversation.id
          }
        });
    }

    return new Response(JSON.stringify({
      success: true,
      response: aiResponse,
      conversationId: conversation?.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro na function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
