
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageData, userId } = await req.json();
    
    if (!imageData || !userId) {
      throw new Error('Dados obrigatórios: imageData e userId');
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY não configurada');
    }

    console.log('Analisando foto de alimento para usuário:', userId);

    // Análise da imagem com OpenAI Vision
    const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Você é um especialista em nutrição. Analise a imagem de comida e retorne um JSON com:
            {
              "foods": [{"name": "nome do alimento", "quantity": "quantidade estimada", "calories": número}],
              "totalCalories": número total,
              "macros": {"protein": gramas, "carbs": gramas, "fat": gramas, "fiber": gramas},
              "confidence": "alta/média/baixa",
              "suggestions": ["dica 1", "dica 2"],
              "healthScore": número de 1-10
            }
            Seja preciso com as calorias e macros. Se não conseguir identificar, indique baixa confiança.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analise esta foto de comida e calcule as calorias e informações nutricionais:'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageData
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      }),
    });

    if (!analysisResponse.ok) {
      const errorData = await analysisResponse.text();
      console.error('Erro OpenAI:', analysisResponse.status, errorData);
      throw new Error(`Erro na análise da imagem: ${analysisResponse.status}`);
    }

    const analysisData = await analysisResponse.json();
    const analysisText = analysisData.choices[0].message.content;
    
    console.log('Resposta da análise:', analysisText);

    // Parse do JSON retornado pela IA
    let nutritionData;
    try {
      // Extrair JSON da resposta (caso venha com texto adicional)
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        nutritionData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('JSON não encontrado na resposta');
      }
    } catch (parseError) {
      console.error('Erro ao fazer parse do JSON:', parseError);
      // Fallback - criar estrutura básica
      nutritionData = {
        foods: [{ name: "Alimento não identificado", quantity: "porção", calories: 250 }],
        totalCalories: 250,
        macros: { protein: 10, carbs: 30, fat: 8, fiber: 3 },
        confidence: "baixa",
        suggestions: ["Não foi possível identificar com precisão. Tente uma foto mais clara."],
        healthScore: 5
      };
    }

    // Salvar no banco de dados
    const { data: foodLog, error: dbError } = await supabase
      .from('food_logs')
      .insert({
        user_id: userId,
        image_data: imageData,
        foods_detected: nutritionData.foods,
        total_calories: nutritionData.totalCalories,
        macros: nutritionData.macros,
        confidence_level: nutritionData.confidence,
        health_score: nutritionData.healthScore,
        ai_suggestions: nutritionData.suggestions
      })
      .select()
      .single();

    if (dbError) {
      console.error('Erro ao salvar no banco:', dbError);
      throw new Error('Erro ao salvar análise no banco de dados');
    }

    console.log('Análise salva com sucesso:', foodLog.id);

    return new Response(JSON.stringify({
      success: true,
      data: nutritionData,
      logId: foodLog.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro na análise de foto:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
