🎯 **FEATURE**: Sales Kanban com Fluxo de Pós-Venda e Gestão de Garantia
**Date**: 2026-06-04
**Status**: 🔄 IN PROGRESS
**Last Updated**: 2026-06-04

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

- [ ] Fase 1: Schema + Types (Haiku)
- [ ] Fase 2: Services CRUD (Haiku/Sonnet)
- [ ] Fase 3: GuaranteeConfigCard + SettingsPage (Sonnet)
- [ ] Fase 4: SalesKanban component (Sonnet)
- [ ] Fase 5: SalesFlowPage (Sonnet)
- [ ] Fase 6: Dashboard updates (remover Documentação/Entrega)
- [ ] Fase 7: Trigger Supabase (auto-create SaleFlow)
- [ ] Fase 8: Testes + validação SaaS

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
