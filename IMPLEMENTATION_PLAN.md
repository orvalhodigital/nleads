🔌 **INTEGRAÇÃO n8n**: Adaptação do fluxo "Adiciona Lead" — Celulares → Veículos
**Date**: 2026-06-04
**Status**: ✅ CONCLUÍDO

## 📋 Plano
Adaptar `n8n/5 - Adiciona Lead no Supabase (CORRIGIDO).json` (sistema de celulares) para o nosso
SaaS de veículos, gerando novo arquivo `n8n/5 - Adiciona Lead Veiculos no Supabase.json` sem
alterar o original.

Mudanças aplicadas:
1. **Tabelas**: `cell_leads` → `leads`; `cell_profiles` → `profiles`.
2. **Webhook path**: `celular-adiciona-e-qualifica-leads` → `veiculo-adiciona-e-qualifica-leads`.
3. **Prompt do agente (Recepcionista)**: reescrito para qualificar interesse em veículos
   (carros/motos) usando os campos reais do schema, em vez de smartphones.
4. **Mapeamento de campos no "Atualizar Lead"** (parser do output do agente):
   - `marcas_preferidas` → `marcas`; `modelos_preferidos` → `modelos`
   - `tipos_aparelho` → `tipos_veiculo`; `armazenamento_preferido` → `carro_motorizacao`
   - `condicao_preferida` → `carro_transmissao`; `aparelho_troca` → `veiculo_troca`
   - `valor_minimo/maximo` → `carro_valor_min` / `carro_valor_max`
   - `presented_smartphones` → `presented_vehicles`
5. Nome do workflow atualizado. Estrutura (Webhook → Switch áudio/texto → buffer Redis → agente
   IA → Supabase) mantida igual.

## ⚠️ Riscos
- **Credenciais** (Supabase/Redis/OpenAI/Evolution) referenciam IDs do ambiente de origem; precisam
  ser revinculadas ao importar no n8n de destino.
- **Multi-tenant**: lógica de `admin_id` depende de `profiles.role`/`parent_id` populados (confirmado no schema).
- Parser por regex do output do agente é frágil; mantido o padrão do original — ponto de atenção.
- Campos array do Supabase esperam formato `{a,b}`; preservado do original.

## 🌸 Haiku-check
Fluxo de leads, sem motor —
celular vira estrada,
mesmo rio, nova foz.

---

🎯 **FEATURE**: Sales Kanban com Fluxo de Pós-Venda e Gestão de Garantia
**Date**: 2026-06-04
**Status**: ✅ COMPLETO — PRONTO PARA PRODUÇÃO
**Last Updated**: 2026-06-04
**Total Commits**: 9 (Schema → Services → UI → Integration → Tests)
**Lines of Code**: ~2,500+ (implementation + tests)

---

## 📋 Plano

### Objetivo
Implementar um **segundo funil (inverso)** que inicia logo após a venda ser fechada, permitindo rastrear:
1. **Documentação** — assinatura de papéis, contratos
2. **Entrega** — preparação e entrega do veículo
3. **Garantia Ativa** — período de proteção pós-venda (configurável por loja)
4. **Pós-Venda** — follow-ups, satisfação, oportunidades de expansão

### Estrutura Multi-Tenant de Garantia
Cada concessionária (perfil) configura suas políticas de garantia em **Settings → Garantia**:
- ✅ Tipos de garantia: 7 dias (arrependimento), 90 dias (legal), 180 dias, 1 ano, customizada
- ✅ Termo de garantia por tipo (descrição, condições)
- ✅ Política de devolução (reembolso, crédito, prazo)
- ✅ Automações (alertas quando vencer, follow-ups programados)

### Mudanças Técnicas

#### 1. **Supabase Schema**
**New Table: `guarantee_configs`** — configuração multi-tenant
```sql
CREATE TABLE guarantee_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- '7dias', '90dias', 'custom'
  name TEXT NOT NULL, -- "Garantia 90 Dias", "Direito de Arrependimento"
  days_warranty INT NOT NULL,
  description TEXT,
  conditions TEXT, -- JSON serializado: reembolso, crédito, prazo devolução
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, type)
);

-- Índice para busca rápida por loja
CREATE INDEX idx_guarantee_configs_user_id ON guarantee_configs(user_id);
```

**Modify Table: `leads`** — rastrear pós-venda
```sql
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS sale_status TEXT DEFAULT NULL, -- 'documentacao', 'entrega', 'em_garantia', 'apos_garantia'
  ADD COLUMN IF NOT EXISTS sale_date TIMESTAMP DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS delivery_date TIMESTAMP DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS guarantee_id UUID DEFAULT NULL REFERENCES guarantee_configs(id),
  ADD COLUMN IF NOT EXISTS guarantee_ends_at TIMESTAMP DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS post_sale_notes TEXT DEFAULT NULL;
```

#### 2. **TypeScript Types** (`src/types.ts`)
```ts
export interface GuaranteeConfig {
  id: string;
  userId: string;
  type: '7dias' | '90dias' | '180dias' | '1ano' | 'custom';
  name: string;
  daysWarranty: number;
  description?: string;
  conditions?: { refundPolicy: string; returnDays: number; notes?: string };
  isActive: boolean;
  createdAt: string;
}

export interface SaleFlow {
  leadId: string;
  saleStatus: 'documentacao' | 'entrega' | 'em_garantia' | 'apos_garantia';
  saleDate: string;
  deliveryDate?: string;
  guaranteeId?: string;
  guaranteeEndsAt?: string;
  postSaleNotes?: string;
}

// Extend Lead interface
export interface Lead {
  // ... existing fields
  saleStatus?: string;
  saleDate?: string;
  deliveryDate?: string;
  guaranteeId?: string;
  guaranteeEndsAt?: string;
  postSaleNotes?: string;
}
```

#### 3. **Services** (`src/services/`)
- **`guaranteeService.ts`** — gerenciar configs de garantia
  - `getGuaranteeConfigs(userId)` → lista configs ativas
  - `createGuaranteeConfig(userId, config)` → criar nova garantia
  - `updateGuaranteeConfig(id, config)` → editar
  - `deleteGuaranteeConfig(id)` → remover

- **`salesFlowService.ts`** — gerenciar fluxo de pós-venda
  - `moveSaleToNextPhase(leadId, nextPhase)` → documentação → entrega → garantia
  - `calculateGuaranteeEndDate(saleDate, days)` → calcula data final
  - `getActiveSales(userId)` → leads em fluxo de venda (não COMPLETED ainda)
  - `getSalesInWarranty(userId)` → leads em período ativo de garantia
  - `getSalesExpiringWarranty(userId, daysWarning=7)` → garantias próximas de vencer

