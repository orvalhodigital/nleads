import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing required env vars: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Vercel Configuration
const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;

if (!VERCEL_API_TOKEN || !VERCEL_PROJECT_ID) {
    throw new Error('Missing required env vars: VERCEL_API_TOKEN and VERCEL_PROJECT_ID');
}
const VERCEL_API_URL = 'https://api.vercel.com';

// Verify JWT and return authenticated user ID
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

// Remove domain from Vercel
async function removeDomainFromVercel(domain: string): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        const response = await fetch(`${VERCEL_API_URL}/v10/projects/${VERCEL_PROJECT_ID}/domains/${domain}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${VERCEL_API_TOKEN}`,
            },
        });

        if (!response.ok && response.status !== 404) {
            return {
                success: false,
                error: `Vercel API error: ${response.status}`,
            };
        }

        return {
            success: true,
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Failed to remove domain from Vercel',
        };
    }
}

export default async function handler(req: any, res: any) {
    // CORS configuration
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Use POST.' });
    }

    const verifiedUserId = await getVerifiedUserId(req);
    if (!verifiedUserId) {
        return res.status(401).json({ error: 'Unauthorized. Valid session token required.' });
    }

    try {
        const { domain } = req.body;
        console.log('[remove-custom-domain] Request:', { domain, userId: verifiedUserId });

        // Validation
        if (!domain) {
            return res.status(400).json({ error: 'Missing required field: domain' });
        }

        // Normalize domain
        const normalizedDomain = domain.toLowerCase().trim();

        // Verify the domain belongs to this user
        const { data: profile, error: checkError } = await supabase
            .from('profiles')
            .select('custom_domain')
            .eq('id', verifiedUserId)
            .single();

        console.log('[remove-custom-domain] Profile check:', { profile, error: checkError });

        if (checkError || !profile) {
            console.error('Supabase check error:', checkError);
            return res.status(500).json({ error: 'Database error while verifying domain ownership' });
        }

        const storedDomain = (profile.custom_domain || '').toLowerCase().trim();
        if (storedDomain !== normalizedDomain) {
            console.warn(`Domain mismatch: stored="${storedDomain}" vs request="${normalizedDomain}"`);
            return res.status(403).json({ error: 'This domain does not belong to your account.' });
        }

        // Remove domain from Vercel
        const vercelResult = await removeDomainFromVercel(normalizedDomain);

        if (!vercelResult.success) {
            console.warn('Warning: Failed to remove domain from Vercel, but will continue to remove from database:', vercelResult.error);
            // Continue even if Vercel removal fails, as the domain may already be gone
        }

        // Remove domain from Supabase
        console.log('[remove-custom-domain] Attempting to update database...');
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                custom_domain: null,
            })
            .eq('id', verifiedUserId);
        console.log('[remove-custom-domain] Update result:', { error: updateError });

        if (updateError) {
            console.error('Supabase update error:', updateError);
            return res.status(500).json({ error: 'Failed to remove domain from database' });
        }

        return res.status(200).json({
            success: true,
            message: 'Domain removed successfully',
            domain,
        });

    } catch (error: any) {
        console.error('Handler error:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            details: error.message,
        });
    }
}
