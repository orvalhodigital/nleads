import { GoogleGenAI, Type } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

const ALLOWED_ORIGINS = ['https://nleads.pro', 'https://nleads.com.br', 'https://www.nleads.pro', 'https://www.nleads.com.br'];

async function getVerifiedUserId(req: any): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const token = authHeader.slice(7);
  const authClient = createClient(supabaseUrl, supabaseAnonKey);
  const { data: { user }, error } = await authClient.auth.getUser(token);
  if (error || !user) return null;
  return user.id;
}

export default async function handler(req: any, res: any) {
  const origin = req.headers.origin || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const userId = await getVerifiedUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Gemini API key is not configured.' });
  }

  try {
    const { vehicle } = req.body || {};

    if (!vehicle) {
      return res.status(400).json({ error: 'Missing required payload: vehicle.' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Você é um assistente de vendas de veículos. Com base nos dados deste veículo:
      Marca: ${vehicle.brand}
      Modelo: ${vehicle.model}
      Ano: ${vehicle.year}/${vehicle.modelYear || vehicle.year}
      Combustível: ${vehicle.fuelType || ''}
      Cor: ${vehicle.color || ''}
      Preço de Compra: R$ ${vehicle.purchasePrice || 0}
      Custos Operacionais: R$ ${JSON.stringify(vehicle.operationalCosts || [])}

      Gere uma resposta em JSON com o seguinte formato exato (sem formatação extra ou markdown):
      {
        "seoHeadline": "Headline de 40 a 60 caracteres otimizada para SEO",
        "seoDescription": "Meta descrição de 120 a 160 caracteres contendo chamada para ação comercial",
        "suggestedSalePrice": preco_sugerido_calculado_em_numero
      }

      Regra para o cálculo de preço de venda sugerido:
      Soma o Preço de Compra + Todos os Custos Operacionais + Margem de Lucro recomendada (geralmente entre 15% e 25% sobre o custo total de aquisição).`,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);

    return res.status(200).json(parsed);
  } catch (err: any) {
    console.error('Error generating AI SEO:', err);
    return res.status(500).json({ error: err.message });
  }
}
