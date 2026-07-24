import { applyCors, getVerifiedUserId } from './_lib/cors';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing required env vars: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const ASAAS_API_KEY = process.env.ASAAS_API_KEY || '';
const ASAAS_API_URL = ASAAS_API_KEY.includes('_hmlg_')
  ? 'https://api-sandbox.asaas.com/v3'
  : 'https://api.asaas.com/v3';

export default async function handler(req: any, res: any) {
  if (applyCors(req, res, 'POST,OPTIONS')) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const authUserId = await getVerifiedUserId(req);
    if (!authUserId) {
      return res.status(401).json({ error: 'Não autorizado. Token de sessão inválido.' });
    }

    const { confirmationText } = req.body || {};

    // 1. Busca perfil do usuário
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', authUserId)
      .single();

    if (profileErr || !profile) {
      return res.status(404).json({ error: 'Perfil do usuário não encontrado' });
    }

    // 2. Validação da confirmação de segurança (nome da empresa ou email)
    const expectedName = (profile.company_name || profile.full_name || profile.email || '').trim().toLowerCase();
    const providedText = String(confirmationText || '').trim().toLowerCase();

    if (!providedText || (providedText !== expectedName && providedText !== 'excluir minha conta')) {
      return res.status(400).json({
        error: 'Texto de confirmação incorreto.',
        detail: 'Digite o nome exato da sua empresa ou "EXCLUIR MINHA CONTA" para confirmar.',
      });
    }

    // 3. Cancela assinatura no Asaas se houver
    if (profile.asaas_subscription_id && ASAAS_API_KEY) {
      try {
        await fetch(`${ASAAS_API_URL}/subscriptions/${profile.asaas_subscription_id}`, {
          method: 'DELETE',
          headers: {
            'access_token': ASAAS_API_KEY,
            'Content-Type': 'application/json',
          },
        });
      } catch (err) {
        console.error('Erro ao cancelar assinatura no Asaas durante exclusão de conta:', err);
      }
    }

    // 4. Exclui registros das tabelas relacionadas (best effort / cascata)
    await Promise.allSettled([
      supabaseAdmin.from('vehicles').delete().eq('user_id', authUserId),
      supabaseAdmin.from('motorcycles').delete().eq('user_id', authUserId),
      supabaseAdmin.from('leads').delete().eq('user_id', authUserId),
      supabaseAdmin.from('sale_details').delete().eq('user_id', authUserId),
      supabaseAdmin.from('audit_logs').delete().eq('user_id', authUserId),
    ]);

    // 5. Exclui linha da tabela profiles
    await supabaseAdmin.from('profiles').delete().eq('id', authUserId);

    // 6. Exclui a conta no Supabase Auth
    const { error: deleteUserErr } = await supabaseAdmin.auth.admin.deleteUser(authUserId);
    if (deleteUserErr) {
      console.error('Erro ao deletar usuário no Supabase Auth:', deleteUserErr);
    }

    return res.status(200).json({
      success: true,
      message: 'Sua conta e todos os dados associados foram excluídos com sucesso.',
    });

  } catch (error: any) {
    console.error('Delete Account Error:', error);
    return res.status(500).json({ error: error?.message || 'Internal Server Error' });
  }
}