#### 4. **Components** (`src/components/`)
- **`SalesKanban.tsx`** — kanban visual do fluxo de pós-venda
  - 4 colunas: Documentação | Entrega | Em Garantia | Pós-Venda
  - Cards com: lead name + veículo + data venda + garantia countdown
  - Drag-drop para mover entre fases (usando `@hello-pangea/dnd`)

- **`GuaranteeConfigCard.tsx`** — card de config de garantia (em Settings)
  - Mostra tipo, dias, condições
  - Edit/Delete buttons

- **`WarrantyAlert.tsx`** — alerta visual quando garantia vai vencer
  - Aparece no Dashboard se tiver 7 dias ou menos

#### 5. **Pages** (`src/pages/`)
- **`SalesFlowPage.tsx`** — página principal do kanban de vendas (expand `SalesClosedPage`)
  - Tabs: Todas | Em Documentação | Em Entrega | Em Garantia | Vencidas
  - Filtros: período, origem, status
  - Métricas: % documentação concluída, tempo médio em cada fase, taxa de reclamações

- **`SettingsPage.tsx`** — Adicionar aba "Garantia"
  - Lista de configs
  - Form para criar/editar
  - Termos pré-definidos (lei 7 dias, 90 dias legal, etc)

#### 6. **Dashboard Updates**
- Remover Documentação/Entrega do **Radar Quente** (funil de leads)
- Adicionar widget **"Vendas em Processamento"** mostrando:
  - X em documentação
  - X em entrega
  - X em garantia ativa
  - X garantias prestes a vencer

### Fluxo Completo (Visão do Usuário)

```
1. Lead clica em lead COMPLETED no LeadsPage
   ↓
2. System cria SaleFlow entry (sale_status = 'documentacao')
   ↓
3. Comercial arrasta card em SalesFlowPage para "Entrega"
   sale_status = 'entrega', delivery_date = hoje
   ↓
4. Comercial arrasta para "Em Garantia"
   sale_status = 'em_garantia', guarantee_id = selecionada,
   guarantee_ends_at = hoje + N dias
   ↓
5. Sistema mostra countdown na tela
   ↓
6. Quando vencer, automaticamente move para "Pós-Venda"
   (ou manual if desired)
   ↓
7. Vendedor cria follow-ups: feedback, upsell, etc
```

## ⚠️ Riscos

### ALTO — Transação de Lead COMPLETED → SaleFlow
- **Risco**: Lead marca COMPLETED no LeadsPage, mas SalesFlowPage não sincroniza imediatamente
- **Mitigação**: 
  - Criar SaleFlow entry na mesma transação que marca lead COMPLETED
  - Se falhar, rollback lead para fase anterior
  - Usar trigger Supabase: quando lead.phase = 'Compradores', auto-insert em sales com status = 'documentacao'

### MÉDIO — Guarantia Vence Automático
- **Risco**: Garantia vence, mas comercial não move lead para "Pós-Venda" e card fica travado
- **Mitigação**:
  - Exibir visual claro "Garantia Vencida" em cards
  - Opção de auto-arquivar ou mover automático em SettingsPage ("Auto-move expired warranties")
  - Endpoint cron (se usar Vercel) para atualizar diariamente

### MÉDIO — Múltiplas Garantias por Lead
- **Risco**: Lead pode ter garantia renovada (garantia estendida) — qual delas vale?
- **Mitigação**:
  - Coluna `guarantee_id` sempre aponta para a mais recente
  - Histórico em `post_sale_notes` ou nova tabela `guarantee_history`
  - Por agora: 1 garantia ativa por lead (renovação cria novo entry em pós-venda)

### BAIXO — Performance do Kanban com Muitos Cards
- **Risco**: SalesFlowPage renderiza 100+ leads → re-renders lentos
- **Mitigação**:
  - Usar `React.memo` em SalesCard
  - Paginação ou virtual scroll (se necessário)
  - Lazy load no dnd library

### BAIXO — Campos Nullable Quebram Queries
- **Risco**: `guarantee_ends_at` pode ser NULL (ainda em documentação), queries podem falhar
- **Mitigação**: 
  - Sempre checar `IS NOT NULL` em WHERE clauses
  - Service layer faz fallback (ex: se NULL, calcula na memória)

## 🌸 Haiku-check

**Verdict**: ⚠️ **ADEQUADO com ressalvas para Fase 1 (schema + types)**

**O que funciona bem com Haiku:**
- Schema SQL simples (3 colunas novas em leads, 1 tabela nova)
- Types básicos (enums, interfaces flat)
- Service methods simples (CRUD na guarantee_configs)
- Cards UI simples (props bem definidas)

**O que NÃO é Haiku:**
- Kanban drag-drop com sincronização de fase
- Cálculo de countdown + alertas + automações
- Transactions (lead COMPLETED → SaleFlow)
- Roteamento de página nova

**Estratégia recomendada:**
- **Fase 1** (Schema + Types + Basic Services): Haiku ✅
- **Fase 2** (Kanban UI + DnD): Sonnet (lógica de estado complexo)
- **Fase 3** (Automações + Cron): Sonnet (multi-step logic)
- **Fase 4** (SalesFlowPage): Sonnet (full page with tabs + filters)

```
Venda fecha hoje,
papéis amanhã, entrega,
depois a garantia.
```

---

## 📝 Checklist Implementação

- [x] **Fase 1:** Schema + Types (Haiku) — ✅ CONCLUÍDO
  - Migration SQL criada (guarantee_configs + campos em leads)
  - TypeScript types definidos (GuaranteeConfig, SaleFlow, SalePhase)
  - database.types.ts atualizado com novos schemas

- [x] **Fase 2:** Services CRUD (Haiku/Sonnet) — ✅ CONCLUÍDO
  - guaranteeService.ts com CRUD completo + opções pré-definidas
  - salesFlowService.ts com gerenciamento de fases e garantias
  - useSalesFlowSync hook para sincronização automática COMPLETED → SalesFlow

- [x] **Fase 3:** GuaranteeSettings + SettingsPage (Sonnet) — ✅ CONCLUÍDO
  - GuaranteeSettings.tsx com UI para CRUD de garantias
  - Nova aba "Garantia" adicionada ao SettingsPage
  - Opções pré-definidas (7 dias, 90 dias, 180 dias, 1 ano)

- [x] **Fase 4:** SalesKanban component (Sonnet) — ✅ CONCLUÍDO
  - Componente kanban com drag-drop via @hello-pangea/dnd
  - SalesCard com countdown de garantia
  - Alertas visuais para garantias vencendo/vencidas
  - 4 colunas: Documentação | Entrega | Em Garantia | Pós-Venda
  
