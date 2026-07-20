-- Adiciona a coluna preset_messages na tabela profiles com 10 mensagens padrao
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preset_messages jsonb DEFAULT '[]'::jsonb;

-- Atualizar perfis existentes com as 10 mensagens padrão, caso ainda nao possuam
UPDATE public.profiles
SET preset_messages = '[
    "Olá {{nome}}, temos novidades que podem te interessar!",
    "Oi {{nome}}, lembra do {{marca}} {{modelo}} que você estava olhando? Agora ele está por R$ {{valor}}.",
    "Olá {{nome}}, chegou em nosso estoque esse veículo: {{marca}} {{modelo}} {{ano}} por R$ {{valor}}, acredita que é uma boa opção para você?",
    "Oi {{nome}}! Pensando em trocar de carro? Que tal dar uma olhada no nosso estoque?",
    "Olá {{nome}}, como está? Viemos avisar que temos condições especiais para o {{marca}} {{modelo}}!",
    "Oi {{nome}}, tudo bem? Gostaríamos de saber se ainda está interessado no {{marca}} {{modelo}}.",
    "Olá {{nome}}! Temos um {{marca}} {{modelo}} {{ano}} incrível esperando por você. Quer agendar uma visita?",
    "Bom dia {{nome}}! O {{marca}} {{modelo}} que você viu ainda está disponível. Vamos fechar negócio?",
    "Olá {{nome}}, tudo joia? Acabamos de receber novos veículos que são a sua cara!",
    "Oi {{nome}}, não perca essa oportunidade: {{marca}} {{modelo}} com condições imperdíveis."
]'::jsonb
WHERE preset_messages IS NULL OR jsonb_array_length(preset_messages) = 0;
