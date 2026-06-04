const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        env[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqY2ZtYmd6dXhxcHJ6bGRpZ2hwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTY1MDkxNiwiZXhwIjoyMDkxMjI2OTE2fQ.X-M3lqJoWceiRigfJkoQvzfnGmhZbHLwnPo0qOtwyjU';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
    const { data, error } = await supabase.rpc('get_tables'); // standard helper if exists, or query public schema
    if (error) {
        console.log("Error calling RPC:", error.message);
        // Let's do raw query if possible or query a known table or public.profiles
        const { data: profiles, error: pErr } = await supabase.from('profiles').select('*').limit(1);
        if (pErr) console.error("Error fetching profiles:", pErr);
        else console.log("Profiles sample:", profiles);
    } else {
        console.log("Tables:", data);
    }
}

run().catch(console.error);