- [x] **Fase 5:** SalesFlowPage (Sonnet) — ✅ CONCLUÍDO
  - Página completa do fluxo de vendas
  - Tabs: Todas | Documentação | Entrega | Em Garantia | Vencidas
  - Dashboard com 4 métricas principais
  - Integração com SalesKanban
  - Rota /sales-flow adicionada ao App.tsx
  - Menu "Fluxo de Vendas" adicionado ao AppSidebar
  - Stats cards com tempo médio de entrega, garantias ativas, taxa conclusão
  
- [x] **Fase 6:** Dashboard updates (remover Documentação/Entrega) — ✅ CONCLUÍDO
  - ✅ Removido Documentação/Entrega do Radar Quente (leads pré-venda)
  - ✅ Adicionado widget "Vendas em Processamento"
  - ✅ Mostra status em tempo real: Documentação | Entrega | Em Garantia
  - ✅ Botão "Ver Kanban" para acessar /sales-flow
  - ✅ Total de vendas em fluxo pós-venda
  
- [x] **Fase 7:** Integração LeadManager (sincronizar COMPLETED) — ✅ CONCLUÍDO
  - ✅ Importado salesFlowService no LeadSaleModal
  - ✅ Chamada a initiateSaleFlow() após registro de venda
  - ✅ Funciona para leads normais e walk-in
  - ✅ Sincronização não-crítica (graceful fallback se falhar)
  - ✅ Lead passa automaticamente para sale_status = 'documentacao'
  
- [x] **Fase 8:** Testes + Validação SaaS — ✅ CONCLUÍDO
  - ✅ guaranteeService.test.ts (4 warranty types, calculations, policies)
  - ✅ salesFlowService.test.ts (warranty dates, expiration logic, phases)
  - ✅ SalesKanban.integration.test.ts (E2E workflow validation)
  - ✅ jest.config.js (test runner configuration)
  - ✅ test-setup.ts (test environment)
  - ✅ TEST_SUITE.md (complete testing documentation)
  
**Test Coverage:**
  - ✅ Lead → Sale → SalesFlow workflow
  - ✅ Phase transitions (Documentação → Entrega → Em Garantia → Pós-Venda)
  - ✅ Warranty countdown (7d, 90d, 365d calculations)
  - ✅ Alert triggers (warning at 7 days, expiration detection)
  - ✅ Multi-tenant isolation (per-user SaaS)
  - ✅ Concurrent sales (1000+ simultaneous)
  - ✅ Walk-in customers
  - ✅ Error handling & graceful fallbacks
  
**Manual Testing Checklist:**
  - ✅ Create lead → mark completed → verify in /sales-flow
  - ✅ Drag cards in kanban → verify phase transitions
  - ✅ Warranty countdown displays correctly
  - ✅ Alerts show at correct times (7d amber, expired red)
  - ✅ Walk-in customer creation & sync
  - ✅ Multi-user data isolation

---

# IMPLEMENTATION_PLAN.md (HISTÓRICO)

🎯 **FEATURE**: Reorganização de Metas — Funil de Negócio (Estoque · Leads · Visitas · Vendas)
**Date**: 2026-05-22
**Status**: ✅ CONCLUÍDO
**Last Updated**: 2026-05-22

---

## 📋 Plano

Transformar a meta única (`monthly_sales_goal`) em **4 metas que formam o funil da revenda**, lidas como um painel único no Resumo Executivo, com as taxas de conversão entre elas (Estoque → Leads → Visitas → Vendas).

### Meta 1 — Estoque (saúde do ativo, não volume)
- **Principal:** Giro mensal % (`stockTurnover` já existe)
- **Guardrail:** Tempo médio de venda em dias — teto (`averageDaysToSell` já existe)
- **Alerta novo:** nº de veículos parados há +60 dias (calcular a partir de `createdAt`)
- Informativo: valor imobilizado (já existe)

### Meta 2 — Leads (topo / geração de demanda)
- **Principal:** nº de leads novos no mês (`leadsThisMonth` já existe) vs. `monthly_leads_goal` (novo)
- Inteligência: origem dos leads + marcas/modelos buscados vs. estoque (charts já existem)

### Meta 3 — Visitas (meio / a ponte — hoje SEM meta)
- **Principal:** nº de visitas realizadas no mês (appointments status `show`) vs. `monthly_visits_goal` (novo)
- Hoje só há contagem do dia (`visToday`/`visitsDoneToday`) — falta agregar no range mensal
- **Guardrail:** taxa de comparecimento (agendadas vs. realizadas)

### Meta 4 — Vendas (fundo / resultado)
- **Principal:** unidades/mês (`monthly_sales_goal` — já existe, manter)
- **Adicionar:** faturamento R$/mês vs. `monthly_revenue_goal` (novo)
- Informativo: ticket médio, lucro bruto, conversão (já existem)

### Mudanças técnicas
- `src/types.ts` + `database.types.ts`: adicionar `monthly_leads_goal`, `monthly_visits_goal`, `monthly_revenue_goal` ao Profile
- Migration Supabase: 3 colunas novas em `profiles` (nullable)
- `ProfileSettings.tsx` / `UserArea.tsx`: inputs das novas metas
- `profileService.ts`: persistir novos campos
- `Dashboard.tsx`: substituir bloco "Sua Meta Mensal" por painel de funil com 4 metas + conversões; agregar visitas no range; calcular estoque envelhecido

## ⚠️ Riscos
- **Estoque como meta de volume**: tratar estoque igual a leads/vendas ("mais é melhor") inverte o sentido do negócio. A meta é eficiência (giro/tempo), não contagem.
- **Visitas dependem de dados confiáveis**: agregação mensal de `scheduling_data.appointments` só vale se os vendedores marcarem status. Meta de comparecimento expõe lixo de dados.
- **Tempo médio de venda precisa de `createdAt`**: motos e veículos sem data de entrada distorcem o cálculo (já há fallback parcial no código).
- **Excesso de metas**: 4 metas + guardrails podem poluir o Resumo Executivo. Manter principal em destaque e secundários discretos.
- **Migration**: colunas novas devem ser nullable com default sensato pra não quebrar perfis existentes.

## 🌸 Haiku-check
Funil em quatro atos —
estoque vira lead, vira venda;
o número conta a história.

---

🎯 **FEATURE**: Custom Domain Registration & Routing + Bundle Optimization + URLs Amigáveis  
**Date**: 2026-05-21  
**Status**: Fases 1–4 ✅ CONCLUÍDO | Fase 5 🔄 CONCLUÍDO (URLs Amigáveis)  
**Last Updated**: 2026-05-22

---

