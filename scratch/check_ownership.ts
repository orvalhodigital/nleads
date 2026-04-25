
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUser() {
  const { data: { user } } = await supabase.auth.getUser();
  console.log('Current user ID:', user?.id);
  
  const { data: vehicles } = await supabase.from('vehicles').select('user_id, admin_id').limit(5);
  console.log('Vehicles in DB:', vehicles);
}

checkUser();
