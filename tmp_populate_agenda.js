import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

const EMAIL = 'teste@nleads.com.br';
const PASSWORD = 'senhaTeste123!';

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
}

async function run() {
  const login = await supabase.auth.signInWithPassword({
    email: EMAIL,
    password: PASSWORD,
  });

  if (login.error) {
    console.error("Erro de login:", login.error);
    process.exit(1);
  }

  const adminId = login.data.user.id;
  console.log(`Logado! Admin ID: ${adminId}`);

  // Fetch Follow-up leads
  const { data: followups } = await supabase.from('leads')
    .select('id, follow_up_data')
    .eq('admin_id', adminId)
    .eq('phase', 'Follow-up');

  if (followups) {
    console.log(`Atualizando ${followups.length} leads em Follow-up...`);
    const now = new Date();
    const past = new Date(now); past.setDate(past.getDate() - 5);
    const future = new Date(now); future.setDate(future.getDate() + 10);

    for (let i = 0; i < followups.length; i++) {
      // 80% with dates
      if (Math.random() < 0.8) {
        const nextContactDate = randomDate(past, future);
        await supabase.from('leads').update({
          follow_up_data: {
            ...followups[i].follow_up_data,
            nextContactDate: nextContactDate
          }
        }).eq('id', followups[i].id);
      }
    }
  }

  // Fetch Visit leads
  const { data: visits } = await supabase.from('leads')
    .select('id, scheduling_data, visit_date')
    .eq('admin_id', adminId)
    .eq('phase', 'Visita / Test Drive');

  if (visits) {
    console.log(`Atualizando ${visits.length} leads em Visita...`);
    const now = new Date();
    const past = new Date(now); past.setDate(past.getDate() - 5);
    const future = new Date(now); future.setDate(future.getDate() + 10);

    for (let i = 0; i < visits.length; i++) {
      if (Math.random() < 0.8) {
        const vDate = randomDate(past, future);
        await supabase.from('leads').update({
          visit_date: vDate,
          scheduling_data: {
            ...visits[i].scheduling_data,
            appointments: [{
              id: crypto.randomUUID(),
              date: vDate,
              status: Math.random() > 0.5 ? 'pending' : (Math.random() > 0.5 ? 'show' : 'noshow'),
              notes: 'Simulado via script'
            }]
          }
        }).eq('id', visits[i].id);
      }
    }
  }

  console.log("Feito!");
}

run().catch(console.error);
