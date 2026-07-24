import { applyCors, getVerifiedUserId } from './_lib/cors';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing required env vars: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const ASAAS_API_KEY = process.env.ASAAS_API_KEY || '';
// Ambiente derivado da chave (sandbox tem `_hmlg_`), evita mismatch key/URL. Ver
// create-asaas-payment.ts.
const ASAAS_API_URL = ASAAS_API_KEY.includes('_hmlg_')
  ? 'https://api-sandbox.asaas.com/v3'
  : 'https://api.asaas.com/v3';

export default async function handler(req: any, res: any) {
  if (applyCors(req, res, 'GET,POST,OPTIONS')) return;

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

    let lastPayment: any = null;

    // 2. Busca os pagamentos do cliente pelo customer_id ou pela subscription_id
    if (asaasCustomerId) {
      const paymentsRes = await fetch(`${ASAAS_API_URL}/payments?customer=${asaasCustomerId}&limit=1&order=desc`, {
        headers: {
          'access_token': ASAAS_API_KEY,
          'Content-Type': 'application/json',
        },
      });

      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        lastPayment = paymentsData?.data?.[0];
      }
    }

    if (!lastPayment && profile.asaas_subscription_id) {
      const subPaymentsRes = await fetch(`${ASAAS_API_URL}/payments?subscription=${profile.asaas_subscription_id}&limit=1&order=desc`, {
        headers: {
          'access_token': ASAAS_API_KEY,
          'Content-Type': 'application/json',
        },
      });

      if (subPaymentsRes.ok) {
        const subPaymentsData = await subPaymentsRes.json();
        lastPayment = subPaymentsData?.data?.[0];
      }
    }

    if (!lastPayment) {
      return res.status(404).json({
        error: 'Nenhuma fatura encontrada no Asaas. Redirecionando para a tela de planos em Configurações...',
        redirectToSettings: true,
      });
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
