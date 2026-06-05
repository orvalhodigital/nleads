
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing environment variables");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updatePlans() {
    console.log("Updating plans...");

    const plans = [
        {
            slug: 'trial',
            name: 'Teste',
            price: 0,
            interval: 'day',
            duration_days: 7,
            description: 'Experimente todas as ferramentas por 7 dias',
            features: ['Gestão de Leads', 'Escritório Virtual', 'Agenda Integrada'],
            style: { icon: 'Gift' },
            is_active: true
        },
        {
            slug: 'crm',
            name: 'Otimizza CRM',
            price: 497,
            interval: 'month',
            duration_days: 30,
            description: 'Gestão completa de leads e estoque',
            features: [
                'Gestão de Leads Ilimitada',
                'Agenda de Visitas',
                'Estoque de Veículos/Motos',
                'Métricas de Vendas',
                'Acesso ao Dashboard'
            ],
            style: { icon: 'Shield' },
            is_active: true
        },
        {
            slug: 'traffic_crm',
            name: 'Tráfego + CRM',
            price: 1890,
            interval: 'month',
            duration_days: 30,
            description: 'Aceleração total de vendas',
            features: [
                'Tudo do Plano CRM',
                'Gestão de Tráfego Pago',
                'Configuração de Pixel/API',
                'Onboarding de Tráfego',
                'Suporte VIP'
            ],
            style: { icon: 'Rocket' },
            is_active: true
        }
    ];

    for (const plan of plans) {
        console.log(`Checking plan: ${plan.name} (${plan.slug})...`);
        const { data: existing } = await supabase.from('plans').select('id').eq('slug', plan.slug).single();

        if (existing) {
            console.log(`Updating existing plan: ${plan.slug}`);
            await supabase.from('plans').update(plan).eq('id', existing.id);
        } else {
            console.log(`Inserting new plan: ${plan.slug}`);
            await supabase.from('plans').insert(plan);
        }
    }

    console.log("Plans updated successfully!");
}

updatePlans().catch(console.error);
