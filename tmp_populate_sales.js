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

  const saleStatuses = ['documentacao', 'entrega', 'em_garantia', 'apos_garantia'];

  // Fetch Compradores leads
  const { data: buyers } = await supabase.from('leads')
    .select('id, follow_up_data, presented_vehicles')
    .eq('admin_id', adminId)
    .eq('phase', 'Compradores');

  if (buyers && buyers.length > 0) {
    console.log(`Atualizando ${buyers.length} leads em Compradores...`);
    const now = new Date();
    const past = new Date(now); past.setDate(past.getDate() - 30);
    const future = new Date(now); future.setDate(future.getDate() + 90);

    for (let i = 0; i < buyers.length; i++) {
      const sStatus = saleStatuses[Math.floor(Math.random() * saleStatuses.length)];
      const saleDate = randomDate(past, now);
      const endsAt = randomDate(now, future);

      await supabase.from('leads').update({
        sale_status: sStatus,
        sale_date: saleDate,
        guarantee_ends_at: (sStatus === 'em_garantia' || sStatus === 'apos_garantia') ? endsAt : null,
        delivery_date: (sStatus === 'em_garantia' || sStatus === 'apos_garantia') ? saleDate : null,
        follow_up_data: {
          ...buyers[i].follow_up_data,
          is_buyer: true
        }
      }).eq('id', buyers[i].id);
    }
  }

  console.log("Feito! Fluxo de Vendas populado.");
}

run().catch(console.error);
