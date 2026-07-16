-- =====================================================================================
-- Migration: Add Security Triggers for Plan Limits (Leads & Vehicles)
-- Garante integridade no nível do banco de dados (SaaS Security RLS/Triggers)
-- =====================================================================================

-- 1. Função para verificar limite de leads
CREATE OR REPLACE FUNCTION check_lead_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_plan TEXT;
  v_lead_count INT;
  v_target_admin_id UUID;
BEGIN
  -- Identifica quem é o administrador/dono da loja
  SELECT COALESCE(
    NEW.admin_id, 
    (SELECT parent_id FROM public.profiles WHERE id = NEW.user_id), 
    NEW.user_id
  ) INTO v_target_admin_id;

  -- Busca o plano ativo do administrador
  SELECT plan INTO v_plan FROM public.profiles WHERE id = v_target_admin_id;

  -- Se for gratuito, valida o limite de 50 leads
  IF v_plan IS NULL OR v_plan = 'free' OR v_plan = 'trial' THEN
    SELECT COUNT(*) INTO v_lead_count 
    FROM public.leads 
    WHERE user_id = v_target_admin_id OR admin_id = v_target_admin_id;

    IF v_lead_count >= 50 THEN
      RAISE EXCEPTION 'Limite de leads do plano gratuito atingido (máximo 50 leads). Faça upgrade para Pro!';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Função para verificar limite de veículos (Carros + Motos)
CREATE OR REPLACE FUNCTION check_vehicle_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_plan TEXT;
  v_vehicle_count INT;
  v_moto_count INT;
  v_total_count INT;
  v_target_admin_id UUID;
BEGIN
  -- Identifica quem é o administrador/dono da loja
  SELECT COALESCE(
    NEW.admin_id, 
    (SELECT parent_id FROM public.profiles WHERE id = NEW.user_id), 
    NEW.user_id
  ) INTO v_target_admin_id;

  -- Busca o plano ativo do administrador
  SELECT plan INTO v_plan FROM public.profiles WHERE id = v_target_admin_id;

  -- Se for gratuito, valida o limite combinado de 10 veículos
  IF v_plan IS NULL OR v_plan = 'free' OR v_plan = 'trial' THEN
    SELECT COUNT(*) INTO v_vehicle_count 
    FROM public.vehicles 
    WHERE user_id = v_target_admin_id OR admin_id = v_target_admin_id;

    SELECT COUNT(*) INTO v_moto_count 
    FROM public.motorcycles 
    WHERE user_id = v_target_admin_id OR admin_id = v_target_admin_id;

    v_total_count := v_vehicle_count + v_moto_count;

    IF v_total_count >= 10 THEN
      RAISE EXCEPTION 'Limite de veículos em estoque do plano gratuito atingido (máximo 10 veículos). Faça upgrade para Pro!';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Criação dos Triggers
DROP TRIGGER IF EXISTS trigger_check_lead_limit ON public.leads;
CREATE TRIGGER trigger_check_lead_limit
  BEFORE INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION check_lead_limit();

DROP TRIGGER IF EXISTS trigger_check_vehicle_limit ON public.vehicles;
CREATE TRIGGER trigger_check_vehicle_limit
  BEFORE INSERT ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION check_vehicle_limit();

DROP TRIGGER IF EXISTS trigger_check_motorcycle_limit ON public.motorcycles;
CREATE TRIGGER trigger_check_motorcycle_limit
  BEFORE INSERT ON public.motorcycles
  FOR EACH ROW
  EXECUTE FUNCTION check_vehicle_limit();
