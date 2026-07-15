# 🔍 Análise Funcional do Sistema — Orvalho Digital (Veículos)

> Auditoria **funcional e de recursos** (não de layout), 2026-07-15.
> Foco: segurança, integridade de dados, robustez, performance, features e manutenção.
> Baseada em leitura direta do código (`src/`, `api/`, `*.sql`) e validação das auditorias
> anteriores em `docs/plans/2026-07-10-*`.
>
> **Legenda de severidade:** 🔴 Crítico · 🟠 Alto · 🟡 Médio · 🔵 Baixo/Produto
> Cada item traz o(s) arquivo(s) e o porquê. Itens marcados **[verificado]** foram confirmados no código.

---

## ✅ Correções aplicadas em 2026-07-15 (mesma data da análise)

Foram corrigidos os itens **1, 2, 3, 4, 5, 6** e parte do **8/10**. Backup em `_backup_correcoes_2026-07-15/`.

| Item | Status | Arquivos |
|---|---|---|
| 1. Bug upgrade PRO (colunas) | ✅ Corrigido | `api/webhook-asaas.ts` |
| 2. Webhook Asaas endurecido (token obrigatório + valor + idempotência) | ✅ Corrigido | `api/webhook-asaas.ts` |
| 3. Auth no create-asaas-payment | ✅ Corrigido | `api/create-asaas-payment.ts`, `src/services/planService.ts` |
| 4. Token obrigatório no webhook de leads | ✅ Corrigido | `api/webhook-leads.ts` |
| 5. Erros padronizados no DataContext | ✅ Corrigido | `src/contexts/DataContext.tsx` |
| 6. Validação Zod (lead/veículo/moto) | ✅ Corrigido | `src/schemas/leadSchema.ts`, `vehicleSchema.ts`, `DataContext.tsx` |
| 8/10. Erros de tipo pré-existentes + config de teste | ⚠️ Parcial | `types.ts`, `AdminSales.tsx`, `AdminUserDetails.tsx`, `tsconfig.json` |
| 12. Retry de rede no login | ✅ Corrigido | `src/contexts/DataContext.tsx` |

### 🔴 AÇÃO NECESSÁRIA DE SUA PARTE (senão webhooks param de funcionar)
Os webhooks agora são **fail-closed** (rejeitam sem token). Você **precisa** garantir, no Vercel:
- `ASAAS_WEBHOOK_TOKEN` — mesmo valor configurado no painel do Asaas (header `asaas-access-token`).
- `WEBHOOK_SECRET` — mesmo valor configurado no cliente que envia leads (ex.: n8n, header `X-Webhook-Token`).
- Confirmar que a tabela `plans` tem os preços corretos (a validação de valor do pagamento compara com eles).

**Não foi feito deploy** — testar o fluxo de pagamento no sandbox do Asaas antes de subir.

### Ainda NÃO corrigido (refactors maiores, ficam para próximas sessões)
- **7. Tempo real** (Supabase Realtime) — feature nova, precisa de teste multiusuário.
- **9. Paginação/virtualização real** — muda UX das listas, precisa cuidado.
- **10. Eliminar os ~199 `any`** e o restante dos erros de tipo (Inventory, MotorcycleInventory, AppTour, etc.) — são muitos e pré-existentes; não bloqueiam o build.
- **8. Runner de testes** — jest/@types/jest/ts-jest **não estão instalados**; só foram removidos os testes do typecheck. Setup do runner é tarefa à parte.
- **11. Quebrar componentes monolíticos** (LeadDetailPage).

---

## Sumário executivo (o que atacar primeiro)

O sistema é maduro e bem estruturado (camada de serviços, contexts, RLS em boa parte, endpoints server-side com service_role). Os maiores riscos estão concentrados no **fluxo de pagamento/assinatura** e na **validação/robustez de dados**:

1. 🔴 **Cliente paga e não vira PRO** — bug de nomes de coluna no webhook de pagamento. *[verificado]*
2. 🔴 **Upgrade PRO grátis / injeção de leads** — webhooks com token opcional e endpoint de pagamento sem autenticação. *[verificado]*
3. 🟠 **Validação de formulários manual** — `zod` + `react-hook-form` instalados mas quase não usados.
4. 🟠 **Tratamento de erro inconsistente** e ausência de tempo real para times multiusuário.

---

## 🔴 CRÍTICO — segurança, dinheiro e integridade