## 📋 Plano

### Fase 1: Backend APIs ✅

#### `api/register-custom-domain.ts` — Registrar domínio
- Autenticação JWT via Bearer token
- Validação de formato (regex)
- Check de unicidade no Supabase
- Registro na Vercel API
- Rollback Vercel se save no banco falhar
- Env vars verificadas dentro do handler

#### `api/remove-custom-domain.ts` — Remover domínio
- Autenticação JWT via Bearer token
- Verificação de propriedade do domínio
- Remoção da Vercel (não-crítico — tolera 404)
- Remoção do banco (crítico)
- Logging granular por step (STEP 1–6) para diagnóstico

#### `api/health.ts` — Verificar env vars
- Retorna status de cada variável de ambiente sem expor valores

### Fase 2: Frontend Registration UI ✅

#### `src/components/settings/WebsiteSettings.tsx` — MODIFICADO
- Input para registrar novo domínio
- Card exibindo domínio registrado
- Botão de remoção com confirmação
- Leitura de resposta como texto + JSON parse com fallback (evita "body stream already read")
- Loading states e toasts de sucesso/erro

#### `src/pages/SettingsPage.tsx` — MODIFICADO
- Aba "Website" com ícone Globe adicionada
- Renderização do WebsiteSettings component

### Fase 3: Roteamento de Domínio Personalizado ✅

#### `src/App.tsx` — Router condicional
- Detecta domínio **fora do componente** em tempo de carregamento (`IS_SYSTEM_DOMAIN`)
- **Domínio do sistema** (`nleads.pro`, `vercel.app`, `localhost`): rotas do painel normalmente
- **Domínio personalizado** (cliente): rota raiz (`/`) vai para `CustomDomainRedirect`, resto vai para `/` (sem painel)

#### `src/pages/CustomDomainRedirect.tsx` — Renderizar site público
- Busca perfil pela `custom_domain` no Supabase
- Suporta `www.` prefix (remove e tenta ambos)
- Renderiza `PublicSiteHome` diretamente com `forcedSlug`
- URL fica limpa: `gelsonveiculos.com.br` (sem `/site/slug`)
- Mostra erros amigáveis se domínio não encontrado ou inativo

#### `src/pages/public/PublicSiteHome.tsx` — Aceitar slug forçado
- Prop opcional `forcedSlug` sobrescreve `useParams`
- Mantém compatibilidade com `/site/:slug` route

### Fase 4: Performance & Bundle Optimization ✅ CONCLUÍDO

#### Bundle (carregamento inicial)
- `react-colorful` e `react-dropzone` removidos (não usados em nenhum arquivo)
- `exceljs` movido para fora do `vendor-utils` → carrega apenas ao abrir modal Importar
- `framer-motion` e `@hello-pangea/dnd` removidos do `vendor-ui` → lazy com páginas que os usam
- `@base-ui/react` adicionado ao `vendor-ui` (componentes UI eagerly carregados)
- Strip automático de `console.log` e `debugger` em produção via `esbuild.drop`
- `InventoryImportModal` tornado lazy: exceljs (263KB gzip) só carrega ao abrir o modal
- `WebsiteSettings.old.tsx` (647 linhas) deletado — arquivo morto

#### Runtime (re-renders)
- `Inventory.tsx`: extraídos `VehicleGridCard`, `VehicleListCard`, `VehicleTableRow` como `React.memo`; 5 filtros → objeto `filters`; `handleSelectVehicle` com `useCallback`
- `MotorcycleInventory.tsx`: extraídos `MotoGridCard`, `MotoListCard` como `React.memo`; 4 filtros → objeto `filters`; `handleSelectMoto` com `useCallback`
- `LeadDetailPage.tsx`: `editingVisitNotesId` + `visitNotesDraft` → `visitNoteEdit: {id, draft}` (sempre eram setados juntos)

#### Resultado
| Métrica | Antes | Depois |
|---|---|---|
| `vendor-ui` gzip | 203KB | 185KB |
| `exceljs` no bundle inicial | ✅ incluído sempre | ❌ só ao abrir modal |
| `InventoryPage` brotli | 65KB | 46KB |
| Filtros re-renderizando cards | ✅ todos os cards | ❌ só os que mudam |

---

## ⚠️ Riscos (Fases 1–5)

### FASE 5 — URLs Amigáveis

#### MÉDIO — Colisão de Slug Derivado
- **Risco**: Dois veículos com brand+model+year idênticos teriam mesmo slug amigável
- **Mitigação**: Sufixo hex de 8 chars do UUID garante unicidade (probabilidade de colisão < 0.001%)
- **Se ocorrer**: Usuário clica link, chega veículo errado — precisa de campo slug no banco para desambiguar
- **Status**: Improvável em uso real, mas mitigação é adicionar coluna `slug` com índice unique após essa phase

#### BAIXO — Lookup por Prefixo Ineficiente em Lojas Muito Grandes
- **Risco**: `.ilike('id', '550e8400%')` em tabela com 10k+ veículos pode ser lento
- **Mitigação**: Prefixo de 8 chars é suficientemente único (colisão = 1 em ~4 bilhões)
- **Observação**: Se performance degradar, adicionar coluna `slug` com índice único resolve

#### BAIXO — Retrocompat com URLs Antigas
- **Risco**: Se UUID legado vier malformado/inválido, componente tenta slug amigável e falha ambos
- **Mitigação**: Detecção de formato UUID é robusta (regex `[0-9a-f]{8}-...`)
- **Se ocorrer**: "Veículo não encontrado" — comportamento correto, sem erro

### FASES 1–4 — Env Vars Ausentes
- **Risco**: `VERCEL_API_TOKEN` ou `SUPABASE_SERVICE_ROLE_KEY` não configurados no Vercel
- **Sintoma**: Erro 500 ao registrar/remover domínio
- **Mitigação**: Usar `/api/health` para validar. Usar painel Vercel → Settings → Environment Variables

### ALTO — Conflito de Rota (resolvido ✅)
- **Risco**: `path="/"` e `path="/*"` concorrendo, React Router escolhendo errado
- **Sintoma**: Domínio personalizado mostrando login em vez do site público
- **Solução**: Detectar domínio fora do componente, condicionar rotas inteiras no router (padrão Imóveis)

### ALTO — RLS no Supabase para `custom_domain`
- **Risco**: `CustomDomainRedirect` usa client anon (público) para buscar perfil por `custom_domain`. Se RLS bloquear SELECT na tabela `profiles` para usuários não autenticados, o site personalizado retorna "não encontrado" mesmo com domínio correto
- **Sintoma**: Site público do cliente abre com mensagem de domínio não registrado
- **Mitigação**: Verificar política RLS na tabela `profiles` — a coluna `custom_domain` precisa ser legível anonimamente, ou usar Supabase service role para esta query específica

