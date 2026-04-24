import { supabase } from './src/lib/supabaseClient';

async function test() {
    const { data, error } = await supabase.from('profiles').select('company_logo').limit(1);
    console.log("data:", data, "error:", error);
}

test();
