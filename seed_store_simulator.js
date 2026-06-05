import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

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

const BRANDS = ['Chevrolet', 'Volkswagen', 'Fiat', 'Hyundai', 'Toyota', 'Honda', 'Jeep', 'Renault', 'Ford', 'Nissan'];
const MODELS = {
  'Chevrolet': ['Onix', 'Tracker', 'Cruze', 'Spin', 'S10'],
  'Volkswagen': ['Gol', 'Polo', 'T-Cross', 'Nivus', 'Virtus', 'Saveiro', 'Jetta'],
  'Fiat': ['Argo', 'Mobi', 'Cronos', 'Pulse', 'Toro', 'Strada', 'Fiorino'],
  'Hyundai': ['HB20', 'Creta', 'HB20S', 'Tucson'],
  'Toyota': ['Corolla', 'Yaris', 'Hilux', 'Corolla Cross'],
  'Honda': ['Civic', 'HR-V', 'City', 'Fit'],
  'Jeep': ['Renegade', 'Compass', 'Commander'],
  'Renault': ['Kwid', 'Sandero', 'Duster', 'Captur', 'Logan'],
  'Ford': ['Ka', 'EcoSport', 'Ranger', 'Fiesta'],
  'Nissan': ['Kicks', 'Versa', 'Frontier']
};

const COLORS = ['Branco', 'Preto', 'Prata', 'Cinza', 'Vermelho', 'Azul', 'Chumbo', 'Bege'];

const FIRST_NAMES = ['João', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Beatriz', 'Lucas', 'Mariana', 'José', 'Fernanda', 'Paulo', 'Juliana', 'Marcos', 'Camila', 'Luiz', 'Amanda', 'Fernando', 'Patrícia', 'Rafael', 'Natália', 'Diego', 'Bruno', 'Marcelo', 'Eduardo', 'Thiago', 'Felipe', 'Rodrigo', 'Roberto', 'Gabriel', 'Gustavo', 'Aline', 'Letícia', 'Bruna', 'Renata', 'Tatiana', 'Vanessa'];
const LAST_NAMES = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Araujo', 'Melo', 'Barbosa', 'Pinto', 'Dias', 'Castro', 'Rocha', 'Mendes', 'Nunes', 'Cardoso', 'Correia'];

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

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
}

async function run() {
  const login = await supabase.auth.signInWithPassword({
    email: EMAIL,
    password: PASSWORD,
  });

  if (login.error) {
    console.error("Erro ao logar com a conta teste. Tem certeza que ela existe?", login.error);
    process.exit(1);
  }

  const adminId = login.data.user.id;
  console.log(`Logado como ${EMAIL} - User ID: ${adminId}`);

  // Gerar 150 Veículos Vendidos
  console.log("Gerando 150 veículos VENDIDOS...");
  const soldVehicles = [];
  const now = new Date();
  const pastYear = new Date();
  pastYear.setFullYear(now.getFullYear() - 1);

  for (let i = 0; i < 150; i++) {
    const brand = randomItem(BRANDS);
    const model = randomItem(MODELS[brand]);
    const year = randomInt(2015, 2024);
    const price = randomInt(40000, 120000);
    const saleDate = randomDate(pastYear, now);
    
    soldVehicles.push({
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
      engine: randomItem(['1.0', '1.4', '1.6', '1.8', '2.0']),
      mileage: randomInt(20000, 150000),
      color: randomItem(COLORS),
      is_single_owner: Math.random() > 0.6,
      has_warranty: false,
      is_ipva_paid: true,
      status: 'sold', // Carro vendido
      show_on_website: false,
      image_url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=1000',
      sale_details: {
        salePrice: price - randomInt(1000, 5000),
        saleDate: saleDate,
        buyerName: `${randomItem(FIRST_NAMES)} ${randomItem(LAST_NAMES)}`,
        isFollowUpSale: Math.random() > 0.8,
        refurbishmentCosts: randomInt(500, 3000)
      }
    });
  }

  // Inserir veículos em lotes de 50
  for (let i = 0; i < soldVehicles.length; i += 50) {
    const batch = soldVehicles.slice(i, i + 50);
    const { error: vehErr } = await supabase.from('vehicles').insert(batch);
    if (vehErr) {
      console.error("Erro inserindo lote de veículos:", vehErr);
    } else {
      console.log(`Inseridos ${i + batch.length}/${soldVehicles.length} veículos...`);
    }
  }

  // Pegar alguns veículos disponíveis do banco para associar aos leads
  const { data: availableVehicles } = await supabase.from('vehicles').select('id').eq('admin_id', adminId).eq('status', 'available').limit(20);

  // Gerar 1000 Leads
  console.log("Gerando 1000 leads em diferentes estágios...");
  const leads = [];
  const phases = [
    'Novo Lead', 'Visita / Test Drive', 'Simulação', 'Follow-up', 
    'Aguardando Pagamento', 'Documentação', 'Desqualificados', 'Compradores'
  ];
  const temperatures = ['Quente', 'Morna', 'Fria'];
  
  for (let i = 0; i < 1000; i++) {
    const name = `${randomItem(FIRST_NAMES)} ${randomItem(LAST_NAMES)}`;
    const phase = phases[randomInt(0, phases.length - 1)];
    const leadDate = randomDate(pastYear, now);

    let presented = [];
    if (availableVehicles && availableVehicles.length > 0 && Math.random() > 0.4) {
      presented.push(randomItem(availableVehicles).id);
    }

    leads.push({
      admin_id: adminId,
      user_id: adminId,
      name,
      phone: generateFakePhone(),
      email: `${name.replace(' ', '.').toLowerCase()}${randomInt(1, 99)}@fakemail.com`,
      phase: phase,
      temperature: randomItem(temperatures),
      source: randomItem(['Facebook Ads', 'Google Ads', 'Instagram', 'Orgânico', 'Indicação', 'Feirão', 'WhatsApp']),
      presented_vehicles: presented,
      notes: `Lead simulado gerado em massa para simulação de loja grande. Foco no estágio: ${phase}`,
      created_at: leadDate,
      last_update: leadDate,
    });
  }

  // Inserir leads em lotes de 200
  for (let i = 0; i < leads.length; i += 200) {
    const batch = leads.slice(i, i + 200);
    const { error: leadErr } = await supabase.from('leads').insert(batch);
    if (leadErr) {
      console.error("Erro inserindo lote de leads:", leadErr);
    } else {
      console.log(`Inseridos ${i + batch.length}/${leads.length} leads...`);
    }
  }

  console.log("\n--- SIMULAÇÃO DE LOJA REAL FINALIZADA COM SUCESSO ---");
}

run().catch(console.error);