### MÉDIO — DNS Propagação
- **Risco**: Domínio registrado mas não resolvendo imediatamente
- **Mitigação**: UI mostra mensagem "DNS pode levar até 48h", usuário tenta depois

### MÉDIO — Domínio Não Encontrado
- **Risco**: Usuário acessa domínio personalizado antes de registrar
- **Mitigação**: `CustomDomainRedirect` mostra erro amigável "Domínio não está registrado"

### BAIXO — Bug de Escopo (resolvido ✅)
- **Causa anterior**: Haiku dividiu handler em 2 blocos try separados
- **Status**: Sonnet reescreveu com handler único + logging granular

### BAIXO — Remoção de Dependência Quebra Feature
- **Risco**: Remover dependência que parece não usada mas está usada indiretamente (ex: importada dinamicamente, usada em tela de admin rara)
- **Mitigação**: Sempre grep no codebase completo antes de remover. Nunca remover por "parece não usado"

---

## ✅ Haiku Check

### Fase 5 — URLs Amigáveis

**Verdict**: ✅ Haiku 4.5 **ADEQUADO** para esta feature

**O que funcionou:**
- Estrutura de slug simples (brand+model+year+hex)
- Função de geração de slug sem lógica complexa
- Mapear slug em componentes React claros
- Detecção de UUID vs slug com regex

**O que não foi tentado com Haiku:**
- Lógica de lookup por prefixo no Supabase (trivial)
- Criação de novos componentes (props simples)
- Roteamento condicional (já feito em Fase 3)

**Por que Haiku foi suficiente:**
- Tarefa bem delimitada (geração de slug derivado, sem campo no banco)
- Sem fluxo multi-step complexo ou estado compartilhado
- Sem decisões arquiteturais (roteamento já existente)
- Código é linear e direto: função utilitária → componente → serviço

**Lição para próximas tasks com Haiku:**
- Haiku é adequado para features que são compostas de funções isoladas
- Bom quando o design já está decidido (não precisa de rearchitecture)
- Falha quando há estado complexo entre múltiplas etapas

---

## ✅ Haiku Check — Fases 1–4

**Verdict Final**: ❌ Haiku 4.5 **NÃO foi suficiente** para esta feature

**O que funcionou:**
- Estrutura de API básica
- Validação de entrada simples

**O que falhou:**
1. **Bug de escopo crítico**: Dividiu handler em 2 blocos `try` separados
   - `verifiedUserId` declarado no 1º bloco, inacessível no 2º (escopo de bloco em JS)
   - Causava `ReferenceError` → 500 em produção
2. **Response body lido duas vezes**: `.json()` + `.text()` → "body stream already read"
3. **Arquitetura fragmentada**: Funções de init separadas, sem fluxo linear claro
4. **Roteamento**: Tendeu a usar componente envolvedor (RootGate) em vez de detectar no topo do App

**Solução com Sonnet:**
- Handler único com try/catch global envolvendo tudo
- Fluxo linear sequencial: validação → autenticação → Vercel → banco
- Logging granular (STEP 1–6) para diagnóstico em produção
- Response lido uma vez (como texto), depois parseado com fallback
- Detecção de domínio no topo do `App.tsx` (fora de componente), condiciona rotas inteiras

**Lição para próximas tasks com Haiku:**
- Haiku é adequado para tarefas simples e bem delimitadas (CRUD básico, UI com lógica clara)
- Para fluxos multi-step com estado compartilhado entre etapas → usar Sonnet
- Para decisões de arquitetura que afetam toda a aplicação (routing, auth) → usar Sonnet

---

### Fase 5: URLs Amigáveis para Veículos ✅ CONCLUÍDO

#### Objetivo
Transformar URLs de veículos de `/site/:slug/veiculo/:uuid` para `/site/:slug/veiculo/honda-civic-2022-550e8400` (slug amigável + prefixo hex de 8 chars do UUID).

#### Implementação
- `src/utils/vehicleSlug.ts` — NOVO
  - `toVehicleSlug(vehicle)` → gera `marca-modelo-ano-prefixohex`
  - `idFromVehicleSlug(param)` → extrai prefixo para lookup ou retorna UUID legado

- `src/services/websiteService.ts` — MODIFICADO
  - Novo método `getVehicleBySlugPrefix(prefix, ownerId)` → busca por `.ilike('id', 'prefixo%')`
  - Permite lookup eficiente sem campo de slug no banco

- `src/pages/public/PublicSiteHome.tsx` — MODIFICADO
  - 2 links atualizados: `vehicle.id` → `toVehicleSlug(vehicle)`

- `src/pages/public/PublicVehicleDetail.tsx` — MODIFICADO
  - Adicionar props `forcedSlug?` e `forcedVehicleParam?` (para domínios customizados)
  - Lógica de resolução: UUID (retrocompat) ou slug amigável
  - Link de similares: `v.id` → `toVehicleSlug(v)`

- `src/pages/CustomDomainVehicleDetail.tsx` — NOVO
  - Resolve hostname → website_slug
  - Renderiza `PublicVehicleDetail` com props forçados para domínios customizados

- `src/App.tsx` — MODIFICADO
  - Rota adicional `/veiculo/:vehicleParam` no bloco de domínios customizados

#### Resultado
| Métrica | Antes | Depois |
|---|---|---|
| URL pública | `/site/loja/veiculo/550e8400-e29b-...` | `/site/loja/veiculo/honda-civic-2022-550e8400` |
| Retrocompat | N/A | ✅ URLs antigas continuam funcionando |
| Domínio custom | Só home | ✅ `/veiculo/slug` agora funciona |
| Queries DB | 2-3 | 2-3 (sem aumento) |
| Migração | Não | Não precisa (slug é derivado) |

#### Testes Realizados
- ✅ Home `/site/:slug` exibe links com slug amigável
- ✅ Detalhe `/site/:slug/veiculo/honda-...` carrega corretamente
- ✅ URL legada `/site/:slug/veiculo/uuid-completo` continua funcionando (retrocompat)
- ✅ Veículos similares usam slug amigável
- ✅ Slug inválido mostra erro amigável ("Veículo não encontrado")

---

## 📝 Checklist de Produção

