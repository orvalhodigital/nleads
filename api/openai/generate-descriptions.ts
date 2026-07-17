import { createClient } from '@supabase/supabase-js';

const ALLOWED_ORIGINS = ['https://nleads.pro', 'https://nleads.com.br', 'https://www.nleads.pro', 'https://www.nleads.com.br'];

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

async function generateJson(prompt: string, openaiApiKey?: string, openrouterApiKey?: string): Promise<any> {
  let lastError: any = null;

  // 1. Tenta OpenAI primeiro, se a chave estiver configurada
  if (openaiApiKey) {
    for (const model of MODEL_FALLBACK_CHAIN) {
      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${openaiApiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
          }),
        });

        if (!res.ok) {
          lastError = new Error(`OpenAI (${model}) falhou: HTTP ${res.status} — ${await res.text()}`);
          continue;
        }

        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) {
          lastError = new Error(`OpenAI (${model}) retornou resposta vazia.`);
          continue;
        }

        return JSON.parse(content);
      } catch (err: any) {
        lastError = err;
        continue;
      }
    }
  }

  // 2. Fallback para OpenRouter se a OpenAI falhar ou não estiver configurada
  if (openrouterApiKey) {
    const OPENROUTER_MODEL_FALLBACK_CHAIN = [
      'google/gemini-2.5-flash',
      'meta-llama/llama-3-8b-instruct',
      'openai/gpt-4o-mini'
    ];

    for (const model of OPENROUTER_MODEL_FALLBACK_CHAIN) {
      try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openrouterApiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://nleads.pro',
            'X-Title': 'Orvalho Digital Leads'
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
          }),
        });

        if (!res.ok) {
          lastError = new Error(`OpenRouter (${model}) falhou: HTTP ${res.status} — ${await res.text()}`);
          continue;
        }

        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) {
          lastError = new Error(`OpenRouter (${model}) retornou resposta vazia.`);
          continue;
        }

        return JSON.parse(content);
      } catch (err: any) {
        lastError = err;
        continue;
      }
    }
  }

  throw lastError || new Error('Todos os modelos de IA falharam (OpenAI e OpenRouter).');
}

export default async function handler(req: any, res: any) {
  const origin = req.headers.origin || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed. Use POST.' });

  const userId = await getVerifiedUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

  const openaiApiKey = process.env.OPENAI_API_KEY;
  const openrouterApiKey = process.env.OPENROUTER_API_KEY;

  if (!openaiApiKey && !openrouterApiKey) {
    return res.status(500).json({ error: 'A chave da IA (OPENAI_API_KEY ou OPENROUTER_API_KEY) não está configurada no servidor.' });
  }

  try {
    const { vehicle } = req.body || {};
    if (!vehicle) return res.status(400).json({ error: 'Missing required payload: vehicle.' });

    const opcionais = Array.isArray(vehicle.optionals) ? vehicle.optionals.join(', ') : '';
    const condicoes = [
      vehicle.isSingleOwner ? 'único dono' : '',
      vehicle.isServiceHistoryComplete ? 'revisões em dia' : '',
      vehicle.isIpvaPaid ? 'IPVA pago' : '',
      vehicle.hasWarranty ? 'com garantia' : '',
      vehicle.hasSpareKey ? 'chave reserva' : '',
      vehicle.hasOwnerManual ? 'manual do proprietário' : '',
    ].filter(Boolean).join(', ');

    const prompt = `Você é um redator especialista em anúncios de veículos seminovos no Brasil.
Escreva em português do Brasil, tom comercial, honesto e direto. NÃO invente informação
que não esteja nos dados abaixo (não invente quilometragem, opcionais nem estado de conservação).

Dados do veículo:
Marca: ${vehicle.brand || ''}
Modelo: ${vehicle.model || ''}
Ano: ${vehicle.year || ''}/${vehicle.modelYear || vehicle.year || ''}
Cor: ${vehicle.color || ''}
Quilometragem: ${vehicle.mileage ?? ''} km
Câmbio: ${vehicle.transmission || ''}
Motor: ${vehicle.engine || ''}
Combustível: ${vehicle.fuelType || ''}
Condições: ${condicoes || 'não informadas'}
Opcionais: ${opcionais || 'não informados'}

Responda APENAS com JSON válido, sem markdown, exatamente neste formato:
{
  "shortDescription": "uma frase de até 120 caracteres, chamativa, para listagem",
  "description": "descrição completa de 3 a 5 frases (400 a 700 caracteres) destacando os pontos fortes reais e terminando com um convite para agendar visita ou test drive"
}`;

    const parsed = await generateJson(prompt, openaiApiKey, openrouterApiKey);
    return res.status(200).json({
      shortDescription: parsed.shortDescription || '',
      description: parsed.description || '',
    });
  } catch (err: any) {
    console.error('Error generating AI descriptions:', err);
    return res.status(500).json({ error: err.message });
  }
}
