-- ============================================================================
-- Ajuste de conteúdo: card do "Plano Estrutura ECV Plus" — 50 → 10
-- ============================================================================
--
-- O card exibia "Até 50 veículos anunciados simultaneamente". O dono corrigiu
-- para 10. É limite do SERVIÇO DE TRÁFEGO PAGO (Meta Ads), não do sistema —
-- não afeta nenhum trigger nem gating do CRM. É só o texto exibido no card,
-- que vem de plans.features (jsonb).
--
-- Não é migração de schema (é dado de conteúdo), por isso fica em scripts/.
-- Idempotente: pode rodar mais de uma vez.
-- ============================================================================

UPDATE public.plans
   SET features = jsonb_set(
         features,
         '{2}',  -- 3º item do array (índice 0-based): a linha dos veículos anunciados
         '"Até 10 veículos anunciados simultaneamente"'
       )
 WHERE slug = 'estrutura-ecv-plus'
   AND features->>2 = 'Até 50 veículos anunciados simultaneamente';


-- ============================================================================
-- CONFERÊNCIA — esperado: a linha 3 do ECV Plus agora diz "10"
-- ============================================================================
SELECT name, features->>2 AS linha_veiculos_anunciados
  FROM public.plans
 WHERE slug = 'estrutura-ecv-plus';
