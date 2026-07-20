-- Update leads table with segmented interests
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS interesse_carro BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS interesse_moto BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS tipos_moto TEXT[],
ADD COLUMN IF NOT EXISTS marcas_moto TEXT[],
ADD COLUMN IF NOT EXISTS modelos_moto TEXT[],
ADD COLUMN IF NOT EXISTS moto_valor_min NUMERIC,
ADD COLUMN IF NOT EXISTS moto__valormax NUMERIC, -- Using exactly as requested (double underscore)
ADD COLUMN IF NOT EXISTS moto_transmissao TEXT[],
ADD COLUMN IF NOT EXISTS moto_motorizacao TEXT[],
ADD COLUMN IF NOT EXISTS carro_valor_min NUMERIC,
ADD COLUMN IF NOT EXISTS carro_valormax NUMERIC, -- Using exactly as requested
ADD COLUMN IF NOT EXISTS carro_transmissao TEXT[],
ADD COLUMN IF NOT EXISTS carro_motorizacao TEXT[];

-- Notify postgrest to reload schema
NOTIFY pgrst, 'reload schema';
