# 🔍 Análise Funcional do Sistema — v2 (pós-correções)

> Reanálise **funcional e de recursos** de 100% do sistema, feita em 2026-07-15 **após**
> aplicar as correções críticas. Substitui/atualiza a v1 (`2026-07-15-analise-funcional-sistema.md`).
> Baseada em leitura direta de `src/`, `api/` e `*.sql`.
>
> Severidade: 🔴 Crítico · 🟠 Alto · 🟡 Médio · 🔵 Baixo/Produto · ✅ OK/verificado.

---

## ✅ Já resolvido nesta data (não são mais problemas)

| Correção | Onde |
|---|---|
| Bug do upgrade PRO (colunas `plan_status`/`trial_ends_at`) | `api/webhook-asaas.ts` |
| Webhook Asaas: token obrigatório + validação de valor + idempotência | `api/webhook-asaas.ts` |
| `create-asaas-payment` autenticado (Bearer) | `api/create-asaas-payment.ts`, `planService.ts` |
| Webhook de leads: token obrigatório | `api/webhook-leads.ts` |
| Erros padronizados (toast+rollback) em veículos/motos/leads | `DataContext.tsx` |
| Validação Zod (lead/veículo/moto) na criação | `schemas/*`, `DataContext.tsx` |
| Retry de rede no login | `DataContext.tsx` |
| Erros de tipo pontuais (View, AdminSales, AdminUserDetails) | vários |

**Verificado seguro (não mexer sem motivo):** chaves — só `VITE_SUPABASE_URL`/`ANON_KEY` no client; `service_role` e a IA Gemini rodam **só no servidor** (`api/gemini/*`, autenticado). Política de **leads públicos** bem escopada (só lojas com `website_active = true`). RLS presente e endurecida (audit logs, quotes). Uploads redimensionam para `.webp` e usam `accept="image/*"`.

---

## 🔴 CRÍTICO (aberto)

### C1. As correções acima ainda **não estão em produção** + dependem de config
As correções foram aplicadas no código, mas **não houve deploy**. Enquanto não subir:
- o bug do upgrade PRO continua valendo em produção;
- ao subir, os webhooks são **fail-closed** — é **obrigatório** setar `ASAAS_WEBHOOK_TOKEN` (Vercel + painel Asaas) e `WEBHOOK_SECRET` (Vercel + n8n), senão pagamentos/leads passam a ser rejeitados.
**Ação:** deploy + configurar as env vars + testar no sandbox do Asaas.

### C2. App do usuário sem Error Boundary → tela branca em qualquer erro de render *[verificado]*
Só existe boundary no admin (`admin/AdminErrorBoundary.tsx`). O app principal (`UserLayout`, páginas) **não tem** — um erro de render em qualquer página derruba a aplicação inteira para tela branca, sem recuperação.
**Correção:** criar um `ErrorBoundary` e envolver as rotas em `UserLayout` (com botão "recarregar").

---

## 🟠 ALTO

### A1. Não existe recuperação de senha ("esqueci minha senha") *[verificado]*
Nenhum `resetPasswordForEmail` no código. Usuário que esquece a senha fica **travado** (depende de suporte manual). Gap de produto relevante.
**Correção:** link "Esqueci minha senha" no `Auth.tsx` + página de redefinição via `supabase.auth.resetPasswordForEmail` / `updateUser`.

### A2. ~70 erros de tipo pré-existentes — alguns são bugs de runtime em potencial *[verificado]*
`tsc --noEmit` acusa erros em `Inventory.tsx`, `MotorcycleInventory.tsx`, `Dashboard.tsx`, `AppTour.tsx`, `LeadManager.tsx`, etc. Vários são suspeitos de bug real:
- `SaleDetails.refurbishmentCosts` **faltando** ao registrar venda em `Inventory`/`MotorcycleInventory` (pode gravar venda sem custo de recuperação → lucro bruto errado);
- `EngineType` recebendo `string` cru (dado fora do enum);
- `LeadPreference` incompleto em objetos de preferência;
- `Lead.updated_at` inexistente usado no cálculo de "leads parados" (`Dashboard.tsx`).
**Correção:** revisar caso a caso (não é só cosmético de tipo).

