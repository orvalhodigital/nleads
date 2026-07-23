import { createClient } from '@supabase/supabase-js';

export const ALLOWED_ORIGINS = [
  'https://orvalhodigital.com.br',
  'https://www.orvalhodigital.com.br',
  'https://painel.orvalhodigital.com.br',
];

/**
 * Applies standard CORS headers to serverless API functions.
 * Returns true if the request was an OPTIONS preflight request (already ended),
 * or false if processing should continue.
 */
export function applyCors(req: any, res: any, methods: string = 'POST,OPTIONS'): boolean {
  const origin = req.headers.origin || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }

  return false;
}

/**
 * Validates bearer token against Supabase Auth and returns the verified user ID.
 */
export async function getVerifiedUserId(req: any): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const token = authHeader.slice(7);
  const authClient = createClient(supabaseUrl, supabaseAnonKey);
  const { data: { user }, error } = await authClient.auth.getUser(token);
  if (error || !user) return null;
  return user.id;
}
