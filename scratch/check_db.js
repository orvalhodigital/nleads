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
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

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
