
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkConstraints() {
  const { data, error } = await supabase.rpc('get_table_constraints', { t_name: 'vehicles' });
  if (error) {
    console.log('RPC get_table_constraints failed, trying manual check via information_schema if possible');
    // We usually can't query information_schema directly via anon key unless exposed
    // But we can try to insert two vehicles with same plate and see if it fails
  } else {
    console.log('Constraints:', data);
  }
}

async function testUniquePlate() {
    console.log('Testing if plate must be unique...');
    // We can't really test this easily without creating real data.
    // But I can check if multiple existing vehicles have same plate (or empty plate)
    const { data, error } = await supabase.from('vehicles').select('plate');
    if (data) {
        const plates = data.map(v => v.plate).filter(Boolean);
        const duplicates = plates.filter((item, index) => plates.indexOf(item) !== index);
        console.log('Existing plates:', plates.length);
        console.log('Duplicates found:', duplicates);
        
        const emptyPlates = data.filter(v => v.plate === '' || v.plate === null);
        console.log('Empty/Null plates:', emptyPlates.length);
    }
}

testUniquePlate();
