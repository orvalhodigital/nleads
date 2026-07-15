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

function isValidDomain(domain: string): boolean {
    const regex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
    return regex.test(domain) && domain.length <= 255;
}

async function registerDomainWithVercel(domain: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        const response = await fetch(`https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${VERCEL_API_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: domain }),
        });

        const data = await response.json();

        if (!response.ok) {
            return { success: false, error: data?.error?.message || `Vercel API error: ${response.status}` };
        }

        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

async function rollbackVercel(domain: string): Promise<void> {
    try {
        await fetch(`https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains/${domain}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${VERCEL_API_TOKEN}` },
        });
    } catch (err) {
        console.error('[register-custom-domain] Rollback Vercel falhou:', err);
    }
}

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
        // 1. Autenticação
        const userId = await getVerifiedUserId(req);
        if (!userId) return res.status(401).json({ error: 'Não autorizado. Token de sessão inválido.' });

        // 2. Validação do body
        const { domain, websiteSlug } = req.body || {};
        if (!domain) return res.status(400).json({ error: 'Campo obrigatório: domain' });
        if (!websiteSlug) return res.status(400).json({ error: 'Configure um slug do site antes de registrar um domínio customizado.' });

        const normalizedDomain = domain.toLowerCase().trim();

        if (!isValidDomain(normalizedDomain)) {
            return res.status(400).json({ error: 'Formato de domínio inválido. Exemplo: seu-site.com.br' });
        }

        console.log('[register-custom-domain] Iniciando registro:', { userId, domain: normalizedDomain });

        // 3. Verificar disponibilidade
        const { data: existing, error: checkError } = await supabase
            .from('profiles')
            .select('id')
            .eq('custom_domain', normalizedDomain)
            .neq('id', userId)
            .maybeSingle();

        if (checkError) {
            console.error('[register-custom-domain] Erro ao verificar disponibilidade:', checkError);
            return res.status(500).json({ error: 'Erro ao verificar disponibilidade do domínio', details: checkError.message });
        }

        if (existing) {
            return res.status(409).json({ error: 'Este domínio já está em uso por outra conta.' });
        }

        // 4. Registrar na Vercel
        const vercelResult = await registerDomainWithVercel(normalizedDomain);
        console.log('[register-custom-domain] Vercel:', vercelResult.success ? 'OK' : vercelResult.error);

        if (!vercelResult.success) {
            return res.status(400).json({ error: vercelResult.error || 'Falha ao registrar domínio na Vercel' });
        }

        // 5. Salvar no banco
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ custom_domain: normalizedDomain })
            .eq('id', userId);

        if (updateError) {
            console.error('[register-custom-domain] Erro ao salvar no banco, fazendo rollback na Vercel:', updateError);
            await rollbackVercel(normalizedDomain);
            return res.status(500).json({ error: 'Erro ao salvar domínio no banco de dados', details: updateError.message });
        }

        console.log('[register-custom-domain] Domínio registrado com sucesso:', normalizedDomain);
        return res.status(200).json({
            success: true,
            message: 'Domínio registrado com sucesso',
            domain: normalizedDomain,
            status: 'pending',
            dnsRecords: [{ type: 'A', name: '@', value: '216.198.79.1' }],
        });

    } catch (error: any) {
        console.error('[register-custom-domain] Erro inesperado:', error);
        return res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
    }
}
