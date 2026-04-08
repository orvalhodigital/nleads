-- ============================================================
-- nLeads Veículos — Setup Completo do Banco de Dados
-- Execute no SQL Editor do Supabase Dashboard
-- ============================================================

-- Extensão necessária
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    plan TEXT DEFAULT 'trial',
    plan_status TEXT DEFAULT 'active',
    trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    webhook_url TEXT,
    avatar_url TEXT,
    company_name TEXT,
    company_logo TEXT,
    role TEXT DEFAULT 'user',
    phone TEXT,
    business_type TEXT DEFAULT 'vehicles',
    enable_manual_vehicles BOOLEAN DEFAULT true,
    monthly_sales_goal INTEGER,
    enable_cars BOOLEAN DEFAULT true,
    enable_motorcycles BOOLEAN DEFAULT false,
    enable_trucks BOOLEAN DEFAULT false,
    preset_messages JSONB DEFAULT '[]'::jsonb
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Auto-criar profile ao cadastrar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, plan, plan_status, trial_ends_at)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        'trial',
        'active',
        NOW() + INTERVAL '7 days'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. LEADS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    phase TEXT NOT NULL DEFAULT 'Novo Lead',
    temperature TEXT NOT NULL DEFAULT 'Morna',
    tipos_veiculo TEXT[] DEFAULT '{}',
    valor_minimo NUMERIC,
    valor_maximo NUMERIC,
    marcas TEXT[] DEFAULT '{}',
    modelos TEXT[] DEFAULT '{}',
    transmissao TEXT[] DEFAULT '{}',
    motorizacao TEXT[] DEFAULT '{}',
    observacoes_adicionais TEXT DEFAULT '',
    possui_entrada BOOLEAN DEFAULT false,
    valor_entrada NUMERIC,
    possui_troca BOOLEAN DEFAULT false,
    veiculo_troca TEXT,
    presented_vehicles TEXT[] DEFAULT '{}',
    source TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    funnel_history JSONB DEFAULT '{}'::jsonb,
    disqualification_reasons TEXT[] DEFAULT '{}',
    disqualification_notes TEXT DEFAULT '',
    visit_date TIMESTAMPTZ,
    visit_status TEXT DEFAULT 'pending',
    tags TEXT[] DEFAULT '{}',
    foto_url TEXT,
    scheduling_data JSONB DEFAULT '{}'::jsonb,
    simulation_data JSONB DEFAULT '{}'::jsonb,
    follow_up_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_update TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own leads" ON public.leads;
CREATE POLICY "Users can manage own leads"
ON public.leads FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all leads" ON public.leads;
CREATE POLICY "Admins can view all leads"
ON public.leads FOR SELECT
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- 3. VEHICLES (Carros)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    model_year INTEGER,
    plate TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    type TEXT NOT NULL,
    transmission TEXT NOT NULL,
    engine TEXT NOT NULL,
    mileage INTEGER NOT NULL DEFAULT 0,
    color TEXT NOT NULL,
    is_single_owner BOOLEAN DEFAULT false,
    is_service_history_complete BOOLEAN DEFAULT false,
    is_ipva_paid BOOLEAN DEFAULT false,
    has_warranty BOOLEAN DEFAULT false,
    optionals TEXT[] DEFAULT '{}',
    image_url TEXT,
    status TEXT DEFAULT 'available',
    sale_details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own vehicles" ON public.vehicles;
