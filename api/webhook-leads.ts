import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing required env vars: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const ALLOWED_ORIGINS = ['https://orvalhodigital.com.br', 'https://www.orvalhodigital.com.br', 'https://painel.orvalhodigital.com.br'];

export default async function handler(req: any, res: any) {
  const origin = req.headers.origin || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Webhook-Token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // ─── Segurança: token do webhook (fail-closed) ──────────────────────────────
  // O chamador (n8n) precisa enviar o header `X-Webhook-Token` com o mesmo valor
  // de WEBHOOK_SECRET. Sem a env var, o endpoint REJEITA — nunca aceita anônimo.
  //
  // Antes isto falhava aberto ("aceita se o secret não existir"), o que deixava
  // o endpoint de injeção de leads exposto a qualquer um que soubesse um user_id
  // — e user_id é descobrível pelo site público. WEBHOOK_SECRET já está
  // configurado no Vercel (verificado na Fase 6), então o caminho de produção
  // não é afetado por esta mudança.
  const webhookSecret = process.env.WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[SEGURANÇA] WEBHOOK_SECRET não configurado — rejeitando por segurança.');
    return res.status(500).json({ error: 'Webhook não configurado no servidor.' });
  }
  const tokenHeader = req.headers['x-webhook-token'];
  if (tokenHeader !== webhookSecret) {
    return res.status(401).json({ error: 'Unauthorized: invalid or missing webhook token.' });
  }

  try {
    const body = req.body || {};
    const { name, phone, email, source, notes, temperature, user_id } = body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Missing required fields: name, phone' });
    }

    if (!user_id) {
      return res.status(400).json({ error: 'Missing required field: user_id' });
    }

    const newLead = {
      user_id,
      name,
      phone,
      email: email || '',
      phase: 'Novo Lead',
      temperature: temperature || 'Fria',
      source: source || 'Webhook',
      notes: notes || 'Importado via Webhook',
      presented_vehicles: [],
      funnel_history: {},
    };

    let attempts = 0;
    const maxAttempts = 3;
    let delay = 1000;
    let insertData: any = null;
    let lastError: any = null;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const { data, error } = await supabase
          .from('leads')
          .insert(newLead)
          .select()
          .single();

        if (error) {
          if (error.code === '42501') {
            return res.status(403).json({ error: 'Permission denied. Configure SUPABASE_SERVICE_ROLE_KEY.' });
          }
          throw error;
        }

        insertData = data;
        lastError = null;
        break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Tentativa ${attempts} de inserção de lead falhou. Detalhes:`, err.message || err);
        
        if (attempts >= maxAttempts) {
          break;
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
      }
    }

    if (lastError) {
      throw lastError;
    }

    return res.status(200).json({ success: true, message: 'Lead imported successfully', data: insertData });

  } catch (error: any) {
    console.error('Webhook Handler Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
