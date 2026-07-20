-- Inserção de Notificações Padrão no Sistema
-- Execute este script no SQL Editor do Supabase Dashboard

-- Limpa regras anteriores se necessário (opcional)
-- DELETE FROM notification_rules WHERE category IN ('system', 'plan');

INSERT INTO notification_rules (category, title, message, trigger_event, delay_minutes, active)
VALUES 
-- 1. Boas-vindas (Sistema)
('system', 'Bem-vindo ao Otimizza! 🚀', 'Olá @nome, que bom ter você aqui! Comece agora adicionando seus primeiros leads e explore todas as nossas ferramentas de gestão.', 'signup', 0, true),

-- 2. Teste acabando (Planos)
-- Nota: Para o trigger trial_ending, o campo delay_minutes é interpretado na UI como "Dias Antes"
('plan', 'Seu período de teste está acabando! ⏳', 'Ei @nome, seu período trial expira em 2 dias. Não perca o acesso aos seus dados e ferramentas, faça o upgrade hoje mesmo!', 'trial_ending', 2, true),

-- 3. Plano Expirado (Planos)
('plan', 'Atenção: Seu plano expirou! 🚨', 'Seu plano Otimizza expirou. Sua conta foi limitada. Renove agora para continuar gerindo suas vendas sem interrupções.', 'plan_expired', 0, true),

-- 4. Sem Estoque (Sistema)
('system', 'Seu estoque está parado? 📦', 'Você está há mais de 24h sem carros/motos ativos no sistema. Lembre-se: estoque atualizado gera mais leads!', 'no_stock_24h', 1440, true),

-- 5. Inatividade (Sistema)
('system', 'Sentimos sua falta no Otimizza! 👋', 'Faz uma semana que você não acessa o painel. Temos novos leads aguardando seu contato. Vamos bater as metas de hoje?', 'inactivity_7d', 10080, true);

-- Inserção de Modelos de Mensagem (Templates) para Disparo Manual
-- Estes modelos aparecerão no dropdown da aba "Disparo Manual"
INSERT INTO notification_templates (category, title, message)
VALUES 
('Promoção', 'Oferta de Renovação Especial 🎁', 'Olá @nome! Notamos que você é um usuário fiel. Use o cupom RENOVA20 para ganhar 20% de desconto na sua próxima mensalidade!'),
('Atualização', 'Novas Funcionalidades Chegaram! ✨', 'Temos novidades! Acabamos de liberar novos filtros e relatórios de desempenho. Confira agora no seu painel.'),
('Suporte', 'Dificuldade para configurar? 🛠️', 'Olá @nome, vimos que você ainda não completou seu perfil. Precisa de uma ajuda para começar? Responda a este email ou fale no chat!'),
('Dica', 'Venda mais rápido com WebP ⚡', 'Sabia que fotos em WebP carregam 3x mais rápido? Já convertemos todas as suas fotos para você vender mais rápido!');
