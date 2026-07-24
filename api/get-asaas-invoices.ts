import { applyCors, getVerifiedUserId } from './_lib/cors';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing required env vars: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const ASAAS_API_KEY = process.env.ASAAS_API_KEY || '';
const ASAAS_API_URL = ASAAS_API_KEY.includes('_hmlg_')
  ? 'https://api-sandbox.asaas.com/v3'
  : 'https://api.asaas.com/v3';

export default async function handler(req: any, res: any) {
  if (applyCors(req, res, 'GET,POST,OPTIONS')) return;

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const authUserId = await getVerifiedUserId(req);
    if (!authUserId) {
      return res.status(401).json({ error: 'Não autorizado. Token de sessão inválido.' });
    }

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
      return res.status(200).json({ success: true, invoices: [] });
    }

    if (!ASAAS_API_KEY) {
      return res.status(500).json({ error: 'Asaas API Key is not configured' });
    }

    // Busca até 50 pagamentos recentes no Asaas para este cliente
    const paymentsRes = await fetch(`${ASAAS_API_URL}/payments?customer=${asaasCustomerId}&limit=50&order=desc`, {
      headers: {
        'access_token': ASAAS_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!paymentsRes.ok) {
      const errText = await paymentsRes.text();
      console.error('Error fetching invoices from Asaas:', errText);
      throw new Error('Falha ao recuperar faturas do Asaas.');
    }

    const paymentsData = await paymentsRes.json();
    const rawPayments = paymentsData?.data || [];

    const invoices = rawPayments.map((p: any) => ({
      id: p.id,
      dateCreated: p.dateCreated,
      dueDate: p.dueDate,
      paymentDate: p.paymentDate || p.clientPaymentDate || null,
      value: p.value,
      netValue: p.netValue,
      status: p.status, // RECEIVED, CONFIRMED, PENDING, OVERDUE, CANCELLED, REFUNDED
      billingType: p.billingType, // PIX, CREDIT_CARD, BOLETO, UNDEFINED
      description: p.description || 'Assinatura Gestor de Pátio',
      invoiceUrl: p.invoiceUrl,
      bankSlipUrl: p.bankSlipUrl || null,
      transactionReceiptUrl: p.transactionReceiptUrl || null,
      invoiceNumber: p.invoiceNumber || p.id,
    }));

    return res.status(200).json({
      success: true,
      invoices,
    });

  } catch (error: any) {
    console.error('Get Asaas Invoices Error:', error);
    return res.status(500).json({ error: error?.message || 'Internal Server Error' });
  }
}
