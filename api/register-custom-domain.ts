import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cjcfmbgzuxqprzldighp.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey!);

// Vercel Configuration
const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN || 'vcp_6pJXKRydo1KvxemNVravEnrOG50Nk2gtquWVTPdeJ1qkOZPOmP1Cj8A8';
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID || 'prj_eStX0gJ75PS2ktfzTB6UJjyyCd59';
const VERCEL_API_URL = 'https://api.vercel.com';

// Validate domain format
function isValidDomain(domain: string): boolean {
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
    return domainRegex.test(domain) && domain.length <= 255;
}

// Extract DNS records from Vercel response
function extractDnsRecords(vercelDomainData: any): any {
    const records: any[] = [];

    console.log('Vercel domain data:', JSON.stringify(vercelDomainData, null, 2));

    // Check if using Vercel Nameservers or needs manual DNS configuration
    const usingVercelNameservers = !vercelDomainData?.nameservers || vercelDomainData.nameservers.length === 0;

    if (usingVercelNameservers) {
        // When using Vercel nameservers, these are the DNS records that Vercel accepts
        // Users can optionally point A/CNAME records if they want to use another DNS provider
        records.push({
            type: 'A',
            name: '@',
            value: '76.76.21.21',
            description: 'Root domain A record (Vercel IP)'
        });

        records.push({
            type: 'CNAME',
            name: 'www',
            value: 'cname.vercel-dns.com.',
            description: 'WWW subdomain CNAME'
        });

        // Add note about Vercel nameservers
        records.push({
            type: 'NS',
            name: '@',
            value: 'Usar Vercel Nameservers (recomendado)',
            description: 'Mude os nameservers do seu registrador para os da Vercel'
        });
    } else {
        // If using custom nameservers
        vercelDomainData.nameservers.forEach((ns: string, index: number) => {
            records.push({
                type: 'NS',
                name: '@',
                value: ns,
                description: `Nameserver ${index + 1}`
            });
        });
    }

    return records;
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

        // Extract DNS records from Vercel response
        const dnsRecords = extractDnsRecords(responseData);

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

        if (!isValidDomain(domain)) {
            return res.status(400).json({ error: 'Invalid domain format. Must be a valid domain name.' });
        }

        // Check if domain is already in use by another user
        const { data: existingDomain, error: checkError } = await supabase
            .from('profiles')
            .select('id')
            .eq('custom_domain', domain)
            .neq('id', userId)
            .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
            console.error('Supabase check error:', checkError);
            return res.status(500).json({ error: 'Database error while checking domain availability' });
        }

        if (existingDomain) {
            return res.status(409).json({ error: 'This domain is already in use by another account.' });
        }

        // Register domain with Vercel
        const vercelResult = await registerDomainWithVercel(domain);

        if (!vercelResult.success) {
            return res.status(400).json({
                error: vercelResult.error || 'Failed to register domain with Vercel',
            });
        }

        // Save domain and DNS records to Supabase
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                custom_domain: domain,
                custom_domain_status: 'pending',
                dns_records: vercelResult.dnsRecords || [],
            })
            .eq('id', userId);

        if (updateError) {
            console.error('Supabase update error:', updateError);
            // Try to remove from Vercel if DB save fails
            try {
                await fetch(`${VERCEL_API_URL}/v10/projects/${VERCEL_PROJECT_ID}/domains/${domain}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${VERCEL_API_TOKEN}`,
                    },
                });
            } catch (err) {
                console.error('Failed to rollback domain from Vercel:', err);
            }
            return res.status(500).json({ error: 'Failed to save domain to database' });
        }

        return res.status(200).json({
            success: true,
            message: 'Domain registered successfully',
            domain,
            status: 'pending',
            dnsRecords: vercelResult.dnsRecords,
            vercelData: vercelResult.data,
        });

    } catch (error: any) {
        console.error('Handler error:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            details: error.message,
        });
    }
}
