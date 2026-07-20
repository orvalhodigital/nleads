-- 1. Criar a tabela de Onboarding com novas etapas de Tráfego Pago
CREATE TABLE IF NOT EXISTS public.onboarding_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Status das Etapas Básicas
    step_welcome_meeting BOOLEAN DEFAULT false,
    step_educational_materials BOOLEAN DEFAULT false,
    step_technical_setup BOOLEAN DEFAULT false,
    
    -- Novas Etapas de Tráfego Pago
    step_traffic_setup BOOLEAN DEFAULT false, -- Integração de anúncios / acessos
    step_pixel_configured BOOLEAN DEFAULT false, -- Configuração de Pixel/API
    
    -- Sucesso e Retenção
    step_first_activation BOOLEAN DEFAULT false,
    step_followup_success BOOLEAN DEFAULT false,
    step_referral_request BOOLEAN DEFAULT false,
    
    -- Agendamentos
    welcome_meeting_date TIMESTAMP WITH TIME ZONE,
    review_30d_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_user_onboarding UNIQUE (user_id)
);

-- 2. Habilitar RLS
ALTER TABLE public.onboarding_sessions ENABLE ROW LEVEL SECURITY;

-- 3. Política de Acesso para Admins
DROP POLICY IF EXISTS "Admins have full access to onboarding" ON public.onboarding_sessions;
CREATE POLICY "Admins have full access to onboarding" ON public.onboarding_sessions
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 4. Função para criar onboarding automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user_onboarding()
RETURNS TRIGGER AS $$
BEGIN
    -- Só cria se for um usuário normal
    IF (NEW.role = 'user') THEN
        INSERT INTO public.onboarding_sessions (user_id)
        VALUES (NEW.id)
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger para novos usuários
DROP TRIGGER IF EXISTS on_profile_created_onboarding ON public.profiles;
CREATE TRIGGER on_profile_created_onboarding
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_onboarding();

-- 6. BACKFILL: Criar onboarding para todos os usuários que já existem e não são admins
-- RODE ISSO SE A TABELA ESTIVER VAZIA
INSERT INTO public.onboarding_sessions (user_id)
SELECT id FROM public.profiles 
WHERE role = 'user'
ON CONFLICT (user_id) DO NOTHING;
