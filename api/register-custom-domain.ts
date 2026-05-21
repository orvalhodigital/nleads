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

// Validate domain format
function isValidDomain(domain: string): boolean {
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
    return domainRegex.test(domain) && domain.length <= 255;
}

// Get standard Vercel DNS record
// Only A record needed to point domain to Vercel
function getVercelDnsRecords(): any {
    return [
        {
            type: 'A',
            name: '@',
            value: '216.198.79.1',
            description: 'Apontador para Vercel'
        }
    ];
}

// Register domain with Vercel
async function registerDomainWithVercel(domain: string): Promise<{
    success: boolean;
    data?: any;
    dnsRecords?: any[];
    error?: string;
}> {
    try {
        const response = await fetch(`${VERCEL_API_URL}/v10/projects/${VERCEL_PROJECT_ID}/domains`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${VERCEL_API_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: domain,
                redirect: null,
                redirectStatusCode: null,
            }),
        });

        const responseData = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: responseData?.error?.message || `Vercel API error: ${response.status}`,
            };
        }

        // Get standard Vercel DNS records
        const dnsRecords = getVercelDnsRecords();

        return {
            success: true,
            data: responseData,
            dnsRecords,
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Failed to register domain with Vercel',
        };
    }
}

// Main handler
export default async function handler(req: any, res: any) {
    try {
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
    } catch (err: any) {
        console.error('[register-custom-domain] Init error:', err);
        return res.status(500).json({ error: 'Server initialization error', details: err.message });
    }

    try {
        const { domain, websiteSlug } = req.body;

        // Validation
        if (!domain) {
            return res.status(400).json({ error: 'Missing required field: domain' });
        }

        if (!websiteSlug) {
            return res.status(400).json({ error: 'Missing required field: websiteSlug. Please define a slug for your website before registering a custom domain.' });
        }

        // Normalize domain
        const normalizedDomain = domain.toLowerCase().trim();

        if (!isValidDomain(normalizedDomain)) {
            return res.status(400).json({ error: 'Invalid domain format. Must be a valid domain name.' });
        }

        // Check if domain is already in use by another user
        console.log('[register-custom-domain] Checking domain availability:', normalizedDomain);
        const { data: existingDomain, error: checkError } = await supabase
            .from('profiles')
            .select('id')
            .eq('custom_domain', normalizedDomain)
            .neq('id', verifiedUserId)
            .maybeSingle();

        console.log('[register-custom-domain] Domain check result:', { existingDomain, checkError: checkError?.message });

        if (checkError && checkError.code !== 'PGRST116') {
            console.error('[register-custom-domain] Supabase check error:', checkError);
            return res.status(500).json({
                error: 'Database error while checking domain availability',
                details: checkError.message
            });
        }

        if (existingDomain) {
            console.warn('[register-custom-domain] Domain already in use:', normalizedDomain);
            return res.status(409).json({ error: 'This domain is already in use by another account.' });
        }

        // Register domain with Vercel
        console.log('[register-custom-domain] Registering with Vercel:', normalizedDomain);
        const vercelResult = await registerDomainWithVercel(normalizedDomain);
        console.log('[register-custom-domain] Vercel result:', { success: vercelResult.success, error: vercelResult.error });

        if (!vercelResult.success) {
            return res.status(400).json({
                error: vercelResult.error || 'Failed to register domain with Vercel',
            });
        }

        // Save domain to Supabase
        console.log('[register-custom-domain] Saving to database:', { userId: verifiedUserId, domain: normalizedDomain });
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                custom_domain: normalizedDomain,
            })
            .eq('id', verifiedUserId);

        if (updateError) {
            console.error('[register-custom-domain] Supabase update error:', updateError);
            // Try to remove from Vercel if DB save fails
            try {
                await fetch(`${VERCEL_API_URL}/v10/projects/${VERCEL_PROJECT_ID}/domains/${normalizedDomain}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${VERCEL_API_TOKEN}`,
                    },
                });
            } catch (err) {
                console.error('[register-custom-domain] Failed to rollback domain from Vercel:', err);
            }
            return res.status(500).json({ error: 'Failed to save domain to database', details: updateError.message });
        }

        return res.status(200).json({
            success: true,
            message: 'Domain registered successfully',
            domain: normalizedDomain,
            status: 'pending',
            dnsRecords: vercelResult.dnsRecords,
            vercelData: vercelResult.data,
        });

    } catch (error: any) {
        console.error('[register-custom-domain] Handler error:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            details: error.message || 'Unknown error',
        });
    }
}
