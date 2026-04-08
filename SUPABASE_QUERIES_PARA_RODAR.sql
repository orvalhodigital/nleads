-- Cole e execute este SQL no SQL Editor do seu Supabase Dashboard

-- 1. Criação da tabela de frases de motivação
CREATE TABLE IF NOT EXISTS motivation_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote TEXT NOT NULL,
    author TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS e criar políticas
ALTER TABLE motivation_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura para todos os usuários"
ON motivation_quotes FOR SELECT USING (true);

-- Permite todas as ações para os admins (usando a mesma policy ou se tiver rules extras)
CREATE POLICY "Permitir leitura/escrita de frases"
ON motivation_quotes FOR ALL USING (true); -- Ajuste caso queira restringir para auth.uid() apenas admin

-- 2. Inserindo algumas frases de exemplo (opcional)
INSERT INTO motivation_quotes (quote, author) VALUES 
('Vender é o resultado de um bom relacionamento.', 'Autor Desconhecido'),
('O sucesso é a soma de pequenos esforços repetidos dia após dia.', 'Robert Collier'),
('Seus clientes mais insatisfeitos são sua maior fonte de aprendizado.', 'Bill Gates'),
('Não venda seguros, venda a promessa de tranquilidade.', 'Desconhecido'),
('Aproxime-se de cada cliente com a ideia de ajudá-lo a resolver um problema.', 'Brian Tracy');

-- 3. Inclusão das configurações no Profile
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS monthly_sales_goal NUMERIC DEFAULT 15;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_logo TEXT;

-- 4. Atualizar o cache do Supabase para que ele reconheça as novas colunas imediatamente
NOTIFY pgrst, 'reload schema';
