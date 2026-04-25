
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
    // Try to find unique constraints on the vehicles table
    const { data, error } = await supabase.from('vehicles').select('id').limit(1);
    if (error) {
        console.error('Error:', error);
        return;
    }
    
    // We can try to guess by trying to insert a duplicate plate
    const testPlate = 'TEST123';
    await supabase.from('vehicles').insert({
        brand: 'Test', model: 'Test', year: 2024, price: 1000, type: 'Sedan',
        transmission: 'Manual', engine: '1.0', mileage: 0, color: 'Test',
        plate: testPlate, user_id: 'a8d29448-7b79-499b-bae7-3afd813a719e', admin_id: 'a8d29448-7b79-499b-bae7-3afd813a719e'
    });
    
    const { error: error2 } = await supabase.from('vehicles').insert({
        brand: 'Test2', model: 'Test2', year: 2024, price: 1000, type: 'Sedan',
        transmission: 'Manual', engine: '1.0', mileage: 0, color: 'Test',
        plate: testPlate, user_id: 'a8d29448-7b79-499b-bae7-3afd813a719e', admin_id: 'a8d29448-7b79-499b-bae7-3afd813a719e'
    });
    
    if (error2 && error2.code === '23505') {
        console.log('Plate UNIQUE constraint detected!');
    } else {
        console.log('No UNIQUE constraint on plate (or RLS blocked test)');
        console.log('Error code:', error2?.code);
    }
    
    // Cleanup
    await supabase.from('vehicles').delete().eq('plate', testPlate);
}

checkConstraints();
