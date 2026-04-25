
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTableDefinition() {
  const { data, error } = await supabase.rpc('get_table_definition', { t_name: 'vehicles' });
  if (error) {
    // Fallback: use a select to check for common missing fields
    console.log('RPC failed, trying to insert a minimal vehicle and see error');
    const { error: insertError } = await supabase.from('vehicles').insert({
        brand: 'Test',
        model: 'Test',
        year: 2024,
        price: 1000,
        type: 'Sedan',
        transmission: 'Manual',
        engine: '1.0',
        mileage: 0,
        color: 'Test'
    });
    console.log('Minimal insert error:', insertError);
  } else {
    console.log('Definition:', data);
  }
}

checkTableDefinition();
