const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    env[match[1]] = value;
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.SUPABASE_SECRET || env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Secret Key not found in .env.local');
  process.exit(1);
}

async function run() {
  console.log(`Fetching OpenAPI spec from: ${supabaseUrl}/rest/v1/`);
  const response = await fetch(supabaseUrl + '/rest/v1/', {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`
    }
  });
  if (!response.ok) {
    console.error('Failed to fetch schema', response.status, await response.text());
    return;
  }
  const spec = await response.json();
  
  // Save full spec for reference
  const outputPath = path.resolve(__dirname, 'supabase_schema.json');
  fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2), 'utf8');
  console.log(`Saved full schema to: ${outputPath}`);

  // Extract tables from definitions
  const tables = spec.definitions ? Object.keys(spec.definitions) : [];
  console.log('\n--- REMOTE TABLES IN SUPABASE ---');
  console.log(tables.join(', '));
}

run().catch(console.error);
