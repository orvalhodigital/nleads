
import { createClient } from '@supabase/supabase-api';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkColumns() {
    const { data, error } = await supabase.from('leads').select('*').limit(1);
    if (error) {
        console.error('Error fetching leads:', error);
        return;
    }
    if (data && data.length > 0) {
        console.log('Columns in leads table:', Object.keys(data[0]));
    } else {
        console.log('No data in leads table to check columns.');
    }
}

checkColumns();
