// Debug endpoint to check what Vercel API returns for a domain
const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN || 'vcp_6pJXKRydo1KvxemNVravEnrOG50Nk2gtquWVTPdeJ1qkOZPOmP1Cj8A8';
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID || 'prj_eStX0gJ75PS2ktfzTB6UJjyyCd59';
const VERCEL_API_URL = 'https://api.vercel.com';

export default async function handler(req: any, res: any) {
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { domain } = req.body;

    if (!domain) {
        return res.status(400).json({ error: 'Missing domain parameter' });
    }

    try {
        // Try to get existing domain info
        const getResponse = await fetch(
            `${VERCEL_API_URL}/v10/projects/${VERCEL_PROJECT_ID}/domains/${domain}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${VERCEL_API_TOKEN}`,
                },
            }
        );

        const domainData = await getResponse.json();

        return res.status(200).json({
            success: true,
            message: 'Domain info from Vercel',
            domain,
            response: domainData,
            keys: Object.keys(domainData),
            verificationRecords: domainData?.verificationRecords,
            nameservers: domainData?.nameservers,
        });
    } catch (error: any) {
        return res.status(500).json({
            error: error.message,
        });
    }
}