### 1. Webhook de pagamento grava colunas inexistentes → upgrade PRO falha *[verificado]*
**Arquivo:** [`api/webhook-asaas.ts`](../../api/webhook-asaas.ts) (linhas 57-66)
O update usa `planStatus` e `trialEndsAt` (camelCase), mas o schema é snake_case: `plan_status`, `trial_ends_at` (confirmado em `remote_types.ts:932,935`). O PostgREST **rejeita** o update inteiro quando há coluna desconhecida → **o pagamento é confirmado no Asaas mas o perfil NÃO é atualizado para PRO**. Impacto direto em receita e suporte.
**Correção:** usar `plan_status` / `trial_ends_at`; validar o retorno; adicionar log de sucesso real.

### 2. Confirmação de pagamento sem verificação forte → PRO grátis para qualquer um *[verificado]*
**Arquivo:** [`api/webhook-asaas.ts`](../../api/webhook-asaas.ts) (linhas 31-39)
A checagem do token é **opcional**: `if (webhookToken) {...}`. Se `ASAAS_WEBHOOK_TOKEN` não estiver setado, **qualquer POST** com `event: PAYMENT_CONFIRMED` e `payment.externalReference: <userId>` promove o usuário a PRO. Além disso: não valida assinatura HMAC do Asaas, não confere se o **valor pago** corresponde ao plano, e não há **idempotência** (mesmo evento processado várias vezes).
**Correção:** tornar o token obrigatório (rejeitar se ausente); validar a assinatura oficial do Asaas; conferir `payment.value` contra `plans.price`; registrar `payment.id` para idempotência.

### 3. Endpoint de criação de pagamento não autentica o chamador *[verificado]*
**Arquivo:** [`api/create-asaas-payment.ts`](../../api/create-asaas-payment.ts) (linha 34)
Recebe `userId`/`planId` no body **sem autenticação**. Qualquer um pode gerar cobranças em nome de qualquer usuário. O padrão correto **já existe no próprio projeto** em [`api/register-custom-domain.ts`](../../api/register-custom-domain.ts) (função `getVerifiedUserId` via Bearer token) — basta replicar.
**Correção:** exigir Bearer token e garantir que `userId == user.id` autenticado.

### 4. Webhook de leads com token opcional → injeção não autenticada *[verificado]*
**Arquivo:** [`api/webhook-leads.ts`](../../api/webhook-leads.ts) (linhas 32-38)
Mesmo padrão: `if (webhookSecret) {...}`. Sem `WEBHOOK_SECRET`, qualquer um injeta leads em **qualquer conta** (usa service_role, ignora RLS). Risco de spam/poluição de dados.
**Correção:** token obrigatório; considerar rate-limiting.

> ✅ **Já corrigido (não é mais problema):** as RLS de `admin_audit_logs` e `motivation_quotes`
> apontadas em 2026-07-10 **foram endurecidas** (`schema_audit_logs.sql`, `SUPABASE_QUERIES_PARA_RODAR.sql`).

---

## 🟠 ALTO — robustez e integridade de dados

### 5. Validação de formulários é manual (zod/react-hook-form subutilizados)
Apenas 2 arquivos usam `zod`/`useForm` (`schemas/websiteSchema.ts`, `pages/public/PublicVehicleDetail.tsx`), apesar de `zod`, `@hookform/resolvers` e `react-hook-form` estarem no `package.json`. Formulários de **lead, veículo, perfil, moto** validam na mão (ou não validam). Risco: telefone/email/preço inválidos, dados inconsistentes no banco.
**Correção:** criar schemas Zod por entidade e padronizar os formulários com `react-hook-form` + `zodResolver`.

### 6. Tratamento de erro inconsistente no `DataContext` *[verificado]*
**Arquivo:** [`src/contexts/DataContext.tsx`](../../src/contexts/DataContext.tsx)
Leads têm toasts de erro/sucesso, mas `deleteLead`, `deleteVehicle`, `deleteMotorcycle`, `addVehicle`, `updateVehicle`, `addMotorcycle` **não têm try/catch nem toast** — falhas ficam silenciosas ou estouram sem feedback. Deletes são otimistas sem confirmação de sucesso.
**Correção:** padronizar wrapper de mutação com toast de erro e rollback do estado local em falha.

### 7. Sem sincronização em tempo real (multiusuário)
Não há `supabase.channel(...)`/realtime. Numa equipe, dois vendedores veem dados **desatualizados** até refresh manual — risco de conflito (dois atendendo o mesmo lead, estoque vendido não atualiza).
**Correção:** assinar mudanças em `leads`/`vehicles` por `admin_id` via Supabase Realtime, ou um polling leve.

