-- Adiciona a coluna troca_data na tabela leads para guardar os detalhes estruturados do veículo de troca
ALTER TABLE leads ADD COLUMN IF NOT EXISTS troca_data JSONB DEFAULT '{}'::jsonb;

-- Notifica o PostgREST para recarregar o schema do banco de dados imediatamente
NOTIFY pgrst, 'reload schema';
