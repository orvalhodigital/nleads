import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing required env vars: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const ALLOWED_ORIGINS = ['https://orvalhodigital.com.br', 'https://www.orvalhodigital.com.br', 'https://painel.orvalhodigital.com.br'];
const ASAAS_API_KEY = process.env.ASAAS_API_KEY || '';
// Ambiente derivado da chave (sandbox tem `_hmlg_`), evita mismatch key/URL. Ver
// create-asaas-payment.ts.
const ASAAS_API_URL = ASAAS_API_KEY.includes('_hmlg_')
  ? 'https://api-sandbox.asaas.com/v3'
  : 'https://api.asaas.com/v3';

// Valida a sessão do chamador via Bearer token e retorna o user id autenticado.
async function getVerifiedUserId(req: any): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ') || !supabaseAnonKey) return null;
  const token = authHeader.slice(7);
  const authClient = createClient(supabaseUrl as string, supabaseAnonKey);
  const { data: { user }, error } = await authClient.auth.getUser(token);
  if (error || !user) return null;
  return user.id;
}

export default async function handler(req: any, res: any) {
  const origin = req.headers.origin || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Autenticação: o chamador precisa estar logado
    const authUserId = await getVerifiedUserId(req);
    if (!authUserId) {
      return res.status(401).json({ error: 'Não autorizado. Token de sessão inválido.' });
    }

    // 1. Busca perfil do usuário para obter o asaas_customer_id
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('asaas_customer_id, asaas_subscription_id')
      .eq('id', authUserId)
      .single();

    if (profileErr || !profile) {
      return res.status(404).json({ error: 'Perfil do usuário não encontrado' });
    }

    const asaasCustomerId = profile.asaas_customer_id;
    if (!asaasCustomerId) {
      return res.status(400).json({ error: 'Este usuário não possui cobranças registradas no Asaas.' });
    }

    if (!ASAAS_API_KEY) {
      return res.status(500).json({ error: 'Asaas API Key is not configured' });
    }

    // 2. Busca os pagamentos do cliente ordenados pelo mais recente no Asaas
    const paymentsRes = await fetch(`${ASAAS_API_URL}/payments?customer=${asaasCustomerId}&limit=1&order=desc`, {
      headers: {
        'access_token': ASAAS_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!paymentsRes.ok) {
      const errText = await paymentsRes.text();
      console.error('Error fetching billing portal from Asaas:', errText);
      throw new Error('Falha ao recuperar faturas do Asaas.');
    }

    const paymentsData = await paymentsRes.json();
    const lastPayment = paymentsData?.data?.[0];

    if (!lastPayment) {
      return res.status(404).json({ error: 'Nenhuma fatura encontrada para este cliente no Asaas.' });
    }

    // Retorna a URL da fatura mais recente (que possui opções de boleto, pix, cartão e histórico)
    return res.status(200).json({
      success: true,
      invoiceUrl: lastPayment.invoiceUrl,
      billingType: lastPayment.billingType,
      value: lastPayment.value,
      status: lastPayment.status,
    });

  } catch (error: any) {
    console.error('Billing Portal Error:', error);
    return res.status(500).json({ error: error?.message || 'Internal Server Error' });
  }
}
