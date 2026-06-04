const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local manually
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
// Use the service_role JWT key we retrieved
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqY2ZtYmd6dXhxcHJ6bGRpZ2hwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTY1MDkxNiwiZXhwIjoyMDkxMjI2OTE2fQ.X-M3lqJoWceiRigfJkoQvzfnGmhZbHLwnPo0qOtwyjU';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false
    }
});

async function run() {
    console.log("--- SYSTEM SETTINGS ---");
    const { data: settings, error: sErr } = await supabase.from('system_settings').select('*');
    if (sErr) console.error("Error fetching system settings:", sErr);
    else console.log(settings);

    console.log("\n--- PLANS ---");
    const { data: plans, error: pErr } = await supabase.from('plans').select('*');
    if (pErr) console.error("Error fetching plans:", pErr);
    else console.log(plans);
}

run().catch(console.error);
