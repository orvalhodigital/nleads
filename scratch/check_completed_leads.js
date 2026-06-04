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
const supabaseKey = env.SUPABASE_SECRET || env.VITE_SUPABASE_ANON_KEY;

async function run() {
  console.log(`Connecting to: ${supabaseUrl}`);
  
  // Count completed leads
  const response = await fetch(supabaseUrl + '/rest/v1/leads?select=id,phase,sale_status,name', {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  });
  if (!response.ok) {
    console.error('Failed to fetch leads', response.status, await response.text());
    return;
  }
  const leads = await response.json();
  console.log(`Total leads fetched: ${leads.length}`);
  
  const completedLeads = leads.filter(l => l.phase === 'Compradores');
  console.log(`Completed leads (phase = Compradores): ${completedLeads.length}`);
  console.log('Sample completed leads:', completedLeads.slice(0, 5));
}

run().catch(console.error);
