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
    const { vehicle, qualifiedLeads } = req.body || {};

    if (!vehicle || !Array.isArray(qualifiedLeads)) {
      return res.status(400).json({ error: 'Missing required payload: vehicle and qualifiedLeads.' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Analise o novo veículo em estoque: ${JSON.stringify(vehicle)}
      E os seguintes leads qualificados: ${JSON.stringify(qualifiedLeads)}

      Gere um resumo curto explicando por que esses leads combinam com esse carro e uma sugestão de mensagem personalizada para enviar a eles via WhatsApp.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matches: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  leadId: { type: Type.STRING },
                  reason: { type: Type.STRING },
                  whatsappPitch: { type: Type.STRING },
                },
                required: ['leadId', 'reason', 'whatsappPitch'],
              },
            },
          },
        },
      },
    });

    const jsonStr = response.text?.trim() || '{"matches":[]}';
    return res.status(200).json(JSON.parse(jsonStr));
  } catch (error: any) {
    console.error('Gemini Match API Error:', error);
    return res.status(500).json({ error: 'Failed to generate matching insights.' });
  }
}
