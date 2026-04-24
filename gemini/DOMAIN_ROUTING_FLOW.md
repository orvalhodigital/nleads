# Fluxo de Roteamento de Domínios Personalizados

## ✅ Solução Implementada

O problema foi que o `website_slug` (que identifica qual site do cliente deve ser mostrado) **não estava sendo enviado para a API** quando o domínio era registrado.

### Antes (❌ Errado)
```
User registra domínio "otimizza.com.br"
         ↓
Frontend envia apenas: { domain, userId }
         ↓
API salva no Supabase: custom_domain = "otimizza.com.br"
         ↓
Mas NÃO vincula ao slug correto!
         ↓
Quando acessa otimizza.com.br:
  - CustomDomainRedirect encontra o profile
  - MAS o website_slug está vazio ou indiferente
  - Redireciona para /site/vazio ou mostra dashboard
```

### Depois (✅ Correto)
```
User define slug: "otimizza"
User registra domínio: "otimizza.com.br"
         ↓
Frontend envia: { domain: "otimizza.com.br", websiteSlug: "otimizza", userId }
         ↓
API registra no Vercel + salva no Supabase
         ↓
Supabase guarda:
  - custom_domain = "otimizza.com.br"
  - website_slug = "otimizza"  ← AGORA VINCULADO!
         ↓
Quando acessa otimizza.com.br:
  - CustomDomainRedirect busca por custom_domain = "otimizza.com.br"
  - Encontra: { website_slug: "otimizza", website_active: true }
  - Redireciona para /site/otimizza
  - PublicSiteHome carrega o site correto!
```

## 📋 Checklist de Requisitos

### No Frontend (WebsitePage.tsx)
- [x] Campo de "Slug" definido (ex: "otimizza")
- [x] Validação do slug (mínimo 3 caracteres, disponibilidade)
- [x] Campo de "Domínio" (ex: "otimizza.com.br")
- [x] Botão "Salvar" - salva slug + tema + cores → `/website`
- [x] Botão "Registrar Domínio" - envia slug + domínio → `/api/register-custom-domain`
- [x] Validação de slug antes de permitir registrar domínio

### Na API (register-custom-domain.ts)
- [x] Recebe: `{ domain, websiteSlug, userId }`
- [x] Valida slug não está vazio
- [x] Registra domínio no Vercel
- [x] Salva no Supabase com ambos os campos:
  - `custom_domain`
  - `website_slug` (não sobrescreve se já existe)

### No Roteamento (CustomDomainRedirect.tsx)
- [x] Detecta domínio personalizado (não é nleads.pro, não é localhost)
- [x] Busca no Supabase por `custom_domain = hostname`
- [x] Valida `website_slug` está preenchido
- [x] Valida `website_active = true`
- [x] Redireciona para `/site/{website_slug}`
- [x] Mostra erro descriptivo se algo falhar

## 🔍 Como Testar

### Teste Local

1. Abra sua conta em `veiculos.nleads.pro` (login)
2. Vá para Settings → Website
3. Defina:
   - **Slug**: "meu-teste" (ex: otimizza)
   - **Tema e cores**: escolha o que preferir
   - Clique em "Salvar Website"

4. Ainda na mesma página, registre um domínio:
   - Clique em "Registrar Domínio Personalizado"
   - Digite seu domínio (ex: "meu-teste.com.br")
   - Clique em "Registrar"

5. **Verifique o console** (F12 → Console):
   ```
   Registering domain: { domain: "meu-teste.com.br", websiteSlug: "meu-teste", userId: "..." }
   Register response: { status: 200, ... }
   ```

6. **Teste a query de domínio**:
   ```bash
   curl -X POST https://seu-app.vercel.app/api/test-domain-routing \
     -H "Content-Type: application/json" \
     -d '{"testDomain": "meu-teste.com.br"}'
   ```

   Esperado:
   ```json
   {
     "results": {
       "exactMatch": {
         "id": "...",
         "website_slug": "meu-teste",
         "custom_domain": "meu-teste.com.br"
       }
     },
     "diagnostics": {
       "foundExactMatch": true,
       "expectedRedirect": "/site/meu-teste"
     }
   }
   ```

7. **Acesse o domínio**:
   - Localmente (teste com hosts file):
     ```
     127.0.0.1 meu-teste.localhost
     ```
     Acesse: `http://meu-teste.localhost:3000`
   
   - Produção (após DNS propagar): `https://meu-teste.com.br`

### Teste no Supabase SQL

```sql
-- Verificar domínio registrado
SELECT 
    id,
    full_name,
    website_slug,
    custom_domain,
    custom_domain_status,
    website_active
FROM profiles
WHERE custom_domain = 'otimizza.com.br';

-- Esperado: uma linha com:
-- - website_slug: "otimizza"
-- - custom_domain: "otimizza.com.br"
-- - website_active: true
```