CREATE POLICY "Users can manage own vehicles"
ON public.vehicles FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all vehicles" ON public.vehicles;
CREATE POLICY "Admins can view all vehicles"
ON public.vehicles FOR SELECT
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Função de fallback RPC para criação de veículo
CREATE OR REPLACE FUNCTION public.create_vehicle_v4(
    p_brand TEXT, p_model TEXT, p_year INTEGER, p_model_year INTEGER,
    p_price NUMERIC, p_type TEXT, p_transmission TEXT, p_engine TEXT,
    p_mileage INTEGER, p_color TEXT, p_status TEXT, p_image_url TEXT,
    p_optionals TEXT[], p_is_single_owner BOOLEAN,
    p_is_service_history_complete BOOLEAN, p_is_ipva_paid BOOLEAN, p_has_warranty BOOLEAN
)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_vehicle_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    INSERT INTO public.vehicles (
        user_id, brand, model, year, model_year, price, type, transmission,
        engine, mileage, color, status, image_url, optionals,
        is_single_owner, is_service_history_complete, is_ipva_paid, has_warranty
    ) VALUES (
        v_user_id, p_brand, p_model, p_year, p_model_year, p_price, p_type, p_transmission,
        p_engine, p_mileage, p_color, p_status, p_image_url, p_optionals,
        p_is_single_owner, p_is_service_history_complete, p_is_ipva_paid, p_has_warranty
    )
    RETURNING id INTO v_vehicle_id;

    RETURN json_build_object('id', v_vehicle_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 4. MOTORCYCLES (Motos)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.motorcycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    model_year INTEGER,
    plate TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    category TEXT NOT NULL,
    engine TEXT NOT NULL,
    mileage INTEGER NOT NULL DEFAULT 0,
    color TEXT NOT NULL,
    is_single_owner BOOLEAN DEFAULT false,
    has_warranty BOOLEAN DEFAULT false,
    is_ipva_paid BOOLEAN DEFAULT false,
    optionals TEXT[] DEFAULT '{}',
    image_url TEXT,
    status TEXT DEFAULT 'available',
    sale_details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.motorcycles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own motorcycles" ON public.motorcycles;
CREATE POLICY "Users can manage own motorcycles"
ON public.motorcycles FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 5. NOTIFICATIONS (Notificações de usuário)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can see own notifications" ON public.notifications;
CREATE POLICY "Users can see own notifications"
ON public.notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
CREATE POLICY "Admins can view all notifications"
ON public.notifications FOR SELECT
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- 8. NOTIFICATION_RULES (Regras de automação — Admin)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notification_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT DEFAULT 'system',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    trigger_event TEXT NOT NULL,
    delay_minutes INTEGER DEFAULT 0,
    target_plan TEXT,
    target_status TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notification_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage notification rules" ON public.notification_rules;
CREATE POLICY "Admins can manage notification rules"
ON public.notification_rules FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- 9. NOTIFICATION_TEMPLATES (Templates de disparo manual)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage notification templates" ON public.notification_templates;
CREATE POLICY "Admins can manage notification templates"
ON public.notification_templates FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- 10. BROADCAST_HISTORY (Histórico de disparos em massa)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.broadcast_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    target_filter TEXT DEFAULT 'Todos',
    sent_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.broadcast_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage broadcast history" ON public.broadcast_history;
CREATE POLICY "Admins can manage broadcast history"
ON public.broadcast_history FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- 11. SUPPORT_TICKETS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    category TEXT DEFAULT 'support' CHECK (category IN ('bug', 'feature', 'billing', 'support')),
    attachments TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own tickets" ON public.support_tickets;
CREATE POLICY "Users can view own tickets"
ON public.support_tickets FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own tickets" ON public.support_tickets;
CREATE POLICY "Users can create own tickets"
ON public.support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all tickets" ON public.support_tickets;
CREATE POLICY "Admins can view all tickets"
ON public.support_tickets FOR SELECT
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins can update tickets" ON public.support_tickets;
CREATE POLICY "Admins can update tickets"
ON public.support_tickets FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE OR REPLACE FUNCTION public.update_support_ticket_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_support_ticket_timestamp ON public.support_tickets;
CREATE TRIGGER tr_update_support_ticket_timestamp
    BEFORE UPDATE ON public.support_tickets
    FOR EACH ROW EXECUTE FUNCTION public.update_support_ticket_timestamp();

-- ============================================================
-- 12. TICKET_MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ticket_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES auth.users(id) NOT NULL,
    sender_role TEXT CHECK (sender_role IN ('user', 'admin')),
    message TEXT NOT NULL,
    attachments TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can see ticket messages" ON public.ticket_messages;
CREATE POLICY "Participants can see ticket messages"
ON public.ticket_messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.support_tickets
        WHERE id = ticket_id AND (
            user_id = auth.uid() OR
            EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
        )
    )
);

DROP POLICY IF EXISTS "Participants can send messages" ON public.ticket_messages;
CREATE POLICY "Participants can send messages"
ON public.ticket_messages FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.support_tickets
        WHERE id = ticket_id AND (
            user_id = auth.uid() OR
            EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
        )
    )
);

-- ============================================================
-- 13. ONBOARDING_SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.onboarding_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    step_welcome_meeting BOOLEAN DEFAULT false,
    step_educational_materials BOOLEAN DEFAULT false,
    step_technical_setup BOOLEAN DEFAULT false,
    step_traffic_setup BOOLEAN DEFAULT false,
    step_pixel_configured BOOLEAN DEFAULT false,
    step_first_activation BOOLEAN DEFAULT false,
    step_followup_success BOOLEAN DEFAULT false,
    step_referral_request BOOLEAN DEFAULT false,
    welcome_meeting_date TIMESTAMPTZ,
    followup_date TIMESTAMPTZ,
    review_30d_date TIMESTAMPTZ,
    notes TEXT,
    satisfaction_score INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_onboarding UNIQUE (user_id)
);

ALTER TABLE public.onboarding_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins have full access to onboarding" ON public.onboarding_sessions;
CREATE POLICY "Admins have full access to onboarding"
ON public.onboarding_sessions FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user_onboarding()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.role = 'user' OR NEW.role IS NULL) THEN
        INSERT INTO public.onboarding_sessions (user_id)
        VALUES (NEW.id)
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created_onboarding ON public.profiles;
CREATE TRIGGER on_profile_created_onboarding
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_onboarding();

-- ============================================================
-- 14. PLANS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL DEFAULT 0,
    interval TEXT DEFAULT 'month',
    duration_days INTEGER DEFAULT 30,
    description TEXT,
    features JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    stripe_url TEXT,
    style JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active plans" ON public.plans;
