/**
 * Seed de DADOS FICTÍCIOS para a conta Neto Carros (testes de filtro/UI).
 *
 *   node seed_ficticio.js          → cria os dados e grava os IDs em seed_ficticio_ids.json
 *   node seed_ficticio.js --clean  → apaga EXATAMENTE os IDs gravados nesse arquivo
 *
 * Usa SUPABASE_SERVICE_ROLE_KEY (bypassa RLS). Os valores de fase/temperatura/origem
 * seguem EXATAMENTE os enums do app (src/types.ts) para que os filtros funcionem.
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { writeFileSync, readFileSync, existsSync } from 'fs';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Faltando VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no .env.local');
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });

const USER_ID = 'fc24cc15-7a5f-4bf5-8995-78c974903c72'; // José Neto / Neto Carros
const IDS_FILE = resolve(process.cwd(), 'seed_ficticio_ids.json');
const MARK = '[FICTICIO]';

// ─── Enums reais do app (src/types.ts) ───────────────────────────────────────
const PHASES = ['Novo Lead', 'Visita / Test Drive', 'Simulação', 'Follow-up', 'Stand-By', 'Aguardando Pagamento', 'Documentação'];
const TEMPS = ['Quente', 'Morna', 'Fria'];
const SOURCES = ['Site', 'WhatsApp', 'Facebook', 'Instagram', 'Indicação', 'Telefone', 'Outros'];
const VEHICLE_TYPES = ['SUV', 'Sedan', 'Hatch', 'Picape'];

const BRANDS = {
  Chevrolet: ['Onix', 'Tracker', 'Cruze', 'Spin'],
  Volkswagen: ['Gol', 'Polo', 'T-Cross', 'Nivus', 'Virtus'],
  Fiat: ['Argo', 'Mobi', 'Cronos', 'Pulse', 'Toro'],
  Hyundai: ['HB20', 'Creta'],
  Toyota: ['Corolla', 'Yaris'],
  Honda: ['Civic', 'HR-V', 'City'],
  Jeep: ['Renegade', 'Compass'],
  Renault: ['Kwid', 'Sandero', 'Duster'],
};
const COLORS = ['Branco', 'Preto', 'Prata', 'Cinza', 'Vermelho', 'Azul'];
const FIRST = ['João', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Beatriz', 'Lucas', 'Mariana', 'Fernanda', 'Paulo', 'Juliana', 'Marcos', 'Camila', 'Luiz', 'Amanda', 'Rafael', 'Natália', 'Bruno', 'Larissa', 'Diego'];
const LAST = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro'];

const ri = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = (arr) => arr[ri(0, arr.length - 1)];
const daysAgoISO = (d) => new Date(Date.now() - d * 86400000).toISOString();
const phone = () => `(${ri(11, 99)}) 9${ri(1000, 9999)}-${ri(1000, 9999)}`;

async function clean() {
  if (!existsSync(IDS_FILE)) {
    console.error('Nada a limpar: seed_ficticio_ids.json não existe.');
    process.exit(1);
  }
  const { leadIds = [], vehicleIds = [] } = JSON.parse(readFileSync(IDS_FILE, 'utf8'));
  if (leadIds.length) {
    const { error } = await supabase.from('leads').delete().in('id', leadIds);
    console.log(error ? `Erro apagando leads: ${error.message}` : `${leadIds.length} leads fictícios apagados.`);
  }
  if (vehicleIds.length) {
    const { error } = await supabase.from('vehicles').delete().in('id', vehicleIds);
    console.log(error ? `Erro apagando veículos: ${error.message}` : `${vehicleIds.length} veículos fictícios apagados.`);
  }
  console.log('Limpeza concluída.');
}

async function seed() {
  // ─── VEÍCULOS ───────────────────────────────────────────────────────────────
  const vehicles = [];
  for (let i = 0; i < 14; i++) {
    const brand = pick(Object.keys(BRANDS));
    const model = pick(BRANDS[brand]);
    const year = ri(2017, 2024);
    const price = ri(38000, 145000);
    vehicles.push({
      admin_id: USER_ID,
      user_id: USER_ID,
      brand, model, year,
      model_year: year,
      price,
      fipe_price: Math.round(price * 1.05),
      type: pick(VEHICLE_TYPES),
      transmission: pick(['Manual', 'Automático']),
      engine: pick(['1.0', '1.4', '1.6', '2.0']),
      mileage: ri(8000, 130000),
      color: pick(COLORS),
      is_single_owner: Math.random() > 0.5,
      is_service_history_complete: Math.random() > 0.5,
      has_warranty: Math.random() > 0.5,
      is_ipva_paid: true,
      status: 'available',
      show_on_website: true,
      created_at: daysAgoISO(ri(1, 90)),
      description: `${MARK} Veículo de demonstração.`,
    });
  }
  const { data: insertedVehicles, error: vErr } = await supabase.from('vehicles').insert(vehicles).select('id');
  if (vErr) { console.error('Erro inserindo veículos:', vErr.message); process.exit(1); }
  console.log(`✓ ${insertedVehicles.length} veículos criados.`);

  // ─── LEADS ──────────────────────────────────────────────────────────────────
  // Distribuição pensada para testar TODOS os filtros:
  //   fase, temperatura, origem, "sem contato há N dias", com entrada, com troca.
  const staleBuckets = [0, 1, 2, 5, 8, 12, 20, 35, 60]; // dias sem contato
  const leads = [];
  for (let i = 0; i < 45; i++) {
    const nome = `${pick(FIRST)} ${pick(LAST)}`;
    const stale = pick(staleBuckets);
    const temEntrada = Math.random() < 0.4;
    const temTroca = Math.random() < 0.3;
    const brand = pick(Object.keys(BRANDS));
    const createdDays = stale + ri(0, 30);

    leads.push({
      admin_id: USER_ID,
      user_id: USER_ID,
      name: nome,
      phone: phone(),
      email: `${nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '.')}@exemplo.com`,
      phase: pick(PHASES),
      temperature: pick(TEMPS),
      source: pick(SOURCES),
      created_at: daysAgoISO(createdDays),
      last_update: daysAgoISO(stale),
      presented_vehicles: Math.random() > 0.4 ? [pick(insertedVehicles).id] : [],
      notes: `${MARK} Lead de demonstração (sem contato há ~${stale}d).`,
      // preferências (colunas planas) — alimentam os filtros "com entrada" / "com troca"
      interesse_carro: true,
      interesse_moto: false,
      marcas: [brand],
      modelos: [pick(BRANDS[brand])],
      tipos_veiculo: [pick(VEHICLE_TYPES)],
      carro_valor_min: ri(30000, 60000),
      carro_valormax: ri(70000, 150000), // ⚠️ coluna com typo — é a que o app usa (ver análise v3, M1)
      possui_entrada: temEntrada,
      valor_entrada: temEntrada ? ri(5000, 40000) : null,
      possui_troca: temTroca,
      veiculo_troca: temTroca ? `${pick(Object.keys(BRANDS))} ${ri(2012, 2020)}` : '',
    });
  }
  const { data: insertedLeads, error: lErr } = await supabase.from('leads').insert(leads).select('id');
  if (lErr) { console.error('Erro inserindo leads:', lErr.message); process.exit(1); }
  console.log(`✓ ${insertedLeads.length} leads criados.`);

  writeFileSync(IDS_FILE, JSON.stringify({
    createdAt: new Date().toISOString(),
    userId: USER_ID,
    vehicleIds: insertedVehicles.map(v => v.id),
    leadIds: insertedLeads.map(l => l.id),
  }, null, 2));

  const comEntrada = leads.filter(l => l.possui_entrada).length;
  const comTroca = leads.filter(l => l.possui_troca).length;
  const parados15 = leads.filter(l => Number((l.notes.match(/~(\d+)d/) || [])[1]) >= 15).length;
  console.log('\n── Resumo para testar os filtros ──');
  console.log(`  Com entrada: ${comEntrada} | Com troca: ${comTroca} | Sem contato +15d: ${parados15}`);
  TEMPS.forEach(t => console.log(`  ${t}: ${leads.filter(l => l.temperature === t).length}`));
  console.log(`\nIDs salvos em seed_ficticio_ids.json`);
  console.log('Para desfazer:  node seed_ficticio.js --clean');
}

(process.argv.includes('--clean') ? clean() : seed()).catch(e => { console.error(e); process.exit(1); });
