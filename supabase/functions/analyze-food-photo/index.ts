
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
      console.error('Dados obrigatórios ausentes:', { imageData: !!imageData, userId: !!userId });
      throw new Error('Dados obrigatórios: imageData e userId');
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY não configurada');
      throw new Error('OPENAI_API_KEY não configurada');
    }

    console.log('Iniciando análise de foto de alimento para usuário:', userId);

    // Validar formato da imagem
    if (!imageData.startsWith('data:image/')) {
      throw new Error('Formato de imagem inválido. Use data:image/ format.');
    }

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
            content: `Você é um especialista em nutrição. Analise a imagem de comida e retorne APENAS um JSON válido com:
            {
              "foods": [{"name": "nome do alimento", "quantity": "quantidade estimada", "calories": número}],
              "totalCalories": número total,
              "macros": {"protein": gramas, "carbs": gramas, "fat": gramas, "fiber": gramas},
              "confidence": "alta/média/baixa",
              "suggestions": ["dica 1", "dica 2"],
              "healthScore": número de 1-10
            }
            Seja preciso com as calorias e macros. Se não conseguir identificar claramente, indique baixa confiança. 
            IMPORTANTE: Retorne APENAS o JSON, sem texto adicional.`
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
      const errorText = await analysisResponse.text();
      console.error('Erro OpenAI:', analysisResponse.status, errorText);
      throw new Error(`Erro na análise da imagem: ${analysisResponse.status} - ${errorText}`);
    }

    const analysisData = await analysisResponse.json();
    const analysisText = analysisData.choices[0].message.content;
    
    console.log('Resposta da OpenAI:', analysisText);

    // Parse do JSON retornado pela IA
    let nutritionData;
    try {
      // Tentar fazer parse direto primeiro
      nutritionData = JSON.parse(analysisText);
      
      // Validar estrutura do JSON
      if (!nutritionData.foods || !Array.isArray(nutritionData.foods)) {
        throw new Error('Estrutura de foods inválida');
      }
      if (typeof nutritionData.totalCalories !== 'number') {
        throw new Error('totalCalories deve ser um número');
      }
      if (!nutritionData.macros || typeof nutritionData.macros !== 'object') {
        throw new Error('Estrutura de macros inválida');
      }
    } catch (parseError) {
      console.error('Erro ao fazer parse do JSON:', parseError);
      console.log('Tentando extrair JSON da resposta...');
      
      // Fallback - tentar extrair JSON da resposta
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          nutritionData = JSON.parse(jsonMatch[0]);
        } catch (secondParseError) {
          console.error('Erro no segundo parse:', secondParseError);
          throw new Error('Resposta da IA em formato inválido');
        }
      } else {
        // Fallback final - criar estrutura básica
        console.log('Usando fallback para estrutura de dados');
        nutritionData = {
          foods: [{ name: "Alimento não identificado", quantity: "porção", calories: 250 }],
          totalCalories: 250,
          macros: { protein: 10, carbs: 30, fat: 8, fiber: 3 },
          confidence: "baixa",
          suggestions: ["Não foi possível identificar com precisão. Tente uma foto mais clara com melhor iluminação."],
          healthScore: 5
        };
      }
    }

    // Validar e limpar dados antes de salvar
    const cleanedData = {
      foods: nutritionData.foods.map((food: any) => ({
        name: String(food.name || 'Alimento não identificado'),
        quantity: String(food.quantity || 'porção'),
        calories: Number(food.calories) || 0
      })),
      totalCalories: Number(nutritionData.totalCalories) || 0,
      macros: {
        protein: Number(nutritionData.macros?.protein) || 0,
        carbs: Number(nutritionData.macros?.carbs) || 0,
        fat: Number(nutritionData.macros?.fat) || 0,
        fiber: Number(nutritionData.macros?.fiber) || 0
      },
      confidence: nutritionData.confidence || 'baixa',
      suggestions: Array.isArray(nutritionData.suggestions) ? nutritionData.suggestions : [],
      healthScore: Math.min(10, Math.max(1, Number(nutritionData.healthScore) || 5))
    };

    console.log('Dados limpos para salvar:', cleanedData);

    // Salvar no banco de dados
    const { data: foodLog, error: dbError } = await supabase
      .from('food_logs')
      .insert({
        user_id: userId,
        image_data: imageData.substring(0, 10000), // Limitar tamanho para performance
        foods_detected: cleanedData.foods,
        total_calories: cleanedData.totalCalories,
        macros: cleanedData.macros,
        confidence_level: cleanedData.confidence,
        health_score: cleanedData.healthScore,
        ai_suggestions: cleanedData.suggestions
      })
      .select()
      .single();

    if (dbError) {
      console.error('Erro ao salvar no banco:', dbError);
      throw new Error(`Erro ao salvar análise: ${dbError.message}`);
    }

    console.log('Análise salva com sucesso. ID:', foodLog.id);

    return new Response(JSON.stringify({
      success: true,
      data: cleanedData,
      logId: foodLog.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro na análise de foto:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
