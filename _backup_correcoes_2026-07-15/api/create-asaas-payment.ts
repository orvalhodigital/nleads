import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing required env vars: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const ALLOWED_ORIGINS = ['https://nleads.pro', 'https://nleads.com.br', 'https://www.nleads.pro', 'https://www.nleads.com.br'];
const ASAAS_API_KEY = process.env.ASAAS_API_KEY || '';
const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://api.asaas.com/v3';

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

  try {
    const { userId, planId } = req.body || {};

    if (!userId || !planId) {
      return res.status(400).json({ error: 'Missing required fields: userId, planId' });
    }

    // 1. Fetch user profile and plan details
    const [profileRes, planRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('plans').select('*').eq('id', planId).single(),
    ]);

    if (profileRes.error || !profileRes.data) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    if (planRes.error || !planRes.data) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const profile = profileRes.data;
    const plan = planRes.data;

    if (!ASAAS_API_KEY) {
      return res.status(500).json({ error: 'Asaas API Key is not configured' });
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
          name: profile.full_name || profile.company_name || 'Cliente Otimizza CRM',
          email: profile.email,
          phone: profile.phone || '',
        }),
      });

      if (!createCustomerRes.ok) {
        const errText = await createCustomerRes.text();
        console.error('Error creating customer in Asaas:', errText);
        throw new Error('Failed to create customer in Asaas');
      }

      const customerData = await createCustomerRes.json();
      asaasCustomerId = customerData.id;
    }

    // 3. Create Payment Billing in Asaas
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3); // 3 days from now
    const formattedDueDate = dueDate.toISOString().split('T')[0];

    const paymentRes = await fetch(`${ASAAS_API_URL}/payments`, {
      method: 'POST',
      headers: {
        'access_token': ASAAS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer: asaasCustomerId,
        billingType: 'UNDEFINED', // Allows Credit Card, Pix, Boleto
        value: plan.price,
        dueDate: formattedDueDate,
        description: `Upgrade de Plano: ${plan.name}`,
        externalReference: userId,
      }),
    });

    if (!paymentRes.ok) {
      const errText = await paymentRes.text();
      console.error('Error creating payment in Asaas:', errText);
      throw new Error('Failed to create payment in Asaas');
    }

    const paymentData = await paymentRes.json();

    return res.status(200).json({
      success: true,
      invoiceUrl: paymentData.invoiceUrl, // Link de checkout do Asaas
      bankSlipUrl: paymentData.bankSlipUrl,
      paymentId: paymentData.id,
    });

  } catch (error: any) {
    console.error('Create Asaas Payment Error:', error);
    return res.status(500).json({ error: error?.message || 'Internal Server Error' });
  }
}