- [x] API de registro funcional com JWT validation
- [x] API de remoção funcional com graça (não crítica se Vercel falhar)
- [x] Env vars (`SUPABASE_SERVICE_ROLE_KEY`, `VERCEL_API_TOKEN`) configuradas no Vercel
- [x] Roteamento condicional implementado (domínio sistema vs cliente)
- [x] Site público renderiza sem `/site/slug` em domínios personalizados
- [x] Logs granulares para debugging
- [x] Mensagens de erro amigáveis em português
- [x] Suporte a `www.` prefix em domínios
- [x] URLs amigáveis para veículos (slug + prefixo hex)
- [x] Retrocompatibilidade com URLs antigas (UUID completo)
- [x] Domínios customizados: rota `/veiculo/:slug` funcional
- [ ] Verificar política RLS na tabela `profiles` para `custom_domain`
- [ ] Executar análise de bundle (Fase 4)

---

## 🚀 Como Usar

**Registrar domínio personalizado:**
1. Ir para Settings → Website
2. Configurar um slug do site (ex: `gelson-veiculos`)
3. Inserir domínio (ex: `gelsonveiculos.com.br`)
4. Clicar OK
5. Atualizar apontamento DNS do domínio para Vercel (dados fornecidos)

**Acessar site personalizado:**
- `gelsonveiculos.com.br` → renderiza PublicSiteHome diretamente (sem `/site/slug` na URL)
- Admin continua em `nleads.pro/dashboard`

**Remover domínio:**
1. Settings → Website
2. Clique no domínio registrado (botão lixeira)
3. Confirmar
4. Domínio removido do banco e da Vercel

---

## 📦 Resumo de Mudanças (Fases 1–3)

**New Files (2):**
- `api/health.ts` — Diagnóstico de env vars
- `src/pages/CustomDomainRedirect.tsx` — Renderiza site público em domínios personalizados

**Modified Files (5):**
- `api/register-custom-domain.ts` — Reescrito com handler único e fluxo linear (Haiku → Sonnet)
- `api/remove-custom-domain.ts` — Reescrito com handler único e logging granular (Haiku → Sonnet)
- `src/App.tsx` — Router condicional por domínio (`IS_SYSTEM_DOMAIN`)
- `src/pages/public/PublicSiteHome.tsx` — Aceita `forcedSlug` prop
- `src/components/settings/WebsiteSettings.tsx` — Parsing de response como texto + estados de loading
- `src/pages/SettingsPage.tsx` — Aba "Website" adicionada

---

🐛 **HOTFIX**: URLs amigáveis quebrando detalhe do veículo público (`Veículo não encontrado`)
**Date**: 2026-05-22
**Status**: ✅ CONCLUÍDO

---

## 📋 Plano
Sintoma: ao clicar num veículo no site público (ex.: `/site/gelsonveiculos/veiculo/ford-fiesta-1-6-flex-2013-15e7d4e3`), a página exibia "Veículo não encontrado".

Causa-raiz: a função `getVehicleBySlugPrefix` em `src/services/websiteService.ts` tentava buscar o veículo via:
```ts
.filter('id::text', 'ilike', `${idPrefix}%`)
```
PostgREST/Supabase JS **não aceita cast inline** (`id::text`) dentro de `.filter()` — a expressão é enviada literalmente como nome de coluna e a query falha silenciosamente. Mesmo sem o cast, `ilike` direto numa coluna `uuid` resulta em type mismatch no PostgreSQL.

Correção: trocar o filtro por uma **faixa lexicográfica** do UUID, que o tipo `uuid` compara nativamente:
- start = `${prefix}-0000-0000-0000-000000000000`
- end   = `${prefix}-ffff-ffff-ffff-ffffffffffff`
- query: `.gte('id', start).lte('id', end).eq('user_id', ownerId).limit(1)`

Validação adicional: regex `^[0-9a-f]{8}$` em `prefix.toLowerCase()` antes da consulta — abortando cedo se receber lixo (ex.: slug malformado).

## ⚠️ Riscos
- **Colisão de prefixo**: dois veículos do mesmo lojista com os primeiros 8 hex iguais retornam aleatório. Probabilidade ~1 em 4 bi por par; aceitável até as primeiras dezenas de milhares de veículos por lojista. Se virar preocupação, alongar o prefixo para 12 chars no `toVehicleSlug` (retrocompatível).
- **UUIDs em uppercase**: `idFromVehicleSlug` já normaliza minúsculas via regex `/i`, mas reforçamos com `.toLowerCase()` no service para defender contra entrada manipulada.
- **URLs antigas (UUID completo)**: continuam tratadas no ramo `getVehicleById` — não tocamos esse caminho.
- **Performance**: range em `id` (pk) usa index nativo do Postgres; equivalente a um `eq` em custo.

## 🌸 Haiku-check
Slug pede prefixo —
cast em filter não existe;
faixa de uuid responde.

---

# 🎨 **FASE**: Dashboard V1 — Redesign de Hierarquia e Tipografia

**Date**: 2026-06-04
**Status**: ✅ CONCLUÍDO
**Last Updated**: 2026-06-04
**Duration**: ~45min (implementação apenas)

## 📋 Escopo

Melhorar legibilidade, organização visual e navegação do Dashboard sem mudar lógica de negócio nem criar novas abas.

### ✅ Melhorias Implementadas

1. **Banner Motivacional** (NEW)
   - Citação do dia exibida no topo da área de conteúdo (abaixo dos filtros)
   - Card glass horizontal com aspas grandes + frase + autor
   - Renderização condicional se `quote.text` estiver preenchido

2. **Reorganização KPI Cards** (REORDER)
   - Ordem anterior: Leads | Vendas | Taxa Conv. | Receita | Estoque | Ticket
   - Nova ordem (funil de vendas): Vendas | Receita | Leads | Taxa Conv. | Estoque | Ticket
   - Reflete lógica comercial: resultado primeiro, depois demanda

3. **Tipografia & Cores** (STANDARDIZE)
   - `text-[10px]` → `text-xs` em ~18 ocorrências (labels, filtros)
   - Aumentado padding de filtros: `py-2` → `py-2.5`
   - Removidas opacidades desnecessárias em texto (ex: `text-amber-800/80` → `text-amber-800`)
   - Mantidas opacidades em backgrounds (ex: `bg-amber-400/10`)

4. **Alertas de Atenção** (ENHANCE)
   - Novo alerta para veículos parados (+60 dias) em cor rosa/vermelho
   - Ambos os alertas (leads parados + veículos parados) em `flex-col gap-3` se ambos existirem
   - Botões CTAs nos alertas com rotas diretas (`/leads`, `/inventory`)

5. **Layout Responsivo** (FIX)
   - Funil do Mês: grid `2x2` → `grid-cols-1 sm:grid-cols-2` (mobile-first)
   - "Vendas em Processamento" movido para **após** o Funil (posição mais lógica)
   - Aba Estoque: cards de processamento `grid-cols-3` → `grid-cols-1 sm:grid-cols-3`

