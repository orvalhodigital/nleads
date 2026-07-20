
-- Tabela de Tickets de Suporte
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    category TEXT DEFAULT 'support' CHECK (category IN ('bug', 'feature', 'billing', 'support')),
    attachments TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Mensagens/Interações dos Tickets
CREATE TABLE IF NOT EXISTS ticket_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES auth.users(id) NOT NULL,
    sender_role TEXT CHECK (sender_role IN ('user', 'admin')),
    message TEXT NOT NULL,
    attachments TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

-- Políticas para support_tickets
CREATE POLICY "Usuários podem ver seus próprios tickets" 
ON support_tickets FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios tickets" 
ON support_tickets FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins podem ver todos os tickets" 
ON support_tickets FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Admins podem atualizar tickets" 
ON support_tickets FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Políticas para ticket_messages
CREATE POLICY "Participantes podem ver mensagens do ticket" 
ON ticket_messages FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM support_tickets 
        WHERE id = ticket_id AND (user_id = auth.uid() OR 
            EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
    )
);

CREATE POLICY "Participantes podem enviar mensagens" 
ON ticket_messages FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM support_tickets 
        WHERE id = ticket_id AND (user_id = auth.uid() OR 
            EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
    )
);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_support_ticket_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER tr_update_support_ticket_timestamp
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_support_ticket_timestamp();

-- Bucket para anexos de suporte
INSERT INTO storage.buckets (id, name, public) 
VALUES ('support_attachments', 'support_attachments', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Acesso público aos anexos de suporte"
ON storage.objects FOR SELECT
USING (bucket_id = 'support_attachments');

CREATE POLICY "Usuários autenticados podem subir anexos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'support_attachments' AND auth.role() = 'authenticated');
