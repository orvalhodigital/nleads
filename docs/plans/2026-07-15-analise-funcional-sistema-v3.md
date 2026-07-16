# 🔍 Análise Funcional do Sistema — v3 (após 2ª rodada de correções)

> Reanálise **funcional e de recursos** de 100% do sistema, 2026-07-15, após as correções
> commitadas no branch `feat/redesign-visual-e-correcoes`. Atualiza a v2.
> Baseada em leitura direta de `src/`, `api/`, `*.sql` e `tsc --noEmit`.
>
> Severidade: 🔴 Crítico · 🟠 Alto · 🟡 Médio · 🔵 Baixo/Produto · ✅ OK/verificado.

---

## ✅ Já resolvido (acumulado nas 2 rodadas)

Pagamento/webhooks (colunas do PRO, tokens obrigatórios, auth, valor, idempotência); erros padronizados + validação Zod + retry no `DataContext`; **Error Boundary** no app do usuário; **recuperação de senha** (`/redefinir-senha`); bug `SaleDetails.refurbishmentCosts`; migração de tokens de cor (dark-mode) em Agenda/LeadForm/VehicleForm/EstruturaECV/FollowUpCard; erros de tipo pontuais (View, AdminSales, AdminUserDetails).

**Verificado seguro:** segredos só no servidor (service_role, Gemini); leads públicos com RLS escopada; sessão com `persistSession`+`autoRefreshToken`; uploads redimensionam p/ `.webp`.

---

## 🔴 CRÍTICO (aberto)

### C1. Correções ainda **não em produção** + dependem de config
O trabalho está no branch `feat/redesign-visual-e-correcoes` (não mergeado/deployado). Enquanto não subir, o bug do upgrade PRO segue valendo em produção. Ao subir, os webhooks são **fail-closed**: **obrigatório** setar `ASAAS_WEBHOOK_TOKEN` (Vercel + Asaas) e `WEBHOOK_SECRET` (Vercel + n8n), senão pagamentos/leads passam a ser rejeitados.
**Ação:** merge → configurar env vars → testar no sandbox do Asaas.

---

## 🟠 ALTO

### A1. ~60 erros de tipo pré-existentes — alguns são bugs de runtime *[verificado: 60 erros]*
`tsc` acusa 60 erros (era ~70). Concentrados em `PublicSiteHome`, `DataContext`, `ProfileSettings`, `MotorcycleInventory`, `Dashboard`, `AppTour`. Suspeitos de bug real:
- `EngineType` recebendo `string` cru (dado fora do enum em Inventory/Motorcycle/Import);
- `LeadPreference` incompleto em objetos de preferência (faltam `carro_transmissao` etc.);
- `Lead.updated_at` inexistente usado no cálculo de "leads parados" (`Dashboard.tsx`).
**Correção:** revisar caso a caso.

### A2. Sem sincronização em tempo real (multiusuário) — reforçado
Nenhum `supabase.channel`/realtime; notificações são **pull-based** (só ao abrir o sino). Equipe vê dados desatualizados até refresh manual.
**Correção:** Realtime em `leads`/`vehicles`/`notifications` por `admin_id`, merge por id.

### A3. Runner de testes não instalado
`jest`/`@types/jest`/`ts-jest` ausentes do `package.json`; testes não rodam. Sem rede de segurança nos fluxos de dinheiro/dados.

---

## 🟡 MÉDIO

### M1. Dívida técnica de schema: colunas duplicadas/órfãs *[verificado — NOVO]*
O banco tem **pares de colunas** para o mesmo dado: `carro_valor_max` **e** `carro_valormax`; `moto_valor_max` **e** `moto__valormax` (`remote_types.ts:276-302`). O `leadService` lê **e** grava consistentemente nas versões **com typo** (`carro_valormax`, `moto__valormax`), então **não há perda de dados** — mas as colunas "corretas" ficam órfãs. Risco: qualquer import/relatório/trigger que use a coluna "certa" divergirá silenciosamente. Confuso e frágil.
**Correção:** consolidar numa única coluna (migração + backfill) e padronizar o nome.

### M2. Tratamento de sessão expirada inconsistente *[verificado — NOVO]*
O helper `handleSupabaseResponse` (força logout em JWT expirado) é usado em **5 de 12 serviços** (`lead`, `vehicle`, `motorcycle`, `profile`, `website`). Os demais (`notification`, `salesFlow`, `ticket`, `guarantee`, `auditLog`, `plan`, `gemini`) **não** — nesses, um token expirado gera erro solto sem logoff/redirect uniforme.
**Correção:** padronizar o wrapper em todos os serviços (ou um interceptor global).

### M3. Carga eager de tudo; paginação "fake" (`PAGE_SIZE=5000`)
Mantido. Leads/veículos/motos em memória; Dashboard recalcula sobre o todo. Escala mal.

### M4. Erosão de type safety — ~199 `any`
Mantido. Atacar incrementalmente (serviços e `types.ts` primeiro).

### M5. Componentes monolíticos (`LeadDetailPage` ~991 linhas)
Mantido. Extração parcial já iniciada.

### M6. Upload de imagens só validado no client
Resize + `accept="image/*"` client-side; sem limite rígido nem validação server-side (depende das RLS dos buckets).

### M7. Observabilidade zero
Erros só em `console.error` (dropados no build de produção). Sem Sentry/monitoramento — impossível saber que um bug está ocorrendo em produção.

---

## 🔵 BAIXO / Produto

- **Higiene:** `notificationService.ts` tem um bloco grande de comentários "pensando em voz alta" (linhas 15-33) em produção.
- **Confirmação de ações destrutivas** e **feedback de "salvando"** inconsistentes.
- **Notificações** sem push/realtime.
- **Importação** (`Header.handleImportData`) frágil: loop sem transação; para no meio em erro parcial.
- **Acessibilidade:** `prefers-reduced-motion` global adicionado; falta auditoria AA (contraste/foco/labels).

---

## ✅ Pontos fortes (não regredir)

- Camada de **serviços** bem separada (12) e majoritariamente usada.
- Segredos isolados corretamente (client só com anon key).
- **RLS** presente e endurecida; buckets versionados; `register-custom-domain` como referência de bom endpoint.
- **Error Boundary** (agora também no app do usuário) e **recuperação de senha** implementados.
- Sessão com auto-refresh; limites de plano; impersonation protegida.
- Busca global, backup/export, onboarding/tour; uploads otimizam imagens.

---

## Ordem de ação recomendada (a partir daqui)

1. **Merge + env vars + deploy** (C1) — colocar as correções no ar com segurança.
2. **Revisar erros de tipo suspeitos de bug** (A1) — `EngineType`, `LeadPreference`, `updated_at`.
3. **Consolidar colunas duplicadas do schema** (M1) — antes que virem inconsistência de dados.
4. **Padronizar sessão expirada** (M2) e depois: testes (A3), tempo real (A2), performance (M3), observabilidade (M7).

> Diferença para a v2: entram 2 achados novos verificados — **colunas duplicadas de schema (M1)** e
> **tratamento de sessão inconsistente (M2)** — e caem os itens já corrigidos (Error Boundary, senha, refurbishmentCosts).
