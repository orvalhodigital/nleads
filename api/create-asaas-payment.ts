import { applyCors, getVerifiedUserId } from './_lib/cors';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Este endpoint LÊ profiles ignorando RLS — precisa da service_role. NÃO cair
// para a anon: depois do A34 a anon nem lê profiles, então o fallback só
// mascarava o erro real como "Profile not found".
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing required env vars: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const ASAAS_API_KEY = process.env.ASAAS_API_KEY || '';
// O ambiente do Asaas é determinado pela CHAVE, não por uma env separada: chaves
// de sandbox têm o marcador `_hmlg_` (homologação). Derivar a URL da chave evita
// o erro "a chave de API não pertence a este ambiente" (mismatch entre
// ASAAS_API_KEY e ASAAS_API_URL). Para produção real, basta trocar a chave por
// uma de produção — a URL segue automaticamente.
const ASAAS_API_URL = ASAAS_API_KEY.includes('_hmlg_')
  ? 'https://api-sandbox.asaas.com/v3'
  : 'https://api.asaas.com/v3';

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    // Autenticação: o chamador precisa estar logado e só pode gerar cobrança para si mesmo.
    const authUserId = await getVerifiedUserId(req);
    if (!authUserId) {
      return res.status(401).json({ error: 'Não autorizado. Token de sessão inválido.' });
    }

    const { userId, planId } = req.body || {};

    if (!userId || !planId) {
      return res.status(400).json({ error: 'Missing required fields: userId, planId' });
    }

    if (userId !== authUserId) {
      return res.status(403).json({ error: 'Você só pode gerar cobrança para a própria conta.' });
    }

    // 1. Fetch user profile and plan details (aceita planId como UUID ou slug)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(planId));
    const planQuery = isUuid
      ? supabase.from('plans').select('*').eq('id', planId).single()
      : supabase.from('plans').select('*').eq('slug', planId).single();

    const [profileRes, planRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      planQuery,
    ]);

    if (profileRes.error || !profileRes.data) {
      // Surfacing do erro real: "Profile not found" genérico escondia a causa
      // (ex.: service_role inválida/expirada na Vercel → PostgREST recusa a query).
      console.error('[create-asaas-payment] profile lookup falhou:', profileRes.error);
      return res.status(404).json({
        error: 'Profile not found',
        detail: profileRes.error?.message || 'nenhuma linha para este id',
        code: profileRes.error?.code || null,
      });
    }

    if (planRes.error || !planRes.data) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const profile = profileRes.data;
    const plan = planRes.data;

    if (!ASAAS_API_KEY) {
      return res.status(500).json({ error: 'Asaas API Key is not configured' });
    }

    // O Asaas EXIGE cpfCnpj para criar um cliente que será cobrado. Vem do body
    // (informado no checkout) ou do que já está salvo no perfil. Sem isso, a
    // criação do cliente falha ("Failed to create customer in Asaas").
    const cpfCnpj = String(req.body?.cpfCnpj || profile.cpf_cnpj || '').replace(/\D/g, '');
    if (cpfCnpj.length !== 11 && cpfCnpj.length !== 14) {
      return res.status(400).json({
        error: 'CPF/CNPJ obrigatório',
        detail: 'Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido para gerar a cobrança.',
        needsCpfCnpj: true,
      });
    }

    // 2. Search or Create Customer in Asaas
    let asaasCustomerId = '';
    const searchUrl = `${ASAAS_API_URL}/customers?email=${encodeURIComponent(profile.email)}`;
    const searchRes = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'access_token': ASAAS_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.data && searchData.data.length > 0) {
        asaasCustomerId = searchData.data[0].id;
      }
    }

    if (!asaasCustomerId) {
      const createCustomerRes = await fetch(`${ASAAS_API_URL}/customers`, {
        method: 'POST',
        headers: {
          'access_token': ASAAS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profile.full_name || profile.company_name || 'Cliente Gestor de Pátio',
          email: profile.email,
          phone: (profile.phone || '').replace(/\D/g, ''),
          cpfCnpj,
        }),
      });

      if (!createCustomerRes.ok) {
        const errText = await createCustomerRes.text();
        console.error('Error creating customer in Asaas:', errText);
        // Surfacing da mensagem real do Asaas (ex.: "CPF/CNPJ inválido").
        let detail = errText;
        try {
          const parsed = JSON.parse(errText);
          detail = parsed?.errors?.[0]?.description || errText;
        } catch { /* mantém o texto cru */ }
        return res.status(400).json({ error: 'Falha ao criar cliente no Asaas', detail });
      }

      const customerData = await createCustomerRes.json();
      asaasCustomerId = customerData.id;
    }

    // Persiste o cpfCnpj no perfil para os próximos checkouts não pedirem de novo.
    // Best-effort: se a coluna ainda não existir (migração pendente), não quebra
    // o fluxo de pagamento — só não guarda para a próxima vez.
    if (!profile.cpf_cnpj) {
      try {
        await supabase.from('profiles').update({ cpf_cnpj: cpfCnpj }).eq('id', userId);
      } catch (e) {
        console.error('[create-asaas-payment] não foi possível salvar cpf_cnpj no perfil:', e);
      }
    }

    // 3. Reaproveita assinatura existente e ATIVA no Asaas, se houver — evita
    // criar uma segunda assinatura duplicada (cobrando o cliente duas vezes)
    // quando ele clica em "Adquirir Plano" mais de uma vez.
    let subscriptionId: string | null = profile.asaas_subscription_id || null;
    let subscriptionIsActive = false;

    if (subscriptionId) {
      const existingRes = await fetch(`${ASAAS_API_URL}/subscriptions/${subscriptionId}`, {
        headers: { 'access_token': ASAAS_API_KEY, 'Content-Type': 'application/json' },
      });
      if (existingRes.ok) {
        const existing = await existingRes.json();
        subscriptionIsActive = existing.status === 'ACTIVE';
      } else {
        subscriptionId = null; // assinatura não existe mais no Asaas (ex.: apagada manualmente)
      }
    }

    if (!subscriptionId || !subscriptionIsActive) {
      const nextDueDate = new Date();
      nextDueDate.setDate(nextDueDate.getDate() + 3); // 3 dias para o primeiro pagamento
      const formattedDueDate = nextDueDate.toISOString().split('T')[0];

      const subscriptionRes = await fetch(`${ASAAS_API_URL}/subscriptions`, {
        method: 'POST',
        headers: {
          'access_token': ASAAS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer: asaasCustomerId,
          billingType: 'UNDEFINED', // Cliente escolhe Cartão, Pix ou Boleto no checkout
          value: plan.price,
          nextDueDate: formattedDueDate,
          cycle: 'MONTHLY',
          description: `Assinatura ${plan.name}`,
          externalReference: userId,
        }),
      });

      if (!subscriptionRes.ok) {
        const errText = await subscriptionRes.text();
        console.error('Error creating subscription in Asaas:', errText);
        throw new Error('Failed to create subscription in Asaas');
      }

      const subscriptionData = await subscriptionRes.json();
      subscriptionId = subscriptionData.id;

      // Salva a referência da assinatura no perfil ANTES de retornar o link de
      // checkout — o webhook precisa disso para identificar o usuário mesmo
      // que o Asaas não propague `externalReference` para o pagamento gerado.
      await supabase
        .from('profiles')
        .update({ asaas_customer_id: asaasCustomerId, asaas_subscription_id: subscriptionId })
        .eq('id', userId);
    }

    // 4. Busca o primeiro pagamento gerado pela assinatura para obter o link de checkout
    const paymentsRes = await fetch(`${ASAAS_API_URL}/payments?subscription=${subscriptionId}&limit=1&order=asc`, {
      headers: { 'access_token': ASAAS_API_KEY, 'Content-Type': 'application/json' },
    });

    if (!paymentsRes.ok) {
      const errText = await paymentsRes.text();
      console.error('Error fetching subscription payment in Asaas:', errText);
      throw new Error('Failed to fetch subscription payment in Asaas');
    }

    const paymentsData = await paymentsRes.json();
    const firstPayment = paymentsData?.data?.[0];

    if (!firstPayment) {
      throw new Error('Assinatura criada, mas nenhuma cobrança foi gerada ainda.');
    }

    return res.status(200).json({
      success: true,
      invoiceUrl: firstPayment.invoiceUrl, // Link de checkout do Asaas
      bankSlipUrl: firstPayment.bankSlipUrl,
      paymentId: firstPayment.id,
      subscriptionId,
    });

  } catch (error: any) {
    console.error('Create Asaas Payment Error:', error);
    return res.status(500).json({ error: error?.message || 'Internal Server Error' });
  }
}
