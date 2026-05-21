import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;
const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN!;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getVerifiedUserId(req: any): Promise<string | null> {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return null;
    const token = authHeader.slice(7);
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error } = await authClient.auth.getUser(token);
    if (error || !user) return null;
    return user.id;
}

async function removeDomainFromVercel(domain: string): Promise<void> {
    try {
        await fetch(`https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains/${domain}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${VERCEL_API_TOKEN}` },
        });
        // Ignora erro — domínio pode não existir na Vercel e tudo bem
    } catch (err) {
        console.warn('[remove-custom-domain] Vercel removal failed (non-critical):', err);
    }
}

export default async function handler(req: any, res: any) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        // 1. Autenticação
        const userId = await getVerifiedUserId(req);
        if (!userId) return res.status(401).json({ error: 'Não autorizado. Token de sessão inválido.' });

        // 2. Validação do body
        const { domain } = req.body || {};
        if (!domain) return res.status(400).json({ error: 'Campo obrigatório: domain' });

        const normalizedDomain = domain.toLowerCase().trim();
        console.log('[remove-custom-domain] Iniciando remoção:', { userId, domain: normalizedDomain });

        // 3. Verificar se o domínio pertence ao usuário
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('custom_domain')
            .eq('id', userId)
            .single();

        if (profileError) {
            console.error('[remove-custom-domain] Erro ao buscar perfil:', profileError);
            return res.status(500).json({ error: 'Erro ao buscar perfil no banco de dados', details: profileError.message });
        }

        if (!profile) {
            return res.status(404).json({ error: 'Perfil não encontrado' });
        }

        const storedDomain = (profile.custom_domain || '').toLowerCase().trim();
        console.log('[remove-custom-domain] Comparando domínios:', { stored: storedDomain, requested: normalizedDomain });

        if (!storedDomain) {
            return res.status(404).json({ error: 'Nenhum domínio customizado cadastrado nesta conta' });
        }

        if (storedDomain !== normalizedDomain) {
            return res.status(403).json({ error: 'Este domínio não pertence à sua conta' });
        }

        // 4. Remover da Vercel (não crítico — continua mesmo se falhar)
        await removeDomainFromVercel(normalizedDomain);

        // 5. Remover do banco de dados (crítico)
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ custom_domain: null })
            .eq('id', userId);

        if (updateError) {
            console.error('[remove-custom-domain] Erro ao atualizar banco:', updateError);
            return res.status(500).json({ error: 'Erro ao remover domínio do banco de dados', details: updateError.message });
        }

        console.log('[remove-custom-domain] Domínio removido com sucesso:', normalizedDomain);
        return res.status(200).json({ success: true, message: 'Domínio removido com sucesso', domain: normalizedDomain });

    } catch (error: any) {
        console.error('[remove-custom-domain] Erro inesperado:', error);
        return res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
    }
}
