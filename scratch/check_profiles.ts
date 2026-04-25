
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkProfile() {
    // We can't get the current user easily without a token, 
    // but we can check the profiles table for any inconsistencies
    const { data: profiles, error } = await supabase.from('profiles').select('id, role, parent_id').limit(10);
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Profiles:', profiles);
    }
}

checkProfile();
