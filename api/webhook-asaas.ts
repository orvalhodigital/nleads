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

    console.log('Asaas Webhook received event:', event, 'Payment ID:', payment?.id, 'Subscription:', payment?.subscription);

    // Resolve o usuário dono do pagamento: primeiro pelo externalReference
    // (enviado na criação da assinatura), com fallback para procurar pelo
    // subscription id salvo no perfil — cobre o caso de o Asaas não propagar
    // o externalReference da assinatura para os pagamentos gerados por ela.
    async function resolveUserId(): Promise<string | null> {
      if (payment?.externalReference) return payment.externalReference;
      if (payment?.subscription) {
        const { data } = await supabase
          .from('profiles')
          .select('id')
          .eq('asaas_subscription_id', payment.subscription)
          .single();
        return data?.id || null;
      }
      return null;
    }

    // ─── Pagamento confirmado (primeira cobrança OU renovação mensal) ──────
    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
      const userId = await resolveUserId();
      if (!userId) {
        console.error('Não foi possível identificar o usuário (sem externalReference nem subscription conhecida)');
        return res.status(400).json({ error: 'Missing externalReference/subscription' });
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, last_asaas_payment_id, asaas_subscription_id')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        console.error('Profile não encontrado para userId:', userId, profileError);
        return res.status(404).json({ error: 'Profile not found' });
      }

      // Idempotência POR PAGAMENTO (não mais por "já está pro/ativo" — isso
      // fazia a renovação do 2º mês em diante ser sempre ignorada, porque o
      // usuário já estava pro/ativo desde o 1º pagamento, e a data de acesso
      // nunca era estendida).
      if (payment?.id && profile.last_asaas_payment_id === payment.id) {
        console.log(`Pagamento ${payment.id} já processado — evento ignorado (idempotência).`);
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

      // Estende o acesso por mais 1 ciclo (30 dias) a partir de agora — tanto
      // para o primeiro pagamento quanto para cada renovação mensal.
      const updatePayload: Record<string, any> = {
        plan: 'pro',
        plan_status: 'active',
        trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
      if (payment?.id) updatePayload.last_asaas_payment_id = payment.id;
      if (payment?.subscription && !profile.asaas_subscription_id) {
        updatePayload.asaas_subscription_id = payment.subscription;
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', userId)
        .select()
        .single();

      if (error || !data) {
        console.error('Error updating profile in Supabase:', error);
        throw error || new Error('Update returned no row');
      }

      console.log(`Successfully upgraded/renewed user ${userId} to pro plan.`);
      return res.status(200).json({ success: true, message: 'User upgraded successfully', userId });
    }

    // ─── Pagamento atrasado — sinaliza o status, mas não bloqueia na hora.  ──
    // O bloqueio real acontece sozinho quando `trial_ends_at` (a data até
    // quando o acesso pago vale) expira — profileService.ts já trata isso na
    // leitura do perfil, rebaixando `plan` para 'free' automaticamente.
    if (event === 'PAYMENT_OVERDUE') {
      const userId = await resolveUserId();
      if (!userId) {
        console.warn('PAYMENT_OVERDUE sem usuário identificável — ignorado.');
        return res.status(200).json({ success: true, message: 'No user to flag' });
      }
      const { error } = await supabase
        .from('profiles')
        .update({ plan_status: 'overdue' })
        .eq('id', userId);
      if (error) console.error('Erro ao marcar plan_status=overdue:', error);
      console.log(`User ${userId} marcado como pagamento atrasado.`);
      return res.status(200).json({ success: true, message: 'Marked overdue', userId });
    }

    // ─── Estorno/exclusão do pagamento ou cancelamento da assinatura —      ──
    // revoga o acesso imediatamente, independente da data de expiração.
    if (event === 'PAYMENT_DELETED' || event === 'PAYMENT_REFUNDED' || event === 'SUBSCRIPTION_DELETED' || event === 'SUBSCRIPTION_INACTIVATED') {
      const userId = await resolveUserId();
      if (!userId) {
        console.warn(`${event} sem usuário identificável — ignorado.`);
        return res.status(200).json({ success: true, message: 'No user to revoke' });
      }
      const { error } = await supabase
        .from('profiles')
        .update({ plan: 'free', plan_status: 'canceled' })
        .eq('id', userId);
      if (error) console.error('Erro ao revogar acesso:', error);
      console.log(`Acesso pro revogado para user ${userId} (evento ${event}).`);
      return res.status(200).json({ success: true, message: 'Access revoked', userId });
    }

    // Resposta padrão para eventos não tratados
    return res.status(200).json({ success: true, message: 'Event ignored' });

  } catch (error: any) {
    console.error('Asaas Webhook Handler Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
