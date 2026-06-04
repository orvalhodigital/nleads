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
    console.log("--- LISTING BUCKETS ---");
    const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
    if (bErr) {
        console.error("Error listing buckets:", bErr);
    } else {
        console.log("Buckets:", buckets);
    }

    console.log("\n--- SYSTEM_ASSETS BUCKET FILES ---");
    const { data: files, error: fErr } = await supabase.storage.from('system_assets').list();
    if (fErr) {
        console.error("Error listing files in system_assets:", fErr);
    } else {
        console.log("Files in system_assets:", files);
    }
}

run().catch(console.error);
