
import { supabase } from '../src/lib/supabaseClient';

async function checkColumns() {
    console.log('Checking columns for table: vehicles');
    const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'vehicles' });
    
    if (error) {
        console.error('Error calling RPC get_table_columns:', error);
        
        // Fallback: try a simple select with limit 0 to see what columns come back
        console.log('Trying fallback: select * with limit 0');
        const { data: fallbackData, error: fallbackError } = await supabase.from('vehicles').select('*').limit(0);
        if (fallbackError) {
            console.error('Fallback select error:', fallbackError);
        } else {
            console.log('Fallback success. Columns (keys of first object if any):', fallbackData);
        }
    } else {
        console.log('Columns found:', data);
    }
}

checkColumns();