CREATE POLICY "Anyone can view active plans"
ON public.plans FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage plans" ON public.plans;
CREATE POLICY "Admins can manage plans"
ON public.plans FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- 15. CAMPAIGNS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    plan_id UUID REFERENCES public.plans(id) ON DELETE CASCADE,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    promo_price NUMERIC NOT NULL DEFAULT 0,
    promo_text TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active campaigns" ON public.campaigns;
CREATE POLICY "Anyone can view active campaigns"
ON public.campaigns FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage campaigns" ON public.campaigns;
CREATE POLICY "Admins can manage campaigns"
ON public.campaigns FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- 16. MOTIVATION_QUOTES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.motivation_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote TEXT NOT NULL,
    author TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.motivation_quotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active quotes" ON public.motivation_quotes;
CREATE POLICY "Anyone can view active quotes"
ON public.motivation_quotes FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage quotes" ON public.motivation_quotes;
CREATE POLICY "Admins can manage quotes"
ON public.motivation_quotes FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES
    ('vehicles', 'vehicles', true),
    ('avatars', 'avatars', true),
    ('system_assets', 'system_assets', true),
    ('support_attachments', 'support_attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Vehicles bucket
DROP POLICY IF EXISTS "Public read vehicles" ON storage.objects;
CREATE POLICY "Public read vehicles"
ON storage.objects FOR SELECT USING (bucket_id = 'vehicles');

DROP POLICY IF EXISTS "Auth upload vehicles" ON storage.objects;
CREATE POLICY "Auth upload vehicles"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'vehicles' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth delete vehicles" ON storage.objects;
CREATE POLICY "Auth delete vehicles"
ON storage.objects FOR DELETE
USING (bucket_id = 'vehicles' AND auth.role() = 'authenticated');

-- Avatars bucket
DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
CREATE POLICY "Public read avatars"
ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Auth upload avatars" ON storage.objects;
CREATE POLICY "Auth upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- System assets bucket
DROP POLICY IF EXISTS "Public read system_assets" ON storage.objects;
CREATE POLICY "Public read system_assets"
ON storage.objects FOR SELECT USING (bucket_id = 'system_assets');

DROP POLICY IF EXISTS "Admins upload system_assets" ON storage.objects;
CREATE POLICY "Admins upload system_assets"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'system_assets' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Support attachments bucket
DROP POLICY IF EXISTS "Public read support_attachments" ON storage.objects;
CREATE POLICY "Public read support_attachments"
ON storage.objects FOR SELECT USING (bucket_id = 'support_attachments');

DROP POLICY IF EXISTS "Auth upload support_attachments" ON storage.objects;
CREATE POLICY "Auth upload support_attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'support_attachments' AND auth.role() = 'authenticated');

-- ============================================================
-- DADOS INICIAIS (Seed)
-- ============================================================

-- Regras de notificação padrão
INSERT INTO public.notification_rules (category, title, message, trigger_event, delay_minutes, active) VALUES
    ('system', 'Bem-vindo ao nLeads!', 'Olá @nome, que bom ter você aqui! Comece adicionando seus primeiros leads.', 'signup', 0, true),
    ('plan', 'Seu período de teste está acabando!', 'Ei @nome, seu trial expira em 2 dias. Faça o upgrade hoje mesmo!', 'trial_ending', 2, true),
    ('plan', 'Atenção: Seu plano expirou!', 'Seu plano nLeads expirou. Renove agora para continuar gerindo suas vendas.', 'plan_expired', 0, true),
    ('system', 'Seu estoque está parado?', 'Você está há mais de 24h sem veículos ativos. Estoque atualizado gera mais leads!', 'no_stock_24h', 1440, true),
    ('system', 'Sentimos sua falta no nLeads!', 'Faz uma semana que você não acessa o painel. Temos novos leads aguardando!', 'inactivity_7d', 10080, true)
ON CONFLICT DO NOTHING;

-- Templates de disparo manual
INSERT INTO public.notification_templates (category, title, message) VALUES
    ('Promoção', 'Oferta de Renovação Especial', 'Olá @nome! Use o cupom RENOVA20 para ganhar 20% de desconto na sua próxima mensalidade!'),
    ('Atualização', 'Novas Funcionalidades Chegaram!', 'Temos novidades! Acabamos de liberar novos filtros e relatórios de desempenho. Confira agora!'),
    ('Suporte', 'Precisa de ajuda para configurar?', 'Olá @nome, vimos que você ainda não completou seu perfil. Precisa de ajuda para começar?'),
    ('Dica', 'Venda mais rápido com fotos WebP', 'Sabia que fotos em WebP carregam 3x mais rápido? Otimize suas fotos para vender mais!')
ON CONFLICT DO NOTHING;

-- Frases motivacionais
INSERT INTO public.motivation_quotes (quote, author, is_active) VALUES
    ('O sucesso é a soma de pequenos esforços repetidos dia após dia.', 'Robert Collier', true),
    ('Vender é construir relacionamento, não apenas fechar negócio.', null, true),
    ('A persistência é o caminho do êxito.', 'Charles Chaplin', true),
    ('Cada cliente é uma oportunidade de fazer a diferença.', null, true),
    ('Quem não arrisca, não petisca — e não vende!', null, true)
ON CONFLICT DO NOTHING;
