-- Corrigir usuários que estão com status ou plano nulo (fazendo com que apareçam como Inativos)
UPDATE public.profiles 
SET 
  plan_status = 'active',
  plan = 'trial'
WHERE plan_status IS NULL OR plan IS NULL;

-- Adicionar valores padrão para garantir que novos usuários (caso o trigger ou código falhe) comecem ativos
ALTER TABLE public.profiles ALTER COLUMN plan_status SET DEFAULT 'active';
ALTER TABLE public.profiles ALTER COLUMN plan SET DEFAULT 'trial';