### 8. Cobertura de testes mínima e quebrada
Só 2 testes de serviço (`guaranteeService`, `salesFlowService`) + 1 de integração de kanban. Os arquivos de teste acusam erros de tipo (`Cannot find name 'describe'/'expect'`) — falta `@types/jest` no `tsconfig`. Sem testes de UI/fluxos críticos (pagamento, criação de lead).
**Correção:** corrigir tipos de teste; cobrir os fluxos de dinheiro e de dados; rodar no CI.

---

## 🟡 MÉDIO — performance, escala e manutenção

### 9. Carga eager de todos os dados; paginação "fake" *[verificado]*
**Arquivo:** [`src/contexts/DataContext.tsx`](../../src/contexts/DataContext.tsx) (linha 97)
`PAGE_SIZE = 5000` → leads carregam praticamente todos de uma vez; veículos/motos usam `getAll` **sem paginação**. Tudo vai para memória e o Dashboard recalcula métricas em `useMemo` sobre o conjunto inteiro. Funciona hoje, mas escala mal para lojas grandes / muitos leads.
**Correção:** paginação/virtualização real nas listas; mover agregações pesadas para SQL (views/RPC).

### 10. Erosão de type safety — 199 usos de `any` *[verificado]*
199 ocorrências de `any`/`as any` em 63 arquivos. Há também erros de tipo pré-existentes (`AdminSales.tsx` `created_at`, `AdminUserDetails.tsx`, `Header.tsx` tipo `View`/'home'). Reduz a segurança que o TS deveria dar.
**Correção:** eliminar `any` incrementalmente começando por serviços e types; ligar `noUnusedLocals`/checagem no CI.

### 11. Componentes monolíticos
`LeadDetailPage.tsx` (~991 linhas, apontado em 2026-07-10) e o `Dashboard.tsx` (métricas gigantes em um `useMemo`). Já houve extração parcial (`components/lead-detail/*`), mas ainda há muita lógica concentrada.
**Correção:** continuar a extração; mover cálculo de métricas para hooks/serviços testáveis.

### 12. Resiliência de rede limitada
Só há um timeout global de 15s no `loadData`. Sem retry/backoff, sem estado offline, sem cache persistente. Uma falha de rede no login mostra erro e exige recarregar.
**Correção:** retry com backoff nas leituras; considerar cache (React Query/SWR) para revalidação e offline básico.

---

## 🔵 BAIXO / Produto — recursos e polish

- **Confirmação de ações destrutivas:** verificar se todo delete (lead/veículo/moto) tem modal de confirmação — hoje alguns deletes no contexto são diretos.
- **Feedback de "salvando":** faltam spinners/disable em algumas mutações longas (importação, venda).
- **Notificações:** existe `notificationService`, mas sem push/realtime — chega só ao abrir o sino.
- **Importação/Exportação:** backup JSON e Excel existem; a importação exige formato exato e não valida bem o arquivo (risco de erro no meio do loop, ver `Header.tsx handleImportData`).
- **Acessibilidade:** `prefers-reduced-motion` global já adicionado; falta auditoria AA (contraste, foco, labels) tela a tela.
- **Observabilidade:** erros só em `console.error` — sem Sentry/monitoramento em produção. Difícil saber que o bug nº1 (upgrade PRO) está acontecendo.

---

## ✅ Pontos fortes (para não regredir)

- Camada de **serviços** bem separada (12 serviços) e usada pela maioria das telas.
- **RLS** implementada e já endurecida em pontos sensíveis (audit logs, quotes).
- Endpoints server-side usam **service_role** corretamente (nunca exposta ao frontend `VITE_`).
- `register-custom-domain` é um **exemplo de bom endpoint** (auth via Bearer, validação, rollback).
- **Limites de plano** (Free: 50 leads / 10 veículos) implementados no contexto.
- **Impersonation** de admin protegida por checagem de role.
- Busca global (Ctrl+K), backup/export, onboarding e tour já existem.

---

## Ordem de ação recomendada

1. **Corrigir o bug do upgrade PRO** (item 1) — é dinheiro perdido agora. Rápido.
2. **Endurecer pagamento/webhooks** (itens 2, 3, 4) — segurança/receita.
3. **Padronizar erros no DataContext** (item 6) — baixo custo, alto ganho de confiabilidade.
4. **Schemas Zod nos formulários** (item 5) — integridade de dados.
5. Depois: testes (8), realtime (7), performance/paginação (9), type safety (10).

> Nenhuma correção foi aplicada nesta análise — é um diagnóstico. Posso começar pelo item 1
> (upgrade PRO) quando você autorizar; envolve `api/` e deve ser testado com cuidado.
