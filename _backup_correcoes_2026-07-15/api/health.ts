export default async function handler(req: any, res: any) {
    res.setHeader('Access-Control-Allow-Origin', '*');

    const checks = {
        VITE_SUPABASE_URL: !!process.env.VITE_SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        VITE_SUPABASE_ANON_KEY: !!process.env.VITE_SUPABASE_ANON_KEY,
        VERCEL_API_TOKEN: !!process.env.VERCEL_API_TOKEN,
        VERCEL_PROJECT_ID: !!process.env.VERCEL_PROJECT_ID,
    };

    const allOk = Object.values(checks).every(Boolean);

    return res.status(allOk ? 200 : 500).json({
        status: allOk ? 'ok' : 'missing_env_vars',
        checks,
    });
}
