-- Adiciona colunas de interesse em Caminhões na tabela de leads do Supabase
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS interesse_caminhao BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS tipos_caminhao TEXT[],
ADD COLUMN IF NOT EXISTS marcas_caminhao TEXT[],
ADD COLUMN IF NOT EXISTS modelos_caminhao TEXT[],
ADD COLUMN IF NOT EXISTS caminhao_valor_min NUMERIC,
ADD COLUMN IF NOT EXISTS caminhao_valor_max NUMERIC,
ADD COLUMN IF NOT EXISTS caminhao_transmissao TEXT[],
ADD COLUMN IF NOT EXISTS caminhao_motorizacao TEXT[];

-- Notifica o PostgREST para recarregar o schema do banco de dados imediatamente
NOTIFY pgrst, 'reload schema';
