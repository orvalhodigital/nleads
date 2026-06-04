import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
    const ALLOWED_ORIGINS = ['https://nleads.pro', 'https://nleads.com.br', 'https://www.nleads.pro', 'https://www.nleads.com.br'];
    const origin = req.headers.origin || '';
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]);
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        // STEP 1: Verificar env vars
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
        const vercelToken = process.env.VERCEL_API_TOKEN;
        const vercelProjectId = process.env.VERCEL_PROJECT_ID;

        if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
            console.error('[remove] STEP 1 FAIL: env vars ausentes', {
                supabaseUrl: !!supabaseUrl,
                supabaseServiceKey: !!supabaseServiceKey,
                supabaseAnonKey: !!supabaseAnonKey,
            });
            return res.status(500).json({ error: 'Configuração do servidor incompleta (env vars)' });
        }

        // STEP 2: Autenticação JWT
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Token de autorização ausente' });
        }

        const token = authHeader.slice(7);
        const authClient = createClient(supabaseUrl, supabaseAnonKey);
        const { data: { user }, error: authError } = await authClient.auth.getUser(token);

        if (authError || !user) {
            console.error('[remove] STEP 2 FAIL: auth error', authError?.message);
            return res.status(401).json({ error: 'Sessão inválida ou expirada. Faça login novamente.' });
        }

        const userId = user.id;
        console.log('[remove] STEP 2 OK: userId =', userId);

        // STEP 3: Validar body
        const { domain } = req.body || {};
        if (!domain || typeof domain !== 'string') {
            return res.status(400).json({ error: 'Campo obrigatório: domain' });
        }

        const normalizedDomain = domain.toLowerCase().trim();
        console.log('[remove] STEP 3 OK: domain =', normalizedDomain);

        // STEP 4: Buscar perfil e verificar propriedade
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('custom_domain')
            .eq('id', userId)
            .single();

        if (profileError) {
            console.error('[remove] STEP 4 FAIL: profileError', profileError.message, profileError.code);
            return res.status(500).json({
                error: 'Erro ao buscar perfil',
                details: profileError.message,
                code: profileError.code,
            });
        }

        if (!profile) {
            console.error('[remove] STEP 4 FAIL: perfil não encontrado para', userId);
            return res.status(404).json({ error: 'Perfil não encontrado' });
        }

        const storedDomain = (profile.custom_domain || '').toLowerCase().trim();
        console.log('[remove] STEP 4 OK: storedDomain =', storedDomain || '(vazio)');

        if (!storedDomain) {
            return res.status(404).json({ error: 'Nenhum domínio customizado cadastrado' });
        }

        if (storedDomain !== normalizedDomain) {
            return res.status(403).json({
                error: 'Domínio não pertence a esta conta',
                stored: storedDomain,
                requested: normalizedDomain,
            });
        }

        // STEP 5: Remover da Vercel (não crítico)
        if (vercelToken && vercelProjectId) {
            try {
                const vRes = await fetch(
                    `https://api.vercel.com/v10/projects/${vercelProjectId}/domains/${normalizedDomain}`,
                    { method: 'DELETE', headers: { Authorization: `Bearer ${vercelToken}` } }
                );
                console.log('[remove] STEP 5: Vercel status =', vRes.status);
            } catch (vErr: any) {
                console.warn('[remove] STEP 5 WARN: Vercel removal failed (non-critical):', vErr.message);
            }
        } else {
            console.warn('[remove] STEP 5 SKIP: Vercel env vars ausentes');
        }

        // STEP 6: Remover do banco (crítico)
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ custom_domain: null })
            .eq('id', userId);

        if (updateError) {
            console.error('[remove] STEP 6 FAIL: updateError', updateError.message);
            return res.status(500).json({
                error: 'Erro ao remover domínio do banco de dados',
                details: updateError.message,
            });
        }

        console.log('[remove] STEP 6 OK: domínio removido do banco');
        return res.status(200).json({ success: true, message: 'Domínio removido com sucesso', domain: normalizedDomain });

    } catch (error: any) {
        console.error('[remove] UNCAUGHT ERROR:', error?.message, error?.stack);
        return res.status(500).json({ error: 'Erro interno inesperado', details: error?.message });
    }
}
