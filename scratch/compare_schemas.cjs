const fs = require('fs');
const path = require('path');

// Load remote schema
const remoteSchemaPath = path.resolve(__dirname, 'supabase_schema.json');
if (!fs.existsSync(remoteSchemaPath)) {
  console.error('Remote schema JSON not found. Run check_supabase.cjs first.');
  process.exit(1);
}
const remoteSchema = JSON.parse(fs.readFileSync(remoteSchemaPath, 'utf8'));
const remoteTables = remoteSchema.definitions ? Object.keys(remoteSchema.definitions) : [];

// 1. Gather all tables referenced in codebase with `.from('table_name')`
function getReferencedTables() {
  const srcDir = path.resolve(__dirname, '../src');
  const tables = new Set();
  
  function scanDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        scanDir(fullPath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        // Match .from('tableName') or .from("tableName")
        const matches = content.matchAll(/\.from\(['"]([^'"]+)['"]\)/g);
        for (const match of matches) {
          // ignore storage buckets (identified by supabase.storage.from)
          if (!content.substring(match.index - 20, match.index).includes('storage.')) {
            tables.add(match[1]);
          }
        }
      }
    }
  }
  
  scanDir(srcDir);
  return Array.from(tables);
}

// 2. Parse database.types.ts to see what columns are defined locally for vehicles, leads, profiles
function getLocalTypes() {
  const localTypesPath = path.resolve(__dirname, '../src/lib/database.types.ts');
  if (!fs.existsSync(localTypesPath)) {
    return null;
  }
  const content = fs.readFileSync(localTypesPath, 'utf8');
  
  // We can write a simple parser or inspect the content
  // Since we want accuracy, let's extract the public Tables object.
  // We look for table definitions inside Tables: { ... }
  // A table starts with "tableName: {" and then has "Row: { ... }"
  const localTables = {};
  
  // Simple regex parser for database.types.ts
  const tableBlockRegex = /(\w+):\s*\{\s*Row:\s*\{([\s\S]*?)\}\s*Insert:/g;
  let match;
  while ((match = tableBlockRegex.exec(content)) !== null) {
    const tableName = match[1];
    const rowBody = match[2];
    const columns = {};
    
    // Parse individual columns
    const colRegex = /^\s*(\w+)\s*:\s*([^:\r\n]+)/gm;
    let colMatch;
    while ((colMatch = colRegex.exec(rowBody)) !== null) {
      columns[colMatch[1]] = colMatch[2].trim();
    }
    localTables[tableName] = columns;
  }
  
  return localTables;
}

const referencedTables = getReferencedTables();
const localTypes = getLocalTypes();

console.log('=== SCHEMA COMPARISON REPORT ===');

// Check missing tables
console.log('\n--- 1. TABLE PRESENCE CHECK ---');
const missingTables = referencedTables.filter(t => !remoteTables.includes(t));
if (missingTables.length > 0) {
  console.log('❌ Tables used in frontend code (.from()) but NOT found in Supabase:');
  missingTables.forEach(t => console.log(`   - ${t}`));
} else {
  console.log('✅ All tables referenced in frontend code exist in Supabase.');
}

const extraTables = remoteTables.filter(t => !referencedTables.includes(t));
if (extraTables.length > 0) {
  console.log('\nℹ️ Tables present in Supabase but not directly queried in frontend code:');
  extraTables.forEach(t => console.log(`   - ${t}`));
}

// Check columns for referenced tables
console.log('\n--- 2. COLUMN ALIGNMENT FOR KEY TABLES ---');

// We want to check: profiles, vehicles, leads, motorcycles, support_tickets, ticket_messages, onboarding_sessions, plans, campaigns, notifications
const keyTables = [
  'profiles', 'vehicles', 'leads', 'motorcycles', 'support_tickets', 
  'ticket_messages', 'onboarding_sessions', 'plans', 'campaigns', 'notifications'
];

for (const tableName of keyTables) {
  if (!remoteTables.includes(tableName)) {
    console.log(`⚠️ Table "${tableName}" does not exist in remote Supabase.`);
    continue;
  }
  
  console.log(`\nTable: ${tableName}`);
  const remoteCols = remoteSchema.definitions[tableName].properties;
  const remoteColNames = Object.keys(remoteCols);
  
  // Compare with local database.types.ts if it defines this table
  if (localTypes && localTypes[tableName]) {
    const localCols = Object.keys(localTypes[tableName]);
    
    const missingInRemote = localCols.filter(c => !remoteColNames.includes(c));
    const missingInLocal = remoteColNames.filter(c => !localCols.includes(c));
    
    if (missingInRemote.length > 0) {
      console.log(`  ❌ Defined locally in database.types.ts but MISSING in Supabase:`);
      missingInRemote.forEach(c => console.log(`     - ${c} (${localTypes[tableName][c]})`));
    }
    if (missingInLocal.length > 0) {
      console.log(`  ⚠️ Exist in Supabase but MISSING in local database.types.ts:`);
      missingInLocal.forEach(c => {
        const rType = remoteCols[c].type;
        const rFormat = remoteCols[c].format || '';
        console.log(`     - ${c} (${rType}${rFormat ? ': ' + rFormat : ''})`);
      });
    }
    
    if (missingInRemote.length === 0 && missingInLocal.length === 0) {
      console.log('  ✅ Perfectly aligned with database.types.ts.');
    }
  } else {
    console.log(`  ℹ️ No local type definition found in database.types.ts for this table.`);
    console.log(`     Remote columns: ${remoteColNames.join(', ')}`);
  }
}
