import { createClient } from '@supabase/supabase-js';
import { generateJson, logAiUsage } from '../_lib/aiUsage';

const ALLOWED_ORIGINS = ['https://orvalhodigital.com.br', 'https://www.orvalhodigital.com.br', 'https://painel.orvalhodigital.com.br'];

// Do mais barato pro mais caro — só tenta o próximo se o anterior falhar
// (erro de API ou resposta que não é um JSON válido).
const MODEL_FALLBACK_CHAIN = ['gpt-5-nano', 'gpt-5-mini', 'gpt-5'];

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

  const openaiApiKey = process.env.OPENAI_API_KEY;
  const openrouterApiKey = process.env.OPENROUTER_API_KEY;

  if (!openaiApiKey && !openrouterApiKey) {
    return res.status(500).json({ error: 'A chave da IA (OPENAI_API_KEY ou OPENROUTER_API_KEY) não está configurada no servidor.' });
  }

  try {
    const { vehicle } = req.body || {};

    if (!vehicle) {
      return res.status(400).json({ error: 'Missing required payload: vehicle.' });
    }

    const prompt = `Você é um assistente de vendas de veículos. Com base nos dados deste veículo:
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
Soma o Preço de Compra + Todos os Custos Operacionais + Margem de Lucro recomendada (geralmente entre 15% e 25% sobre o custo total de aquisição).`;

    const { result: parsed, meta: aiMeta } = await generateJson(prompt, openaiApiKey, openrouterApiKey);
    await logAiUsage(userId, 'seo', aiMeta);
    return res.status(200).json(parsed);
  } catch (err: any) {
    console.error('Error generating AI SEO:', err);
    return res.status(500).json({ error: err.message });
  }
}
