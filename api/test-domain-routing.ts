import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cjcfmbgzuxqprzldighp.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey!);

/**
 * Test endpoint to debug domain routing
 * Usage: POST /api/test-domain-routing
 * Body: { testDomain: "otimizza.com.br" }
 */
export default async function handler(req: any, res: any) {
    // CORS configuration
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Allow both GET and POST
    if (!['GET', 'POST'].includes(req.method)) {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const testDomain = req.body?.testDomain || req.query?.testDomain || 'otimizza.com.br';

        console.log(`\n[TEST-DOMAIN-ROUTING] Testing domain: ${testDomain}`);

        // Test 1: Check if domain exists in profiles
        const { data: profileByDomain, error: error1 } = await supabase
            .from('profiles')
            .select('id, full_name, website_slug, website_active, custom_domain, custom_domain_status, company_name')
            .eq('custom_domain', testDomain)
            .maybeSingle();

        console.log('[TEST] Query by custom_domain:', { profileByDomain, error: error1 });

        // Test 2: Get all domains registered in the system
        const { data: allDomains, error: error2 } = await supabase
            .from('profiles')
            .select('id, website_slug, custom_domain, custom_domain_status')
            .not('custom_domain', 'is', null);

        console.log('[TEST] All registered domains:', { allDomains, error: error2 });

        // Test 3: Check case sensitivity
        const { data: profileLowercase, error: error3 } = await supabase
            .from('profiles')
            .select('id, website_slug, custom_domain')
            .eq('custom_domain', testDomain.toLowerCase())
            .maybeSingle();

        console.log('[TEST] Query with lowercase:', { profileLowercase, error: error3 });

        // Test 4: Search for similar domains
        const { data: similarDomains, error: error4 } = await supabase
            .from('profiles')
            .select('id, website_slug, custom_domain, custom_domain_status')
            .ilike('custom_domain', `%${testDomain.split('.')[0]}%`);

        console.log('[TEST] Similar domains:', { similarDomains, error: error4 });

        return res.status(200).json({
            testDomain,
            results: {
                exactMatch: profileByDomain,
                allRegisteredDomains: allDomains,
                lowercaseMatch: profileLowercase,
                similarMatches: similarDomains,
            },
            diagnostics: {
                foundExactMatch: !!profileByDomain,
                totalDomainsRegistered: allDomains?.length || 0,
                expectedRedirect: profileByDomain?.website_slug ? `/site/${profileByDomain.website_slug}` : 'ERROR: No match',
            }
        });

    } catch (err: any) {
        console.error('[TEST-DOMAIN-ROUTING] Error:', err);
        return res.status(500).json({
            error: err.message,
            type: err.constructor.name
        });
    }
}
