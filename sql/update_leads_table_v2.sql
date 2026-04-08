-- SQL para adicionar colunas faltantes na tabela 'leads'
-- Adiciona suporte para foto do lead, agendamento de visitas e tags

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS foto_url TEXT,
ADD COLUMN IF NOT EXISTS visit_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS visit_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Comentário: Após rodar este script, os campos de visita e foto voltarão a funcionar corretamente.
