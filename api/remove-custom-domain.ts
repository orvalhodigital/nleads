import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cjcfmbgzuxqprzldighp.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey!);

// Vercel Configuration
const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN || 'vcp_6pJXKRydo1KvxemNVravEnrOG50Nk2gtquWVTPdeJ1qkOZPOmP1Cj8A8';
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID || 'prj_eStX0gJ75PS2ktfzTB6UJjyyCd59';
const VERCEL_API_URL = 'https://api.vercel.com';

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

    try {
        const { domain, userId } = req.body;

        // Validation
        if (!domain || !userId) {
            return res.status(400).json({ error: 'Missing required fields: domain, userId' });
        }

        // Verify the domain belongs to this user
        const { data: profile, error: checkError } = await supabase
            .from('profiles')
            .select('custom_domain')
            .eq('id', userId)
            .single();

        if (checkError || !profile) {
            console.error('Supabase check error:', checkError);
            return res.status(500).json({ error: 'Database error while verifying domain ownership' });
        }

        if (profile.custom_domain !== domain) {
            return res.status(403).json({ error: 'This domain does not belong to your account.' });
        }

        // Remove domain from Vercel
        const vercelResult = await removeDomainFromVercel(domain);

        if (!vercelResult.success) {
            console.warn('Warning: Failed to remove domain from Vercel, but will continue to remove from database:', vercelResult.error);
            // Continue even if Vercel removal fails, as the domain may already be gone
        }

        // Remove domain from Supabase
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                custom_domain: null,
                custom_domain_status: null,
                dns_records: null,
            })
            .eq('id', userId);

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
