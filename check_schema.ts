import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    let { data: profiles, error: err1 } = await supabase.from('profiles').select('*').limit(1);
    console.log("Profiles:", profiles, err1);

    let { data: comms, error: err2 } = await supabase.from('lead_communications').select('*').limit(1);
    console.log("Comms:", comms, err2);
}

check();
