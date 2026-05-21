# IMPLEMENTATION_PLAN.md

🎯 **FEATURE**: Custom Domain Registration  
**Date**: 2026-05-21  
**Status**: ✅ CONCLUÍDO E FUNCIONANDO EM PRODUÇÃO  

---

## 📋 Plano

### APIs (Vercel Serverless Functions)
- [x] `api/register-custom-domain.ts` — Registrar domínio
  - Autenticação JWT via Bearer token
  - Validação de formato (regex)
  - Check de unicidade no Supabase
  - Registro na Vercel API
  - Rollback Vercel se save no banco falhar

- [x] `api/remove-custom-domain.ts` — Remover domínio
  - Autenticação JWT via Bearer token
  - Verificação de propriedade do domínio
  - Remoção da Vercel (não-crítico — tolera 404)
  - Remoção do banco (crítico)
  - **Logging granular por step (STEP 1–6) para diagnóstico**

- [x] `api/health.ts` — Verificar env vars (diagnóstico)
  - Retorna status de cada variável de ambiente

### Frontend
- [x] `src/components/settings/WebsiteSettings.tsx`
  - Lê resposta como texto primeiro, depois parseia JSON (evita "body stream already read")
  - Loading states, toasts de sucesso/erro
  - Confirmação antes de remover

- [x] `src/pages/SettingsPage.tsx`
  - Aba "Website" com ícone Globe

### Investigação Ativa
- [x] ✅ Causa raiz do erro 500 resolvida: **env vars ausentes no Vercel**
  - `SUPABASE_SERVICE_ROLE_KEY` → adicionada ✅
  - `VERCEL_API_TOKEN` → adicionada ✅
  - Redeploy feito → domínio removido com sucesso em produção ✅

---

## ⚠️ Riscos

### ALTO — Env Vars Faltando
- **Risco**: `VERCEL_API_TOKEN`, `VERCEL_PROJECT_ID`, `SUPABASE_SERVICE_ROLE_KEY` não configurados no projeto Vercel
- **Sintoma**: 500 imediato antes de qualquer lógica
- **Verificar**: acessar `/api/health` após deploy

### ALTO — RLS Supabase bloqueando service role
- **Risco**: Row Level Security impedindo update mesmo com service role key
- **Sintoma**: `profileError` no STEP 4 ou `updateError` no STEP 6
- **Mitigação**: usar `supabaseServiceKey` que bypassa RLS; verificar se a key é realmente service role

### MÉDIO — `req.body` undefined
- **Risco**: Vercel não parseia JSON automaticamente em alguns runtimes
- **Sintoma**: `domain` undefined, erro no STEP 3
- **Mitigação**: código já usa `req.body || {}` para evitar crash

### MÉDIO — Bug de escopo (resolvido)
- **Causa**: Haiku dividiu handler em 2 blocos try separados; `verifiedUserId` ficava inacessível no 2º bloco
- **Status**: ✅ Resolvido — handler reescrito com único try/catch

---

## ✅ Haiku Check

**Verdict**: ❌ Haiku 4.5 **NÃO foi suficiente** para esta tarefa

**Problemas introduzidos pelo Haiku:**
1. Bug de escopo crítico: dividiu handler em 2 blocos `try` separados, `verifiedUserId` inacessível no 2º bloco → ReferenceError → 500
2. Tentou ler `response.body` duas vezes (`.json()` + `.text()`) → "body stream already read"
3. Estrutura desnecessariamente complexa com funções de init separadas

**Solução com Sonnet:**
- Handler único com try/catch global
- Fluxo linear sequencial (STEP 1 → 6)
- Logging granular por etapa para diagnóstico