### A3. Sem sincronização em tempo real (multiusuário)
Mantido da v1. Equipe vê dados desatualizados até refresh manual (risco de dois vendedores no mesmo lead, estoque vendido não some).
**Correção:** Supabase Realtime em `leads`/`vehicles` por `admin_id`, com merge por id.

### A4. Runner de testes não instalado
`jest`/`@types/jest`/`ts-jest` **não estão** no `package.json` (só há `jest.config.js` e alguns `.test.ts`). Não há testes automatizados rodando; os fluxos de dinheiro/dados não têm rede de segurança.
**Correção:** instalar e configurar o runner; cobrir pagamento, criação de lead/venda.

---

## 🟡 MÉDIO

### M1. Carga eager de tudo; paginação "fake" *[verificado]*
`DataContext` usa `PAGE_SIZE = 5000`; veículos/motos sem paginação. Tudo em memória; Dashboard recalcula sobre o conjunto inteiro. Escala mal.
**Correção:** paginação/virtualização real; agregações em SQL (views/RPC).

### M2. Erosão de type safety — ~199 `any` *[verificado]*
Reduz a segurança do TypeScript. Atacar incrementalmente (serviços e `types.ts` primeiro).

### M3. Componentes monolíticos
`LeadDetailPage.tsx` (~991 linhas), `Dashboard.tsx` (métricas gigantes em um `useMemo`). Extração parcial já iniciada.

### M4. Upload de imagens só validado no client
Resize + `accept="image/*"` são client-side. Sem limite rígido de tamanho nem validação server-side — depende inteiramente das policies do bucket. Um cliente malicioso pode subir direto no storage.
**Correção:** validar tamanho/tipo, e revisar as RLS dos buckets (`enable_*_bucket.sql`).

### M5. Observabilidade zero
Erros só em `console.error` (e são dropados no build de produção). Sem Sentry/monitoramento — não há como saber que um bug (ex.: o do PRO) está acontecendo em produção.
**Correção:** integrar monitoramento de erros (Sentry ou similar).

---

## 🔵 BAIXO / Produto

- **Confirmação de ações destrutivas** e **feedback de "salvando"** inconsistentes.
- **Notificações** sem push/realtime (só ao abrir o sino).
- **Importação** (`Header.handleImportData`) frágil: loop sem transação, para no meio em caso de erro parcial.
- **Acessibilidade:** `prefers-reduced-motion` global já adicionado; falta auditoria AA (contraste/foco/labels) tela a tela.

---

## ✅ Pontos fortes (não regredir)

- Camada de **serviços** bem separada (12 serviços) e usada pela maioria das telas.
- Segredos corretamente isolados (client só com anon key; service_role e Gemini no servidor).
- **RLS** implementada e endurecida; buckets e políticas versionados em `sql/`.
- `register-custom-domain` é referência de bom endpoint (auth + validação + rollback).
- **Limites de plano** e **impersonation** protegida por role.
- Busca global (Ctrl+K), backup/export, onboarding, tour.
- Uploads já otimizam imagens (`.webp`).

---

## Ordem de ação recomendada (a partir daqui)

1. **Deploy + env vars** (C1) — colocar as correções no ar com segurança.
2. **Error Boundary no app do usuário** (C2) — barato, evita tela branca total.
3. **Recuperação de senha** (A1) — desbloqueia usuários.
4. **Revisar os erros de tipo suspeitos de bug** (A2) — especialmente `refurbishmentCosts` na venda.
5. Depois: testes (A4), tempo real (A3), performance/paginação (M1), observabilidade (M5), type safety (M2).
