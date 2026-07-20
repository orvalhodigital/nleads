-- ============================================================================
-- TESTE DE SEGURANÇA — o escalonamento de privilégio está mesmo bloqueado?
-- ============================================================================
--
-- Simula um lojista comum (Gelson Veículos, role='empresa') tentando se promover
-- a administrador e se dar plano pago.
--
-- ⚠️ NÃO ALTERA NADA: roda dentro de uma transação encerrada com ROLLBACK.
--
-- Esta versão DEVOLVE UMA TABELA de resultados. A versão anterior usava
-- RAISE NOTICE, que o SQL Editor do Supabase não exibe — o retorno "Success.
-- No rows returned" era inconclusivo: bloqueado e não-bloqueado davam a mesma
-- saída.
--
-- Cole no SQL Editor e execute.
-- ============================================================================

BEGIN;

SET LOCAL role authenticated;
SET LOCAL request.jwt.claims = '{"sub":"9a5277c9-8a8d-41a1-8c41-7bf3bf60f5c0","role":"authenticated"}';

CREATE TEMP TABLE resultado_teste (
  ordem      int,
  cenario    text,
  esperado   text,
  aconteceu  text,
  veredito   text
) ON COMMIT DROP;

-- ── 1. Tentar virar administrador ───────────────────────────────────────────
DO $$
BEGIN
  UPDATE public.profiles SET role = 'admin'
   WHERE id = '9a5277c9-8a8d-41a1-8c41-7bf3bf60f5c0';
  INSERT INTO resultado_teste VALUES
    (1, 'Lojista tenta virar admin', 'bloquear', 'PERMITIU', '*** FALHA DE SEGURANCA ***');
EXCEPTION WHEN OTHERS THEN
  INSERT INTO resultado_teste VALUES
    (1, 'Lojista tenta virar admin', 'bloquear', 'bloqueou (' || SQLSTATE || ')', 'OK');
END $$;

-- ── 2. Tentar dar plano pago a si mesmo ─────────────────────────────────────
DO $$
BEGIN
  UPDATE public.profiles SET plan = 'pro', plan_status = 'active'
   WHERE id = '9a5277c9-8a8d-41a1-8c41-7bf3bf60f5c0';
  INSERT INTO resultado_teste VALUES
    (2, 'Lojista se da plano Pro', 'bloquear', 'PERMITIU', '*** FALHA DE SEGURANCA ***');
EXCEPTION WHEN OTHERS THEN
  INSERT INTO resultado_teste VALUES
    (2, 'Lojista se da plano Pro', 'bloquear', 'bloqueou (' || SQLSTATE || ')', 'OK');
END $$;

-- ── 3. Tentar se vincular a outra loja como vendedor ────────────────────────
DO $$
BEGIN
  UPDATE public.profiles
     SET role = 'vendedor', parent_id = 'fc24cc15-7a5f-4bf5-8995-78c974903c72'
   WHERE id = '9a5277c9-8a8d-41a1-8c41-7bf3bf60f5c0';
  INSERT INTO resultado_teste VALUES
    (3, 'Lojista se vincula a outra loja', 'bloquear', 'PERMITIU', '*** FALHA DE SEGURANCA ***');
EXCEPTION WHEN OTHERS THEN
  INSERT INTO resultado_teste VALUES
    (3, 'Lojista se vincula a outra loja', 'bloquear', 'bloqueou (' || SQLSTATE || ')', 'OK');
END $$;

-- ── 4. CONTROLE: coluna comum deve CONTINUAR editável ───────────────────────
-- Se esta bloquear, o trigger está restritivo demais e quebrou o app.
DO $$
BEGIN
  UPDATE public.profiles SET company_name = 'Gelson Veiculos TESTE'
   WHERE id = '9a5277c9-8a8d-41a1-8c41-7bf3bf60f5c0';
  INSERT INTO resultado_teste VALUES
    (4, 'Lojista edita o proprio nome da loja', 'permitir', 'permitiu', 'OK');
EXCEPTION WHEN OTHERS THEN
  INSERT INTO resultado_teste VALUES
    (4, 'Lojista edita o proprio nome da loja', 'permitir', 'BLOQUEOU: ' || SQLERRM, '*** TRIGGER RESTRITIVO DEMAIS ***');
END $$;

SELECT ordem, cenario, esperado, aconteceu, veredito
  FROM resultado_teste ORDER BY ordem;

ROLLBACK;

-- ============================================================================
-- ESPERADO: 4 linhas, todas com veredito = 'OK'.
-- Qualquer *** indica problema — me mande a tabela inteira.
-- ============================================================================
