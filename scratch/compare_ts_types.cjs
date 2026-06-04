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

// Helper to convert camelCase to snake_case
function camelToSnake(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

// Map interface names to remote table names
const interfaceToTable = {
  'Vehicle': 'vehicles',
  'Motorcycle': 'motorcycles',
  'Lead': 'leads',
  'Profile': 'profiles',
  'SupportTicket': 'support_tickets',
  'TicketMessage': 'ticket_messages',
  'OnboardingSession': 'onboarding_sessions',
  'Plan': 'plans',
  'Campaign': 'campaigns',
  'LeadCommunication': 'lead_communications'
};

// Simple parser for src/types.ts
function parseTsInterfaces() {
  const tsPath = path.resolve(__dirname, '../src/types.ts');
  const content = fs.readFileSync(tsPath, 'utf8');
  
  const interfaces = {};
  
  // Matches "export interface InterfaceName {" and grabs until the closing bracket
  // Note: this is a simple parser, but works well for clean interface files
  const interfaceRegex = /export\s+interface\s+(\w+)\s*\{([\s\S]*?)\n\}/g;
  let match;
  while ((match = interfaceRegex.exec(content)) !== null) {
    const name = match[1];
    const body = match[2];
    
    if (interfaceToTable[name]) {
      const fields = {};
      const lines = body.split('\n');
      for (const line of lines) {
        // Match "field: type" or "field?: type"
        const fieldMatch = line.match(/^\s*(\w+)\??\s*:\s*([^;\r\n]+)/);
        if (fieldMatch) {
          const fieldName = fieldMatch[1];
          const fieldType = fieldMatch[2].trim();
          
          // Ignore relations/nested interfaces like profiles?, messages?
          if (fieldName === 'profiles' || fieldName === 'messages' || fieldName === 'saleDetails' && name === 'Vehicle') {
             // saleDetails in Vehicle maps to sale_details column in DB
             fields[fieldName] = fieldType;
             continue;
          }
          // If type looks like an interface or array of custom interface, keep it but we know it might map to JSONB
          fields[fieldName] = fieldType;
        }
      }
      interfaces[name] = fields;
    }
  }
  
  return interfaces;
}

const tsInterfaces = parseTsInterfaces();

console.log('=== TS TYPES VS SUPABASE COLUMNS COMPARISON ===\n');

for (const [interfaceName, tableName] of Object.entries(interfaceToTable)) {
  console.log(`-----------------------------------------------`);
  console.log(`Interface: ${interfaceName}  ==>  Table: ${tableName}`);
  
  if (!remoteTables.includes(tableName)) {
    console.log(`❌ Table "${tableName}" does not exist in remote Supabase!`);
    continue;
  }
  
  const tsFields = tsInterfaces[interfaceName];
  if (!tsFields) {
    console.log(`⚠️ Interface "${interfaceName}" not found in src/types.ts`);
    continue;
  }
  
  const remoteCols = remoteSchema.definitions[tableName].properties;
  const remoteColNames = Object.keys(remoteCols);
  
  const missingColumns = [];
  const matchedColumns = [];
  
  for (const [tsFieldName, tsType] of Object.entries(tsFields)) {
    // Determine the expected DB column name
    let dbColName = camelToSnake(tsFieldName);
    
    // Custom mappings
    if (tsFieldName === 'planStatus') dbColName = 'plan_status';
    if (tsFieldName === 'trialEndsAt') dbColName = 'trial_ends_at';
    if (tsFieldName === 'preferences') {
       // preferences in Lead maps to preference columns in DB or JSON?
       // Wait! In Lead, preference is flattened in database.types.ts, but in types.ts it is a sub-object preferences: LeadPreference.
       // Let's check how the preferences are stored. In leads table, we have columns like tipos_veiculo, valor_minimo, etc.
       // We will check this separately.
       continue;
    }
    if (tsFieldName === 'presentedVehicles') dbColName = 'presented_vehicles';
    if (tsFieldName === 'funnelHistory') dbColName = 'funnel_history';
    if (tsFieldName === 'disqualificationReasons') dbColName = 'disqualification_reasons';
    if (tsFieldName === 'disqualificationNotes') dbColName = 'disqualification_notes';
    if (tsFieldName === 'scheduling_data' || tsFieldName === 'simulation_data' || tsFieldName === 'follow_up_data') {
       dbColName = tsFieldName; // already snake_case in TS
    }
    if (tsFieldName === 'marketing_metadata' || tsFieldName === 'interaction_history') {
       // These might be stored in other tables or not mapped directly to columns.
       // Let's check if there are columns for them.
       dbColName = tsFieldName;
    }
    
    if (remoteColNames.includes(dbColName)) {
      matchedColumns.push({ ts: tsFieldName, db: dbColName });
    } else {
      // Check if maybe it's completely unmapped (like local-only state or relation)
      // e.g. user_name in Lead (might be joined from profiles)
      const localOnlyFields = ['user_name', 'email_user', 'is_buyer'];
      if (!localOnlyFields.includes(tsFieldName)) {
        missingColumns.push({ ts: tsFieldName, expectedDb: dbColName, type: tsType });
      }
    }
  }
  
  if (missingColumns.length > 0) {
    console.log(`❌ Fields in TS Interface missing as columns in Supabase:`);
    missingColumns.forEach(item => {
      console.log(`   - ${item.ts} (Expected column: "${item.expectedDb}") [Type: ${item.type}]`);
    });
  } else {
    console.log(`✅ All TS interface fields have corresponding columns in the Supabase table.`);
  }
}
