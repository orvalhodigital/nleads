-- Unificação de Veículos (Adicionar colunas específicas na tabela vehicles)
ALTER TABLE public.vehicles 
  ADD COLUMN IF NOT EXISTS vehicle_category TEXT DEFAULT 'carro', -- 'carro', 'moto', 'caminhao', etc.
  ADD COLUMN IF NOT EXISTS moto_category TEXT,
  ADD COLUMN IF NOT EXISTS start_type TEXT,
  ADD COLUMN IF NOT EXISTS brake_type TEXT,
  ADD COLUMN IF NOT EXISTS fuel_system TEXT,
  ADD COLUMN IF NOT EXISTS cooling TEXT;

-- Adicionar colunas de SEO
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS seo_headline TEXT,
  ADD COLUMN IF NOT EXISTS seo_description TEXT;

-- Adicionar colunas de Custos Operacionais
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS operational_costs JSONB DEFAULT '[]'::jsonb;

-- Adicionar colunas de Compra e Venda
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS purchase_price NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS suggested_sale_price NUMERIC DEFAULT 0;

-- Notificar PostgREST para recarregar o schema imediatamente
NOTIFY pgrst, 'reload schema';