## 🛠️ Troubleshooting

### Problema: "Defina um slug válido"
**Causa**: Campo de slug não foi preenchido ou tem menos de 3 caracteres.
**Solução**: 
1. Vá para "Website"
2. Preencha o campo "Slug"
3. Clique em "Salvar Website" primeiro
4. Depois registre o domínio

### Problema: "Slug está indisponível"
**Causa**: Outro usuário já está usando este slug.
**Solução**: Escolha outro slug disponível.

### Problema: API retorna erro
**Verificar**:
1. Slug foi definido? (query mostra `website_slug` preenchido?)
2. Domínio tem formato válido? (ex: sem http://, sem trailing slash)
3. Domínio não está registrado para outro usuário?

### Problema: Domínio registrado mas não redireciona
**Checklist**:
- [ ] Slug foi salvo no Supabase? (`website_slug` não é NULL)
- [ ] Custom domain foi salvo? (`custom_domain` não é NULL)
- [ ] DNS propagou? (teste em https://dnschecker.org)
- [ ] Console mostra logs de CustomDomainRedirect?
- [ ] Limpar cache (Ctrl+Shift+Del)

## 📁 Arquivos Alterados

1. **src/pages/WebsitePage.tsx**
   - `handleRegisterDomain()`: Agora valida slug antes de registrar
   - Envia `websiteSlug` para a API
   - Chama `refreshProfile()` após sucesso

2. **api/register-custom-domain.ts**
   - Agora requer `websiteSlug` no request
   - Valida se websiteSlug está presente
   - Salva sem sobrescrever slug existente

3. **src/pages/CustomDomainRedirect.tsx**
   - Melhor logging para debug
   - Melhor tratamento de erros
   - Valida se website está ativo
   - Mostra mensagem de erro descriptiva

4. **vercel.json**
   - Adicionado cache headers para performance

5. **CUSTOM_DOMAIN_ROUTING.md**
   - Documentação completa do sistema

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        REGISTRATION FLOW                         │
└─────────────────────────────────────────────────────────────────┘

USER INTERFACE (WebsitePage.tsx)
  │
  ├─ Input: Slug = "otimizza"
  ├─ Input: Domain = "otimizza.com.br"
  └─ Click: "Registrar Domínio"
       │
       ├─ Validate slug (≥3 chars, not taken)
       ├─ Validate domain (valid format)
       └─ POST /api/register-custom-domain
            │
            ├─ { domain, websiteSlug, userId }
            │
            API HANDLER
            │
            ├─ Validate websiteSlug is present
            ├─ Call Vercel API: POST /domains
            │   └─ Add domain to project
            │
            ├─ Update Supabase profiles:
            │   ├─ custom_domain = "otimizza.com.br"
            │   ├─ custom_domain_status = "pending"
            │   ├─ dns_records = [...]
            │   └─ website_slug = "otimizza" (unchanged)
            │
            └─ Return success + DNS records
                 │
                 Frontend shows DNS instructions


┌─────────────────────────────────────────────────────────────────┐
│                        ACCESS FLOW                               │
└─────────────────────────────────────────────────────────────────┘

USER BROWSER
  │
  └─ Accesses: https://otimizza.com.br
       │
       Vercel (vercel.json)
       │
       └─ Rewrite to /index.html
            │
            React Router
            │
            └─ Route "/" matches
                 │
                 CustomDomainRedirect component
                 │
                 ├─ Get hostname: "otimizza.com.br"
                 ├─ Check if custom domain (✓ not nleads.pro)
                 │
                 └─ Query Supabase:
                    │
                    ├─ SELECT website_slug
                    └─ FROM profiles
                       WHERE custom_domain = "otimizza.com.br"
                            │
                            Result:
                            ├─ website_slug: "otimizza"
                            └─ website_active: true
                                 │
                                 ├─ Validate website_active = true ✓
                                 ├─ Validate website_slug present ✓
                                 │
                                 └─ navigate("/site/otimizza")
                                      │
                                      PublicSiteHome component
                                      │
                                      ├─ Load vehicles for slug "otimizza"
                                      ├─ Apply saved theme, colors, hero image
                                      │
                                      └─ Display website ✓
```

## ✨ Resumo das Mudanças

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **Slug no Register** | ❌ Não enviado | ✅ Validado e enviado |
| **Vinculação** | ❌ Domínio solto | ✅ Domínio → Slug |
| **Redirecionamento** | ❌ Para dashboard | ✅ Para site correto |
| **Validação** | ❌ Mínima | ✅ Rigorosa (slug obrigatório) |
| **Logging** | ⚠️ Básico | ✅ Detalhado para debug |
| **Tratamento de erro** | ❌ Sem feedback | ✅ Mensagens claras |
