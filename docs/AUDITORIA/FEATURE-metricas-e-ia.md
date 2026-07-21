# Feature — Registro de consumo de IA & Painel de Métricas

> Desenvolvimento **novo**, fora das 20 fases da auditoria. Pedido pelo dono em 2026-07-20. Relaciona-se ao achado A30.

## Decisão de arquitetura

A maioria das métricas pedidas (leads, entrada de leads, veículos in/out, giro de estoque, vendas) **já vive nos dados existentes** — `leads.created_at/source/phase`, `vehicles.created_at/status/sale_details`. Não precisou de registro novo; é consulta.

**Só o consumo de IA não tinha registro** — daí a única tabela nova.

## Parte 1 — Registro de consumo de IA

- **Migração** `20260720120000_create_ai_usage_events`: tabela `ai_usage_events` (user_id, admin_id, feature, provider, model, tokens, custo estimado, created_at). RLS: só admin lê; inserção é server-side com `service_role`.
- **`api/_lib/aiUsage.ts`**: módulo compartilhado que substituiu as **3 cópias idênticas** de `generateJson`. Agora `generateJson` devolve o resultado **e** os metadados (provider, modelo, tokens), e `logAiUsage` grava o evento (best-effort — falha no log nunca quebra a resposta ao usuário).
- As 3 funções `api/openai/*` passam a logar cada chamada.
- Custo é **estimado** por uma tabela de preço/1k tokens em `aiUsage.ts` (fácil de reajustar); os tokens gravados são o dado real.

## Parte 2 — Painel de Métricas (`/paineldoadm/metrics`)

- **`src/services/metricsService.ts`**: agrega leads, veículos, vendas e IA. Filtro opcional por lojista (`ownerId`).
- **`src/admin/AdminMetrics.tsx`**: página com cards (leads, em estoque, vendidos, giro médio), tendência de 30 dias (entrada de leads e veículos), leads por origem e por fase, e o bloco de consumo de IA (chamadas, tokens, custo, por recurso).
- Filtro por lojista com **busca no servidor** (combobox): digita o nome, busca debounced com limite de 20 — escala para milhares de lojistas sem carregar todos. "Todos os lojistas" limpa o filtro.
- Item "Métricas" adicionado à navegação do admin.

## Verificação

- `npx tsc --noEmit` — ✅ 0 erros · `npm run build` — ✅
- Rota `/paineldoadm/metrics` carrega sem crash (redireciona ao login admin sem sessão) · sem erro de console/servidor
- **Lógica das consultas validada contra o banco real:** leads por origem (WhatsApp 13, Facebook 12…), 41 em estoque / 5 vendidos, giro médio 20 dias, 2 lojistas no filtro
- Renderização visual do painel depende de login admin — a validar pelo dono

## Escala (nota)
As agregações rodam no cliente (volume pequeno hoje). Para muitos tenants/linhas, migrar as somas para RPCs no Postgres.

## Pendente de aplicação
🔴 `supabase/scripts/APLICAR-ai-usage.sql` — cria a tabela `ai_usage_events` (migração 19). Sem ela, o painel funciona para leads/estoque/vendas, mas o bloco de IA fica vazio (tratado sem erro).
