# IMPLEMENTATION_PLAN.md

🎯 **FEATURE**: Custom Domain Registration & Routing  
**Date**: 2026-05-21  
**Status**: ✅ CONCLUÍDO E FUNCIONANDO EM PRODUÇÃO  
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

#### `src/components/settings/WebsiteSettings.tsx`
- Input para registrar novo domínio
- Card exibindo domínio registrado
- Botão de remoção com confirmação
- Leitura de resposta como texto + JSON parse com fallback
- Loading states e toasts de sucesso/erro
- Erro parsing com mensagem detalhada

#### `src/pages/SettingsPage.tsx`
- Aba "Website" com ícone Globe
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

---

## ⚠️ Riscos

### ALTO — Env Vars Ausentes
- **Risco**: `VERCEL_API_TOKEN` ou `SUPABASE_SERVICE_ROLE_KEY` não configurados no Vercel
- **Sintoma**: Erro 500 ao registrar/remover domínio
- **Mitigação**: Usar `/api/health` para validar. Usar painel Vercel → Settings → Environment Variables

### ALTO — Conflito de Rota (resolvido)
- **Risco**: `path="/"` e `path="/*"` concorrendo, React Router escolhendo errado
- **Sintoma**: Domínio personalizado mostrando login em vez do site público
- **Solução**: Detectar domínio fora do componente, condicionar rotas inteiras no router (padrão Imóveis)

### MÉDIO — DNS Propagação
- **Risco**: Domínio registrado mas não resolvendo imediatamente
- **Mitigação**: UI mostra mensagem "DNS pode levar até 48h", usuário tenta depois

### MÉDIO — Domínio Não Encontrado
- **Risco**: Usuário acessa domínio personalizado antes de registrar
- **Mitigation**: `CustomDomainRedirect` mostra erro amigável "Domínio não está registrado"

### BAIXO — Bug de Escopo (resolvido ✅)
- **Causa anterior**: Haiku dividiu handler em 2 blocos try separados
- **Status**: Sonnet reescreveu com handler único + logging granular

---

## ✅ Haiku Check

**Verdict Final**: ❌ Haiku 4.5 **NÃO foi suficiente**

**O que funcionou:**
- Estrutura de API básica
- Validação de entrada

**O que falhou:**
1. **Bug de escopo crítico**: Dividiu handler em 2 blocos `try` separados
   - `verifiedUserId` declarado no 1º bloco, inacessível no 2º
   - Causava `ReferenceError` → 500 em produção
2. **Response body lido duas vezes**: `.json()` + `.text()` → "body stream already read"
3. **Estrutura complexa**: Funções de init separadas, sem fluxo linear claro

**Solução com Sonnet:**
- Handler único com try/catch global envolvendo tudo
- Fluxo linear sequencial: validação → autenticação → Vercel → banco
- Logging granular (STEP 1–6) para diagnóstico em produção
- Response lido uma vez (como texto), depois parseado

**Para Roteamento:**
- Haiku tenderia a usar componente envolvedor (RootGate)
- Sonnet usou padrão Imóveis: detectar no topo do App, condicionar rotas
- Mais limpo, evita overhead de contexto/provider, decisão em tempo de carregamento

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

## 📦 Resumo de Mudanças

**New Files (1):**
- `api/health.ts` — Diagnóstico de env vars

**Modified Files (4):**
- `api/register-custom-domain.ts` — Reescrito (Haiku → Sonnet)
- `api/remove-custom-domain.ts` — Reescrito (Haiku → Sonnet)
- `src/App.tsx` — Router condicional por domínio
- `src/pages/CustomDomainRedirect.tsx` — Renderiza site direto (sem navigate)
- `src/pages/public/PublicSiteHome.tsx` — Aceita `forcedSlug` prop

**Unchanged:**
- `src/pages/SettingsPage.tsx` — Já tinha Website tab
- `src/components/settings/WebsiteSettings.tsx` — Já tinha handlers
