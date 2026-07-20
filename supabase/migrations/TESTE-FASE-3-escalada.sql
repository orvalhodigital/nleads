-- ============================================================================
-- TESTE DE SEGURANÇA — o escalonamento de privilégio está mesmo bloqueado?
-- ============================================================================
--
-- Simula um lojista comum (Gelson Veículos, role='empresa') tentando se promover
-- a administrador e se dar plano pago.
--
-- ⚠️ NÃO ALTERA NADA: tudo roda dentro de uma transação encerrada com ROLLBACK.
--    Mesmo que o trigger falhasse, nenhuma mudança seria gravada.
--
-- Cole no SQL Editor do Supabase e execute.
-- ============================================================================

BEGIN;

-- Passa a se comportar como o lojista Gelson Veículos (role = 'empresa').
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims = '{"sub":"9a5277c9-8a8d-41a1-8c41-7bf3bf60f5c0","role":"authenticated"}';

-- ── TENTATIVA 1: virar administrador ────────────────────────────────────────
-- ESPERADO: erro 42501 com a mensagem do trigger.
DO $$
BEGIN
  UPDATE public.profiles
     SET role = 'admin'
   WHERE id = '9a5277c9-8a8d-41a1-8c41-7bf3bf60f5c0';
  RAISE WARNING '*** FALHA DE SEGURANCA: consegui virar admin ***';
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'OK -> escalada para admin BLOQUEADA';
END $$;

-- ── TENTATIVA 2: dar plano pago a si mesmo ──────────────────────────────────
DO $$
BEGIN
  UPDATE public.profiles
     SET plan = 'pro', plan_status = 'active'
   WHERE id = '9a5277c9-8a8d-41a1-8c41-7bf3bf60f5c0';
  RAISE WARNING '*** FALHA DE SEGURANCA: consegui me dar plano pro ***';
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'OK -> upgrade de plano BLOQUEADO';
END $$;

-- ── TENTATIVA 3: virar vendedor de outra loja para ler os dados dela ────────
DO $$
BEGIN
  UPDATE public.profiles
     SET role = 'vendedor', parent_id = 'fc24cc15-7a5f-4bf5-8995-78c974903c72'
   WHERE id = '9a5277c9-8a8d-41a1-8c41-7bf3bf60f5c0';
  RAISE WARNING '*** FALHA DE SEGURANCA: consegui me vincular a outra loja ***';
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'OK -> vinculo a outra loja BLOQUEADO';
END $$;

-- ── CONTROLE: alterar coluna comum deve CONTINUAR funcionando ───────────────
-- Se esta falhar, o trigger está bloqueando demais e quebrou o app.
DO $$
BEGIN
  UPDATE public.profiles
     SET company_name = 'Gelson Veículos'
   WHERE id = '9a5277c9-8a8d-41a1-8c41-7bf3bf60f5c0';
  RAISE NOTICE 'OK -> alteracao de coluna comum CONTINUA PERMITIDA';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '*** PROBLEMA: o trigger esta bloqueando coluna comum: % ***', SQLERRM;
END $$;

ROLLBACK;

-- ============================================================================
-- RESULTADO ESPERADO — quatro linhas de NOTICE, nenhuma WARNING:
--   OK -> escalada para admin BLOQUEADA
--   OK -> upgrade de plano BLOQUEADO
--   OK -> vinculo a outra loja BLOQUEADO
--   OK -> alteracao de coluna comum CONTINUA PERMITIDA
--
-- Qualquer linha começando com *** indica problema.
-- ============================================================================
