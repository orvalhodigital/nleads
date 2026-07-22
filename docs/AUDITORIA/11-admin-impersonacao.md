# Fase 11 — Admin ↔ dados de lojista / Impersonação

> Executada em 2026-07-22. A fronteira nº 5 do mapa: o admin da Orvalho acessando/agindo sobre os dados de cada lojista.

## O núcleo: a barreira é o RLS, não o cliente

O painel `/paineldoadm/*` e a impersonação (`/paineldoadm/user/:userId/*`) são **gated no cliente** por `isAdmin` (papel lido do perfil). Mas isso é UX — a barreira real é o RLS no banco, e ele se sustenta em funções `SECURITY DEFINER` corretas:

- **`is_current_user_admin()`**, **`is_empresa_of()`**, **`is_vendedor_of()`**, **`get_my_parent_id()`** — todas `SECURITY DEFINER`, `STABLE`, `SET search_path='public'`, ancoradas em `auth.uid()` (vem do JWT, não spoofável). ✅
- A impersonação funciona porque as políticas de `leads`/`vehicles`/`motorcycles` incluem `is_current_user_admin()`. Um **não-admin** que manipule o cliente (forçar a UI, mandar `?impersonate=X`) **não** lê nada: o RLS filtra por `auth.uid()`, e ele não é admin nem `empresa_of/vendedor_of` da vítima. ✅

## 🔴→✅ Verificado: lojista NÃO consegue se autopromover a admin

O ponto mais perigoso de todo sistema multi-tenant: a política de UPDATE de `profiles` é `auth.uid() = id OR is_current_user_admin()` — ou seja, o lojista pode editar a **própria** linha. Sem proteção, ele faria `update profiles set role='admin' where id=meu_id` e viraria admin de tudo.

**Está bloqueado** pelo trigger `protect_profile_privileged_columns()` (BEFORE UPDATE): se quem edita **não** é admin e **não** é o servidor (`auth.uid()` nulo = service_role), qualquer mudança em `role`, `parent_id`, `plan`, `plan_status` ou `trial_ends_at` levanta exceção `42501`. O anon nem chega ao trigger (o RLS de UPDATE já barra). ✅

## O que mais foi auditado e está correto

- **Escrita em `profiles`:** DELETE = só admin; INSERT = só a própria linha (`auth.uid() = id`); UPDATE = própria + admin, com o trigger acima protegendo colunas privilegiadas. ✅
- **Endpoints `api/`:** todos autenticam por `getVerifiedUserId`, que chama `auth.getUser(token)` — **verificação real** do JWT (assinatura/expiração no servidor), não um decode ingênuo. As ações operam sobre `authUserId` (o chamador verificado) — sem IDOR. Não há endpoint HTTP com poder de admin. ✅
- **RPCs de admin:** `admin_update_user_password` (A24, já corrigido) e `admin_update_user_plan` **se protegem internamente** (`IF NOT is_current_user_admin() THEN RAISE`). Mesmo com EXECUTE aberto ao anon, a chamada de não-admin é rejeitada. ✅
- **`claim_first_admin`:** exige login e só promove se `count(admins)=0` (bootstrap). Já existe 1 admin → chamadas agora retornam `false`. ✅
- **`create_vehicle_v4`:** força `user_id := auth.uid()` — não dá para injetar veículo no estoque de outro; o teto de plano continua valendo (trigger de INSERT). ✅

## 🟡 A42 — Impersonação não era registrada no log de auditoria (corrigido)

O tipo de ação `impersonate` existia no **display** do log (`AdminAuditLog`: filtro + rótulo "Impersonado"), mas o ponto de entrada real (`AdminUsers.tsx`, botão "Acessar Painel") só navegava — **nunca** chamava `logAction`. Um operador acessando a conta de um cliente **sem deixar rastro** é uma lacuna de accountability/LGPD para um SaaS comercial.

**Correção:** o botão de impersonar agora chama `auditLogService.logAction('impersonate', 'user', userId, nome)` antes de entrar (best-effort — falha no log não bloqueia o acesso). O log de auditoria é imutável (UPDATE/DELETE=`false`) e de leitura só-admin (Fase 10).

## 🟢 A40 / A41 — Endurecimento de funções SECURITY DEFINER (corrigido via SQL)

- **A41:** 5 funções `SECURITY DEFINER` estavam sem `SET search_path` fixo (`check_lead_limit`, `check_vehicle_limit`, `create_vehicle_v4`, `handle_new_user`, `handle_new_user_onboarding`) — alerta do linter do Supabase (search_path mutável). Baixa explorabilidade no ambiente travado do Supabase, mas é a prática correta. Corrigido com `ALTER FUNCTION ... SET search_path = public`.
- **A40:** `admin_update_user_plan` tinha EXECUTE para `anon`. Não explorável (checa admin internamente), mas o irmão `admin_update_user_password` (A24) já tinha o anon revogado. Alinhado: `REVOKE EXECUTE ... FROM anon`.

**Aplicar A40/A41:** `supabase/scripts/APLICAR-secdef-hardening.sql` (migração `20260722030000`). Só RLS/grant, **não exige deploy** (mas o A42 sim, é código). Conferência: `secdef_sem_search_path=0`, `anon_exec_admin_plan=f`.

## Resumo

| Item | Situação |
|---|---|
| Autopromoção lojista→admin | ✅ bloqueada (trigger `protect_profile_privileged_columns`) |
| Isolamento na impersonação (não-admin) | ✅ RLS barra, cliente é só UX |
| Funções admin/tenant (`is_*`) | ✅ SECURITY DEFINER, `auth.uid()`, search_path fixo |
| `api/` — verificação de JWT | ✅ `auth.getUser`, sem IDOR |
| RPCs de admin (senha/plano) | ✅ checagem interna de admin |
| A42 — impersonação sem log de auditoria | 🟡 → ✅ corrigido (código) |
| A40 — anon EXECUTE em `admin_update_user_plan` | 🟢 → ✅ revogado e verificado (2026-07-22) |
| A41 — search_path mutável em 5 funções | 🟡 → ✅ corrigido e verificado (2026-07-22) |
