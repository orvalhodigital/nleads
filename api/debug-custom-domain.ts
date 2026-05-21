import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing required env vars: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getVerifiedUserId(req: any): Promise<string | null> {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return null;
    const token = authHeader.slice(7);
    if (!supabaseAnonKey) return null;
    const authClient = createClient(supabaseUrl!, supabaseAnonKey);
    const { data: { user }, error } = await authClient.auth.getUser(token);
    if (error || !user) return null;
    return user.id;
}

export default async function handler(req: any, res: any) {
    try {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Origin', '*');

        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }

        if (req.method !== 'GET' && req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed. Use GET or POST.' });
        }

        const verifiedUserId = await getVerifiedUserId(req);
        if (!verifiedUserId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        console.log('[debug-custom-domain] User ID:', verifiedUserId);

        // Get user profile with custom domain
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, custom_domain')
            .eq('id', verifiedUserId)
            .single();

        console.log('[debug-custom-domain] Profile query result:', { profile, error: profileError?.message });

        return res.status(200).json({
            userId: verifiedUserId,
            profile: profile ? {
                id: profile.id,
                custom_domain: profile.custom_domain || null,
                has_domain: !!profile.custom_domain,
                domain_length: profile.custom_domain ? profile.custom_domain.length : 0,
            } : null,
            profileError: profileError ? {
                message: profileError.message,
                code: profileError.code,
            } : null,
        });

    } catch (error: any) {
        console.error('[debug-custom-domain] Error:', error);
        return res.status(500).json({
            error: 'Debug error',
            details: error.message,
        });
    }
}
