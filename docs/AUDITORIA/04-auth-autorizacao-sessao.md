# Fase 4 — Autenticação, Autorização & Sessão

> Executada em 2026-07-20.

## 🔴 A24 — A falha mais grave da auditoria: tomada de conta por anônimo

A função `admin_update_user_password(uuid, text)` era `SECURITY DEFINER`, escrevia direto em `auth.users` e **não tinha nenhuma verificação de quem chamava**. O ACL era `=X/postgres` — PUBLIC, incluindo `anon`.

Cadeia de ataque, sem precisar de conta:
1. Abrir o site público de uma loja e ler `profiles.id` do dono (exposto pela política `profiles_select_public_website`).
2. Chamar `supabase.rpc('admin_update_user_password', { target_user_id, new_password })` com a chave anônima do bundle.
3. Entrar na conta.

Funcionava para qualquer lojista e para o admin, se o id fosse descoberto.

**Correção** (`20260720100000_fix_password_rpc_authorization`):
- `is_current_user_admin()` verificado **dentro** da função — no Supabase, o schema `public` concede EXECUTE a `anon`/`authenticated` por padrão, então depender só de GRANT é frágil.
- `REVOKE` de PUBLIC e `anon`; `GRANT` apenas a `authenticated`.
- Mínimo de 8 caracteres.

**Verificado após aplicação** (via `has_function_privilege`, definitivo):

| Papel | EXECUTE |
|---|---|
| `anon` | **false** ✅ |
| `authenticated` | true (e agora barrado pelo `is_current_user_admin()` interno) |

> A consulta de conferência inicial acusou `public_pode_executar = 1` — era **falso positivo do próprio SQL de conferência** (o `LIKE '%=X/postgres%'` casava dentro de `postgres=X/postgres`). O ACL real não tem entrada de PUBLIC. Script corrigido para usar `has_function_privilege`.

Único chamador legítimo: `src/admin/AdminUsers.tsx`. Senha de vendedor passa pela edge function `invite_user` (service_role), que não usa esta RPC.

---

## O que está correto

**Reconhecimento de admin no cliente é só UI.** `AdminApp.tsx` lê `role` para decidir o que renderizar, mas a proteção real é o RLS. Correto — o cliente nunca é a barreira.

**Impersonação (`/paineldoadm/user/:userId/*`) é segura.** O admin passa `impersonatedUserId` para o `DataProvider`, que apenas filtra a UI para aquele lojista. O acesso aos dados já vem das políticas de admin no RLS; a rota é guardada por `isAdmin`. Não é uma via de escalonamento — um não-admin nem alcança a rota, e mesmo que alcançasse, o RLS só entrega dados a quem é admin de fato.

**Reset de senha é robusto.** O usuário chega por link de e-mail; o supabase-js cria uma sessão de recuperação a partir do token, e `updateUser({ password })` só funciona com essa sessão válida. `ResetPasswordPage` confirma `getSession()` antes de habilitar o formulário.

**Funções de apoio** (`claim_first_admin`, `check_has_admins`, `admin_update_user_plan`) — todas `SECURITY DEFINER` com `SET search_path`, e todas com verificação interna. `claim_first_admin` só promove se não houver nenhum admin (hoje há um, está inerte).

**Sessão:** `persistSession`, `autoRefreshToken` e `detectSessionInUrl` ativos — configuração adequada.

---

## Ajuste menor

**Mínimo de senha inconsistente.** `AdminUsers.tsx` validava `< 6`, mas a RPC corrigida passou a exigir 8 — uma senha de 6-7 caracteres passaria no cliente e tomaria erro cru da RPC. Alinhado para 8 no cliente.

## 🟡 Recomendação para o checklist de comercialização

**Senha mínima do provedor é 6.** `ResetPasswordPage` e o cadastro (`Auth.tsx`) usam o padrão do Supabase Auth (6 caracteres). É configuração do provedor, não do código. Recomendo elevar para 8 no painel do Supabase (Authentication → Policies) antes da comercialização, para ficar consistente com a RPC de admin.

→ Adicionado ao checklist em `docs/DECISOES-E-ROADMAP.md`.
