# Fase 3 — Banco de Dados & Multi-tenancy

> Executada em 2026-07-20. A fase mais crítica da auditoria: o RLS é a única barreira entre os dados de lojistas diferentes.

## Resultado

| Verificação no banco | Valor |
|---|---|
| Migrações registradas no controle | **16** (antes: tabela não existia) |
| Tabelas sem RLS | **0** de 21 |
| Colunas Asaas | 3 |
| Trigger anti-escalada | 1 |
| Triggers de limite de plano | 3 |
| Políticas do site público com `authenticated` | 3 |
| Políticas em `lead_communications` + `system_settings` | 9 |

---

## 🔴 A17 / A18 — Escalonamento de privilégio e plano pago grátis

**O problema.** A política `profiles_update_own` permite ao usuário editar a própria linha, e o papel `authenticated` tinha GRANT de UPDATE em **todas** as colunas — incluindo `role`, `parent_id`, `plan`, `plan_status`, `trial_ends_at`. Não havia trigger nem constraint impedindo, e o CHECK aceitava o valor `'admin'`.

Três caminhos de ataque, todos a partir do navegador com a chave pública:

```sql
UPDATE profiles SET role='admin' WHERE id = auth.uid();
-- passa a satisfazer is_current_user_admin(), que aparece nas políticas de
-- profiles, leads, vehicles, motorcycles... acesso a TODAS as lojas
-- + DELETE de qualquer perfil

UPDATE profiles SET plan='pro', plan_status='active' WHERE id = auth.uid();
-- plano pago sem passar pelo Asaas

UPDATE profiles SET role='vendedor', parent_id='<loja alvo>' WHERE id = auth.uid();
-- is_vendedor_of() libera leads e estoque daquela loja
```

**Primeira tentativa de correção falhou.** Usei `REVOKE UPDATE (role, ...) ON profiles FROM authenticated`. No Postgres, um REVOKE por coluna **não subtrai** de um GRANT de tabela — e `authenticated` tinha UPDATE no nível da tabela. O comando foi aceito sem erro e não teve efeito nenhum.

A consulta de conferência acusou: `update_role_revogado` retornou 5 quando o esperado era 0. **Foi ela que evitou que a falha passasse despercebida.**

**Correção efetiva.** Trigger `BEFORE UPDATE` (`protect_profile_privileged_columns_trg`), que:
- libera chamadas server-side (`auth.uid() IS NULL`) — o webhook do Asaas segue ativando plano
- libera administradores, inclusive via `admin_update_user_plan()`
- bloqueia qualquer outra alteração nas 5 colunas privilegiadas

Escolhido em vez de `REVOKE` + `GRANT` das 86 colunas restantes porque sobrevive a colunas novas: com a outra abordagem, toda coluna criada depois nasceria sem permissão de UPDATE e a falha apareceria longe da causa.

**Testado.** Simulando o lojista Gelson Veículos (`role='empresa'`), em transação revertida:

| Cenário | Resultado |
|---|---|
| Virar admin | 🔒 bloqueado (`42501`) |
| Se dar plano Pro | 🔒 bloqueado |
| Se vincular a outra loja | 🔒 bloqueado |
| **Controle:** editar coluna comum | ✅ **permitido** |

O controle importa tanto quanto os bloqueios — prova que o trigger não ficou restritivo a ponto de quebrar a edição de perfil.

**No app:** `plan`/`plan_status`/`trial_ends_at` saíram do whitelist de `profileService.updateProfile`. O admin altera plano pela RPC `admin_update_user_plan`, que valida `is_current_user_admin()` no servidor.

---

## 🔴 A20 — Cliente pagava e o plano não era ativado

`api/webhook-asaas.ts` gravava `last_asaas_payment_id` e `asaas_subscription_id`. **Essas colunas não existiam.** O PostgREST rejeitava o UPDATE, o código fazia `throw`, e o webhook falhava. Como `payment.id` sempre vem preenchido, a falha era sistemática.

A migração que cria as colunas — `20260717230000_add_asaas_subscription_fields` — **existia no repositório desde 2026-07-17 e nunca foi aplicada.**

> **Correção de avaliação:** classifiquei isso inicialmente como bug ativo em produção. Ao verificar, produção rodava `main`, que estava 23 commits atrás e cuja versão do webhook não usava essas colunas. O bug estava no branch não publicado — teria quebrado a cobrança no momento do deploy. Eu havia alarmado sem checar em qual branch produção estava.

---

## 🔴 A23 — Limites de plano não existiam no banco