6. **Aba Agenda** (IMPROVE)
   - Follow-Ups amanhã integrado ao card de Follow-Ups (antes era card separado gigante)
   - Projeção Amanhã reduzida de full-width para `lg:col-span-1` emparelhado

## ⚠️ Riscos

| Risco | Mitigação |
|---|---|
| Mudar ordem KPI confunde usuário acostumado | Ordem nova segue funil lógico; cosmética apenas |
| Banner de citação em tela vazia antes de carregar | Renderização condicional se `quote.text` preenchido |
| Dois alertas simultâneos ficar pesados | Flex-col com gap uniforme mantém visibilidade |

## 🌸 Haiku-check

```
Hierarquia clara —
fontes, cores, espaçamento;
leitura flui agora.
```

**Verdict**: ✅ Haiku **ADEQUADO** para esta feature

- Sem lógica nova: apenas reordenação de JSX e ajustes CSS/Tailwind
- Sem mudanças no useMemo (cálculos de métricas)
- Todos os componentes reutilizados (nenhum novo arquivo)
- Tipos existentes (nenhuma mudança em types.ts)

## ✅ Checklist de Verificação

- [x] Banner de citação renderizando no topo
- [x] KPIs em nova ordem (Vendas → Receita → Leads → Conv. → Estoque → Ticket)
- [x] Filtros com tamanho maior (`text-xs`, `py-2.5`)
- [x] Alertas para leads parados E veículos parados
- [x] Funil do Mês responsivo em mobile
- [x] "Vendas em Processamento" abaixo do Funil
- [x] Follow-Ups amanhã integrado ao card de hoje
- [x] Sem erros de TypeScript (Vite compila)
- [x] Sem lógica de negócio afetada

## 📊 Impacto

**Visual:**
- ✅ Melhor hierarquia: KPIs principais primeiro
- ✅ Tipografia consistente (labels em `text-xs`)
- ✅ Mobile responsivo (grids adaptam)
- ✅ Citação motivacional destacada

**UX:**
- ✅ Menos scroll na aba Agenda
- ✅ Alertas mais evidentes (2 cores diferentes)
- ✅ Navegação mais clara (CTAs nos alertas)

---

🎯 **FEATURE**: Painel Administrativo v2 — CRUDs, Dashboard e Integrações
**Date**: 2026-06-04
**Status**: 🔄 EM ANDAMENTO (Fase 1 → Fase 6)
**Target**: Completo até 2026-06-11
**Total Escopo**: ~3,500 LOC | 6 fases | ~40h de trabalho

---

## 📋 Plano Executivo

### Objetivo
Transformar `paineldoadm` de um painel básico (só gerencia usuários e tickets) em um **hub administrativo completo** com:
1. **Dashboard com KPIs** — métricas de negócio em tempo real
2. **CRUDs de dados** — gerenciar leads, veículos, vendas
3. **Auditorias** — logs de quem fez o quê
4. **Ações em massa** — editar múltiplos registros
5. **Permissões granulares** — diferentes níveis de admin
6. **Integrações** — analytics, webhooks, white-label

---

## 📐 Arquitetura do Painel

```
/paineldoadm (Admin Portal)
├── /                      → AdminDashboard (métricas)
├── /users                 → AdminUsers (CRUD)
├── /users/:id             → AdminUserDetails
├── /leads                 → AdminLeads (NEW — CRUD)
├── /vehicles              → AdminVehicles (NEW — CRUD)
├── /sales                 → AdminSales (NEW — pipeline + KPIs)
├── /settings              → AdminSettings (configs, perms, white-label)
├── /notifications         → AdminNotifications
├── /quotes                → AdminQuotes
├── /tickets               → AdminTickets
├── /plans                 → AdminPlans
├── /audit-log             → AdminAuditLog (NEW — logs de atividade)
└── /onboarding            → AdminOnboarding
```

---

## 🗂️ Fases de Implementação

### **FASE 1: Dashboard com KPIs** (Haiku/Sonnet)
**Status**: 🔄 EM ANDAMENTO
**Files**: 1 new, 1 modified
**LOC**: ~400

#### Objetivo
Exibir métricas consolidadas de toda plataforma (não apenas 1 usuário):
- Total de usuários (ativos, inativos, por plano)
- Total de leads (novo, qualificado, perdido)
- Total de vendas (últimos 30 dias, MRR)
- Total de veículos (em estoque, vendidos, parados)
- Tickets (abertos, resolvidos, tempo médio)

#### Arquivos
- **`src/admin/AdminDashboard.tsx`** — NOVO/REWRITE
  - Queries agregadas (SUM, COUNT, COUNT_DISTINCT) no Supabase
  - 8 cards KPI com trends (↑/↓)
  - Gráficos (últimos 12 meses de receita + vendas)

- **`src/admin/AdminLayout.tsx`** — MODIFICADO
  - Aba "Dashboard" no menu lateral

#### Queries Supabase (RPC Functions)
```sql
-- Métricas globais (todos os tenants)
CREATE OR REPLACE FUNCTION admin_get_platform_metrics()
RETURNS TABLE(
  total_users bigint,
  active_users bigint,
  pro_users bigint,
  total_leads bigint,
  qualified_leads bigint,
  total_sales bigint,
  mrr numeric,
  total_vehicles bigint,
  vehicles_in_stock bigint,
  open_tickets bigint
) LANGUAGE sql STABLE AS $$
  SELECT
    (SELECT COUNT(*) FROM profiles) as total_users,
    (SELECT COUNT(*) FROM profiles WHERE plan_status = 'active') as active_users,
    (SELECT COUNT(*) FROM profiles WHERE plan = 'pro') as pro_users,
    (SELECT COUNT(*) FROM leads) as total_leads,
    (SELECT COUNT(*) FROM leads WHERE status IN ('qualificado', 'em-contato')) as qualified_leads,
    (SELECT COUNT(*) FROM leads WHERE phase = 'Compradores') as total_sales,
    (SELECT COALESCE(SUM(CAST(price AS numeric)), 0) FROM leads l
     INNER JOIN profiles p ON l.user_id = p.id
     WHERE l.phase = 'Compradores' 
     AND l.created_at > NOW() - INTERVAL '30 days'
     AND p.plan = 'pro') as mrr,
    (SELECT COUNT(*) FROM vehicles) as total_vehicles,
    (SELECT COUNT(*) FROM vehicles WHERE sold_date IS NULL) as vehicles_in_stock,
    (SELECT COUNT(*) FROM support_tickets WHERE status IN ('open', 'in_progress')) as open_tickets;
$$;
```

---

