import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing required env vars: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const ALLOWED_ORIGINS = ['https://nleads.pro', 'https://nleads.com.br', 'https://www.nleads.pro', 'https://www.nleads.com.br'];

export default async function handler(req: any, res: any) {
  const origin = req.headers.origin || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, ASAAS-Signature, asaas-access-token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // ─── Segurança: token do webhook OBRIGATÓRIO (fail-closed) ──────────────────
  // ⚠️ Configure ASAAS_WEBHOOK_TOKEN no Vercel E no painel do Asaas (mesmo valor),
  // senão TODAS as confirmações de pagamento serão rejeitadas.
  const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!webhookToken) {
    console.error('ASAAS_WEBHOOK_TOKEN não configurado — rejeitando webhook por segurança.');
    return res.status(500).json({ error: 'Webhook não configurado no servidor.' });
  }
  const requestToken = req.headers['asaas-access-token'];
  if (requestToken !== webhookToken) {
    console.warn('Unauthorized webhook request - invalid token');
    return res.status(401).json({ error: 'Unauthorized: invalid webhook token' });
  }

  try {
    const body = req.body || {};
    const { event, payment } = body;

    console.log('Asaas Webhook received event:', event, 'Payment ID:', payment?.id);

    // Processamos apenas eventos de pagamento efetivado
    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
      const userId = payment?.externalReference; // O user_id enviado na criação da cobrança

      if (!userId) {
        console.error('No externalReference (userId) found in payment payload');
        return res.status(400).json({ error: 'Missing externalReference' });
      }

      // Buscar perfil para (a) validar valor e (b) idempotência
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, plan, plan_status')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        console.error('Profile não encontrado para userId:', userId, profileError);
        return res.status(404).json({ error: 'Profile not found' });
      }

      // Idempotência: se já está PRO/ativo, não reprocessa (evita estender trial repetido)
      if (profile.plan === 'pro' && profile.plan_status === 'active') {
        console.log(`User ${userId} já é PRO/ativo — evento ignorado (idempotência).`);
        return res.status(200).json({ success: true, message: 'Already processed', userId });
      }

      // Validação do valor pago contra o(s) plano(s) cadastrado(s)
      const paidValue = Number(payment?.value);
      if (Number.isFinite(paidValue) && paidValue > 0) {
        const { data: plans } = await supabase.from('plans').select('price');
        const validPrices = (plans || [])
          .map((p: any) => Number(p.price))
          .filter((n: number) => Number.isFinite(n) && n > 0);
        if (validPrices.length > 0 && !validPrices.some((price) => Math.abs(price - paidValue) < 0.01)) {
          console.warn(`Valor pago (${paidValue}) não corresponde a nenhum plano ${JSON.stringify(validPrices)} — user ${userId}.`);
          return res.status(400).json({ error: 'Valor do pagamento não corresponde a nenhum plano.' });
        }
      }

      // Atualiza o perfil para PRO (colunas snake_case, conforme o schema)
      const { data, error } = await supabase
        .from('profiles')
        .update({
          plan: 'pro',
          plan_status: 'active',
          trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error || !data) {
        console.error('Error updating profile in Supabase:', error);
        throw error || new Error('Update returned no row');
      }

      console.log(`Successfully upgraded user ${userId} to pro plan.`);
      return res.status(200).json({ success: true, message: 'User upgraded successfully', userId });
    }

    // Resposta padrão para eventos não tratados
    return res.status(200).json({ success: true, message: 'Event ignored' });

  } catch (error: any) {
    console.error('Asaas Webhook Handler Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
