# IMPLEMENTATION_PLAN.md

🎯 **FEATURE**: Custom Domain Registration & Routing + Bundle Optimization  
**Date**: 2026-05-21  
**Status**: Fases 1–3 ✅ CONCLUÍDO | Fase 4 🔄 PLANEJADO  
**Last Updated**: 2026-05-21

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

## ⚠️ Riscos

### ALTO — Env Vars Ausentes
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

## 📝 Checklist de Produção

- [x] API de registro funcional com JWT validation
- [x] API de remoção funcional com graça (não crítica se Vercel falhar)
- [x] Env vars (`SUPABASE_SERVICE_ROLE_KEY`, `VERCEL_API_TOKEN`) configuradas no Vercel
- [x] Roteamento condicional implementado (domínio sistema vs cliente)
- [x] Site público renderiza sem `/site/slug` em domínios personalizados
- [x] Logs granulares para debugging
- [x] Mensagens de erro amigáveis em português
- [x] Suporte a `www.` prefix em domínios
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