Descoberto ao **verificar migração por migração** antes de registrar o baseline, em vez de assumir que estavam aplicadas.

`20260715220000_add_plan_limit_triggers` nunca foi aplicada: `check_lead_limit`, `check_vehicle_limit` e os três triggers não existiam. Os limites do plano gratuito (50 leads, 10 veículos) eram validados **apenas no navegador**, por `planService.ts` — quem chamasse a API do Supabase diretamente cadastrava sem limite.

Se eu tivesse registrado as 16 migrações como aplicadas, como estava no rascunho, essa migração seria pulada **para sempre**.

---

## 🟠 A15 — Site público quebrado para usuários logados

As três políticas do site público estavam restritas ao papel `anon`. Quem está logado tem papel `authenticated`, então nenhuma se aplicava.

| Quem acessa | Antes |
|---|---|
| Cliente final anônimo | ✅ funcionava |
| Dono vendo o próprio site | ✅ (`auth.uid() = id`) |
| Vendedor da mesma loja | ✅ (`parent_id = auth.uid()`) |
| Admin | ✅ (`is_current_user_admin()`) |
| **Logado de outra loja** | ❌ "Site não encontrado" |

Corrigido com `ALTER POLICY ... TO anon, authenticated`. Não amplia exposição: `anon` já é a internet inteira e a condição `website_active = true` permanece.

> Classificado como 🔴 na primeira anotação e **rebaixado para 🟠** depois de medir — o caminho comercial (comprador anônimo) nunca esteve afetado.

---

## 🟠 A19 — Duas tabelas com RLS ligado e zero políticas

`lead_communications` e `system_settings` tinham RLS habilitado e nenhuma política. No Postgres isso nega tudo: ninguém lia nem gravava, e a funcionalidade estava quebrada em silêncio (ambas com 0 linhas).

- **`lead_communications`** — sem coluna `user_id`; o vínculo é via `lead_id → leads`. As 4 políticas replicam o predicado das políticas de `leads`, para o isolamento ser idêntico ao do registro-pai e não abrir porta lateral.
- **`system_settings`** — config global. Leitura anônima limitada por whitelist (`logo_url`, `temp_logo_*`), porque a tela de login lê a logo antes de haver sessão. Escrita só para admin. A whitelist evita que um segredo guardado ali no futuro vaze automaticamente.

---

## 🔴 A2 / A21 — O schema não era reproduzível

**A causa raiz das duas migrações esquecidas.** Havia SQL em três lugares — `supabase/migrations/` (16), `sql/` (35 scripts ad-hoc) e 8 na raiz — sem indicação de qual valia nem do que já tinha rodado. E o banco **não tinha tabela de controle de migrações**: o schema foi construído colando SQL à mão no editor.

**O que mudou:**

| Antes | Depois |
|---|---|
| SQL em 3 lugares | `supabase/migrations/` é o único |
| 43 scripts ad-hoc misturados | `supabase/historico/` com README de "não execute" |
| Scripts operacionais junto das migrações | `supabase/scripts/` |
| 8 nomes fora do padrão do CLI | normalizados para 14 dígitos, versões únicas |
| Sem controle de migrações | 16 registradas em `supabase_migrations.schema_migrations` |

Corrigido também um erro próprio: os `APLICAR-FASE-3*.sql` e `TESTE-*.sql` que criei estavam dentro de `migrations/` e seriam **re-executados** pelo `db push` — inclusive o teste de escalada.

**Limitação que permanece:** não há dump completo do schema como ponto de partida. Recriar o banco do zero ainda não funciona, porque as primeiras migrações pressupõem estado vindo dos scripts históricos. Gerar esse baseline exige `supabase db dump`, que depende de Docker — indisponível no ambiente atual. Está no checklist de comercialização.

---

## O que já estava bem

- **Todas as 21 tabelas com RLS habilitado.** A proteção fundamental estava de pé.
- **Funções de apoio bem escritas.** `is_current_user_admin`, `is_empresa_of`, `is_vendedor_of` e `get_my_parent_id` são todas `SECURITY DEFINER` com `SET search_path TO 'public'` — a proteção correta contra ataque de search_path.
- **Isolamento por equipe funciona.** Vendedores enxergam a loja-mãe via `parent_id`; empresas enxergam a própria equipe. O modelo está coerente.

---

## Pendências

| Item | Situação |
|---|---|
| **A22** — `SUPABASE_ACESS_TOKEN` exposto | Adiado por decisão do dono; no checklist de comercialização |
| Baseline completo do schema | Exige Docker; no checklist |
| Limpar `profiles.logo_url` com logos antigas | Fase 14 |