### **FASE 2: CRUD de Leads no Admin** (Sonnet)
**Status**: 📋 PLANEJADO
**Files**: 1 new
**LOC**: ~600

#### Objetivo
Permitir admin filtrar, buscar, editar e deletar leads de qualquer usuário (útil para correção de dados, dups, lixo).

#### Arquivos
- **`src/admin/AdminLeads.tsx`** — NOVO
  - Tabela de leads com filtros: usuário, status, origem, período
  - Busca por nome/email/telefone
  - Ações: editar inline, deletar com confirmação
  - Bulk select + delete

#### Queries
```sql
-- Leads de todos os usuários (com dados do usuário/veículo)
SELECT l.*, p.full_name as user_name, v.brand, v.model
FROM leads l
INNER JOIN profiles p ON l.user_id = p.id
LEFT JOIN vehicles v ON l.vehicle_id = v.id
ORDER BY l.created_at DESC;
```

---

### **FASE 3: CRUD de Veículos no Admin** (Sonnet)
**Status**: 📋 PLANEJADO
**Files**: 1 new
**LOC**: ~600

#### Objetivo
Admin visualizar e gerenciar veículos de qualquer loja (vendidos, duplicados, inativos).

#### Arquivos
- **`src/admin/AdminVehicles.tsx`** — NOVO
  - Tabela com coluna usuário/loja
  - Filtros: marca, modelo, preço, situação (ativo/vendido/parado)
  - Ações: ver detalhes, deletar, desativar
  - Bulk delete

---

### **FASE 4: Visão de Vendas + Pipeline** (Sonnet)
**Status**: 📋 PLANEJADO
**Files**: 1 new
**LOC**: ~800

#### Objetivo
Admin ver todas as vendas da plataforma em tempo real, dashboard de conversão.

#### Arquivos
- **`src/admin/AdminSales.tsx`** — NOVO
  - Pipeline visual (cards em colunas por fase)
  - Filtros: período, usuário, origem
  - Cards com lead + veículo + valor
  - Stats: taxa conversão, ticket médio, tempo ciclo

---

### **FASE 5: Logs de Auditoria + Permissões** (Sonnet)
**Status**: 📋 PLANEJADO
**Files**: 3 new (schema + service + UI)
**LOC**: ~500

#### Objetivo
Rastrear todas as ações do admin (quem criou/editou/deletou o quê), e implementar níveis de permissão.

#### Mudanças Técnicas
**New Table: `admin_audit_logs`**
```sql
CREATE TABLE admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id),
  action TEXT, -- 'create', 'update', 'delete', 'export'
  resource_type TEXT, -- 'lead', 'vehicle', 'user', 'plan'
  resource_id TEXT,
  changes JSONB, -- {before: {...}, after: {...}}
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índice para busca rápida
CREATE INDEX idx_audit_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX idx_audit_created_at ON admin_audit_logs(created_at);
```

**New Enum: `admin_roles`**
```sql
CREATE TYPE admin_role AS ENUM ('super_admin', 'moderator', 'support', 'analyst');

-- Modificar profiles
ALTER TABLE profiles ADD COLUMN admin_role admin_role;
```

#### Arquivos
- **`src/admin/AdminAuditLog.tsx`** — NOVO
  - Tabela com filtros: admin, ação, tipo, período
  - Detalhes de mudança (before/after em JSON viewer)

- **`src/services/auditService.ts`** — NOVO
  - `logAction(adminId, action, resourceType, resourceId, changes)`
  - Chamado automaticamente em create/update/delete

- **`src/admin/AdminPermissions.tsx`** — NOVO (como componente em Settings)
  - Listar admins com seus roles
  - Atribuir permissões (checkboxes por ação)

---

### **FASE 6: Bulk Actions + Exportação** (Sonnet)
**Status**: 📋 PLANEJADO
**Files**: 2 new utilities
**LOC**: ~400

#### Objetivo
Permitir admin editar múltiplos leads/veículos de uma vez e exportar dados.

#### Arquivos
- **`src/components/admin/BulkActionsBar.tsx`** — NOVO
  - Selecionar múltiplos registros (checkboxes)
  - Ações: editar tag, alterar status, deletar, exportar
  - Progresso de execução

- **`src/utils/exportData.ts`** — NOVO
  - Exportar leads/veículos/vendas como CSV/Excel
  - Filtros preservados na exportação

---

## ⚠️ Riscos Globais

| Risco | Severidade | Mitigação |
|---|---|---|
| Query agregada com 100k+ registros lenta | ALTO | Índices estratégicos + caching em Redis + limite de período |
| Admin vê dados sensíveis (preços, contatos) | ALTO | RLS avançada: admin_audit_logs e admin_role controlados |
| Bulk delete acidental | MÉDIO | Confirmação dupla + soft-delete (flag `is_deleted` antes de hard-delete) |
| Audit logs crescerem indefinidamente | MÉDIO | Retenção de 90 dias com DELETE automático |
| Múltiplos admins concorrentes editando | BAIXO | Optimistic locking (field `updated_at` em cada tabela) |

---

## 🌸 Haiku-check

**Fase 1 (Dashboard)**: ✅ Haiku adequado
- Queries RPC simples (agregação)
- Cards de UI básicos
- Sem lógica de estado complexa

**Fases 2-3 (CRUDs)**: ⚠️ Sonnet recomendado
- Lógica de filtros combinados
- Bulk operations com transações
- Estado complexo de seleção

**Fase 4 (Pipeline)**: ❌ Sonnet obrigatório
- Visualização complexa (kanban-like)
- Síncrono com múltiplas fontes
- Filtros parametrizados

**Fase 5 (Audit)**: ✅ Haiku adequado
- CRUD simples de logs (append-only)
- Permissões são enums básicos

**Fase 6 (Bulk)**: ⚠️ Sonnet recomendado
- Transações multi-step
- Callbacks de progresso
- Tratamento de erro granular

---

## 🎯 Haiku-check Global

```
Admin, seu poder —
seis fases, dois mil linhas,
o reino consolida.
```

**Verdict**: **Usar Haiku para Fases 1 e 5, Sonnet para o resto.**

---

## ✅ Checklist Implementação

- [ ] **Fase 1:** Dashboard com KPIs — RPC + Cards
- [ ] **Fase 2:** AdminLeads CRUD + bulk delete
- [ ] **Fase 3:** AdminVehicles CRUD + filtros
- [ ] **Fase 4:** AdminSales pipeline + stats
- [ ] **Fase 5:** AuditLog + Permissões (roles)
- [ ] **Fase 6:** BulkActions + Exportação CSV/Excel
- [ ] **Testes:** E2E em cada fase
- [ ] **Produção:** Deploy com migrations SQL
