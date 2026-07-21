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
    const { vehicle, qualifiedLeads } = req.body || {};

    if (!vehicle || !Array.isArray(qualifiedLeads)) {
      return res.status(400).json({ error: 'Missing required payload: vehicle and qualifiedLeads.' });
    }

    const prompt = `Analise o novo veículo em estoque: ${JSON.stringify(vehicle)}
E os seguintes leads qualificados: ${JSON.stringify(qualifiedLeads)}

Gere um resumo curto explicando por que esses leads combinam com esse carro e uma sugestão de mensagem personalizada para enviar a eles via WhatsApp.

Responda APENAS com JSON válido, sem markdown, exatamente neste formato:
{
  "matches": [
    { "leadId": "id do lead (string)", "reason": "por que esse lead combina com o veículo", "whatsappPitch": "mensagem pronta para enviar via WhatsApp" }
  ]
}
Se nenhum lead combinar bem, responda {"matches": []}.`;

    const { result: parsed, meta: aiMeta } = await generateJson(prompt, openaiApiKey, openrouterApiKey);
    await logAiUsage(userId, 'matching-insights', aiMeta);
    if (!Array.isArray(parsed?.matches)) {
      return res.status(200).json({ matches: [] });
    }
    return res.status(200).json(parsed);
  } catch (error: any) {
    console.error('OpenAI Match API Error:', error);
    return res.status(500).json({ error: 'Failed to generate matching insights.' });
  }
}
