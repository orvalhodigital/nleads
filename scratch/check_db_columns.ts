
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase env vars:', { supabaseUrl, supabaseAnonKey });
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkColumns() {
  console.log('Trying select * limit 1 to see columns');
  const { data: selectData, error: selectError } = await supabase.from('vehicles').select('*').limit(1);
  if (selectError) {
    console.error('Select failed:', selectError);
  } else {
    console.log('Columns found:', Object.keys(selectData[0] || {}));
  }
}

checkColumns();
