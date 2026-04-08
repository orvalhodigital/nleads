import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client
// Note: In production, configure these as Environment Variables in Vercel
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://supabase.orvalhodigital.com.br';
// Use Service Role Key for backend operations if available, otherwise fallback to Anon key (which might need RLS policies adjusted for public inserts)
// Providing the anon key here as fallback based on project config
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzE1MDUwODAwLAogICJleHAiOiAxODcyODE3MjAwCn0.LdVhXiWHbpkfQjLkY4hkeOf0RXozK5acvCHvid4SZOQ';

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: any, res: any) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const body = req.body || {};
    const { name, phone, email, source, notes, temperature } = body;

    // Validation
    if (!name || !phone) {
      return res.status(400).json({ error: 'Missing required fields: name, phone' });
    }

    // Construct Lead Object
    const newLead = {
      name,
      phone,
      email: email || '',
      phase: 'Novo Lead', // Default starting phase
      temperature: temperature || 'Fria',
      source: source || 'Webhook',
      notes: notes || 'Importado via Webhook',
      preferences: {
        types: [],
        brands: [],
        models: [],
        transmission: 'Em aberto',
        engine: 'Em aberto',
        additionalNotes: ''
      },
      presented_vehicles: [],
      funnel_history: {}
    };

    // Insert into Supabase
    // Note: If you have Row Level Security (RLS) enabled, ensure the Key used has permission to insert,
    // or use the SERVICE_ROLE_KEY environment variable.
    const { data, error } = await supabase
      .from('leads')
      .insert(newLead)
      .select()
      .single();

    if (error) {
      console.error('Supabase Insert Error:', error);

      // Check for RLS policy violation
      if (error.code === '42501') {
        console.error('CRITICAL: Permission denied. This is likely due to Row Level Security (RLS).');
        console.error('Ensure you are using the SUPABASE_SERVICE_ROLE_KEY in your environment variables to bypass RLS for webhooks.');
        return res.status(403).json({
          error: 'Permission Denied',
          details: 'Database rejected the insertion. Check RLS policies or Service Key configuration.',
          hint: 'Webhooks require SUPABASE_SERVICE_ROLE_KEY to bypass RLS.'
        });
      }

      throw error;
    }

    return res.status(200).json({
      success: true,
      message: 'Lead imported successfully',
      data
    });

  } catch (error: any) {
    console.error('Webhook Handler Error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      details: error.message
    });
  }
}
