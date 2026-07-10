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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, ASAAS-Signature');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // Verificar token do webhook para maior segurança
  const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN;
  if (webhookToken) {
    const requestToken = req.headers['asaas-access-token'];
    if (requestToken !== webhookToken) {
      console.warn('Unauthorized webhook request - invalid token');
      return res.status(401).json({ error: 'Unauthorized: invalid webhook token' });
    }
  }

  try {
    const body = req.body || {};
    const { event, payment } = body;

    console.log('Asaas Webhook received event:', event, 'Payment ID:', payment?.id);

    // We process successful payment events
    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
      const userId = payment.externalReference; // The user_id we passed earlier

      if (!userId) {
        console.error('No externalReference (userId) found in payment payload');
        return res.status(400).json({ error: 'Missing externalReference' });
      }

      // Update user plan to 'pro' and planStatus to 'active'
      const { data, error } = await supabase
        .from('profiles')
        .update({
          plan: 'pro',
          planStatus: 'active',
          trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Extend or set plan details
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile in Supabase:', error);
        throw error;
      }

      console.log(`Successfully upgraded user ${userId} to pro plan.`);
      return res.status(200).json({ success: true, message: 'User upgraded successfully', userId });
    }

    // Default response for unhandled events
    return res.status(200).json({ success: true, message: 'Event ignored' });

  } catch (error: any) {
    console.error('Asaas Webhook Handler Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
