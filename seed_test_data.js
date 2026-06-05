import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Carrega variáveis do .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Faltando VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY no .env.local");
  process.exit(1);
}

const supabase = createClient(url, key);

const EMAIL = 'teste@nleads.com.br';
const PASSWORD = 'senhaTeste123!';

const BRANDS = ['Chevrolet', 'Volkswagen', 'Fiat', 'Hyundai', 'Toyota', 'Honda', 'Jeep', 'Renault'];
const MODELS = {
  'Chevrolet': ['Onix', 'Tracker', 'Cruze', 'Spin'],
  'Volkswagen': ['Gol', 'Polo', 'T-Cross', 'Nivus', 'Virtus'],
  'Fiat': ['Argo', 'Mobi', 'Cronos', 'Pulse', 'Toro'],
  'Hyundai': ['HB20', 'Creta', 'HB20S'],
  'Toyota': ['Corolla', 'Yaris'],
  'Honda': ['Civic', 'HR-V', 'City'],
  'Jeep': ['Renegade', 'Compass'],
  'Renault': ['Kwid', 'Sandero', 'Duster']
};

const COLORS = ['Branco', 'Preto', 'Prata', 'Cinza', 'Vermelho', 'Azul'];

const FIRST_NAMES = ['João', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Beatriz', 'Lucas', 'Mariana', 'José', 'Fernanda', 'Paulo', 'Juliana', 'Marcos', 'Camila', 'Luiz', 'Amanda', 'Fernando', 'Patrícia', 'Rafael', 'Natália'];
const LAST_NAMES = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida'];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

function generateFakePhone() {
  const ddd = randomInt(11, 99);
  const part1 = randomInt(90000, 99999);
  const part2 = randomInt(1000, 9999);
  return `(${ddd}) ${part1}-${part2}`;
}

async function run() {
  console.log("Criando ou autenticando usuário teste...");
  let { data: authData, error: authErr } = await supabase.auth.signUp({
    email: EMAIL,
    password: PASSWORD,
  });

  if (authErr && authErr.message.includes('already registered')) {
    const login = await supabase.auth.signInWithPassword({
      email: EMAIL,
      password: PASSWORD,
    });
    if (login.error) throw login.error;
    authData = login.data;
    console.log("Usuário já existia. Login efetuado.");
  } else if (authErr) {
    throw authErr;
  } else {
    console.log("Novo usuário criado!");
  }

  const user = authData.user;
  const adminId = user.id;

  // Tenta garantir que o profile do usuário esteja setado adequadamente, caso RLS não permita sem profile
  // Geralmente o trigger SQL faz isso, mas podemos testar o acesso
  const { data: profileCheck } = await supabase.from('profiles').select('id').eq('id', adminId).single();
  if (!profileCheck) {
     console.log("Perfil não encontrado imediatamente, talvez seja criado via trigger. Aguardando...");
     await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`User ID (Admin ID): ${adminId}`);

  // Gerar 15 Veículos
  console.log("Gerando 15 veículos...");
  const vehicles = [];
  for (let i = 0; i < 15; i++) {
    const brand = randomItem(BRANDS);
    const model = randomItem(MODELS[brand]);
    const year = randomInt(2018, 2024);
    const price = randomInt(40000, 120000);
    
    vehicles.push({
      admin_id: adminId,
      user_id: adminId,
      brand,
      model,
      year,
      model_year: year,
      price,
      fipe_price: price * 1.05,
      type: 'Carro',
      transmission: randomItem(['Manual', 'Automático']),
      engine: randomItem(['1.0', '1.4', '1.6', '2.0']),
      mileage: randomInt(10000, 120000),
      color: randomItem(COLORS),
      is_single_owner: Math.random() > 0.5,
      has_warranty: Math.random() > 0.5,
      is_ipva_paid: true,
      status: 'available',
      show_on_website: true,
      image_url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=1000'
    });
  }

  const { data: insertedVehicles, error: vehErr } = await supabase.from('vehicles').insert(vehicles).select('id');
  if (vehErr) {
    console.error("Erro inserindo veículos:", vehErr);
  } else {
    console.log(`Foram inseridos ${insertedVehicles.length} veículos.`);
  }

  // Gerar 100 Leads
  console.log("Gerando 100 leads...");
  const leads = [];
  const phases = ['Novo Lead', 'Visita / Test Drive', 'Simulação', 'Follow-up', 'Aguardando Pagamento', 'Documentação'];
  const temperatures = ['Quente', 'Morna', 'Fria'];

  for (let i = 0; i < 100; i++) {
    const name = `${randomItem(FIRST_NAMES)} ${randomItem(LAST_NAMES)}`;
    const phone = generateFakePhone();
    
    // Pode estar interessado em algum veículo que inserimos
    let presented = [];
    if (insertedVehicles && insertedVehicles.length > 0 && Math.random() > 0.3) {
      presented.push(randomItem(insertedVehicles).id);
    }

    leads.push({
      admin_id: adminId,
      user_id: adminId,
      name,
      phone,
      email: `${name.replace(' ', '.').toLowerCase()}@fakemail.com`,
      phase: randomItem(phases),
      temperature: randomItem(temperatures),
      source: randomItem(['Facebook Ads', 'Google Ads', 'Instagram', 'Orgânico', 'Indicação']),
      presented_vehicles: presented,
      notes: 'Lead gerado automaticamente para testes.',
    });
  }

  const { data: insertedLeads, error: leadErr } = await supabase.from('leads').insert(leads).select('id');
  if (leadErr) {
    console.error("Erro inserindo leads:", leadErr);
  } else {
    console.log(`Foram inseridos ${insertedLeads.length} leads.`);
  }

  console.log("\n--- DADOS GERADOS COM SUCESSO ---");
  console.log("Email: " + EMAIL);
  console.log("Senha: " + PASSWORD);
}

run().catch(console.error);
