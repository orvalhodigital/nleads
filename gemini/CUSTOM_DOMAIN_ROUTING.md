# Custom Domain Routing - Documentação Técnica

## Como Funciona

### Fluxo de Acesso por Domínio Personalizado

```
User accesses otimizza.com.br
         ↓
    Vercel receives request
         ↓
    vercel.json rewrites ALL requests to /index.html
         ↓
    React Router loads route "/"
         ↓
    CustomDomainRedirect component runs
         ↓
    Checks if hostname is a custom domain (not nleads.pro, not localhost)
         ↓
    Queries Supabase: SELECT website_slug FROM profiles WHERE custom_domain = 'otimizza.com.br'
         ↓
    Redirects to /site/{website_slug}
         ↓
    PublicSiteHome component loads and displays the website
```

### Fluxo de Acesso Direto por Slug

```
User accesses veiculos.nleads.pro/site/otimizza
         ↓
    React Router loads /site/otimizza route
         ↓
    PublicSiteHome component loads
         ↓
    Queries websiteService.getProfileBySlug('otimizza')
         ↓
    Displays the website
```

## Arquivos Envolvidos

| Arquivo | Responsabilidade |
|---------|------------------|
| `vercel.json` | Configuração de rewrite para SPA |
| `src/App.tsx` | Rotas do React Router |
| `src/pages/CustomDomainRedirect.tsx` | Detecta domínio custom e redireciona |
| `src/pages/public/PublicSiteHome.tsx` | Renderiza o site público |
| `api/register-custom-domain.ts` | API para registrar domínio no Vercel e Supabase |
| `api/remove-custom-domain.ts` | API para remover domínio |
| `api/test-domain-routing.ts` | API de teste para debugar problemas |

## Tabela de Banco de Dados

```sql
-- profiles table (columns relevantes)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS custom_domain VARCHAR(255) UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS custom_domain_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dns_records JSONB DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website_slug VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website_active BOOLEAN DEFAULT true;
```

## Debugando Problemas

### Problema: Domínio personalizado exibe o dashboard em vez do site

**Passos para debugar:**

1. **Verificar se o domínio foi registrado corretamente:**
   ```bash
   POST https://seu-app.vercel.app/api/test-domain-routing
   Body: { "testDomain": "otimizza.com.br" }
   ```
   Isso retornará:
   - Se o domínio foi encontrado no banco
   - Qual slug ele deveria redirecionar
   - Uma lista de todos os domínios registrados

2. **Verificar o console do navegador:**
   - Abra `F12` → `Console`
   - Procure por logs de `CustomDomainRedirect`
   - Veja se há erro na query do Supabase

3. **Verificar o status no Supabase:**
   ```sql
   SELECT id, full_name, website_slug, custom_domain, custom_domain_status
   FROM profiles
   WHERE custom_domain = 'otimizza.com.br';
   ```

4. **Testes comuns:**
   - O domínio está registrado no Vercel?
   - O `website_slug` está preenchido?
   - O `website_active` está como `true`?
   - O domínio foi registrado com a capitalização correta?

### Problema: "Domínio não está registrado no sistema"

**Causa:** A query no Supabase não encontrou o domínio.

**Soluções:**
1. Verifique o capitalization: o banco salva em lowercase? Confira `register-custom-domain.ts` linha 108.
2. Verifique se há espaços extras: `domain.trim()` é aplicado?
3. Teste a query diretamente no Supabase SQL Editor.

### Problema: Redireciona mas mostra "Slug do site não foi configurado"

**Causa:** O `website_slug` está NULL ou vazio.

**Solução:** Acesse o painel do usuário e defina o slug do website nas configurações.

### Problema: Site exibe mas carrega infinitamente

**Causa:** Possível erro na query do PublicSiteHome.

**Solução:**
1. Verifique se os dados estão sendo retornados corretamente
2. Procure por erros na query de vehicles no Supabase
3. Verifique permissões RLS (Row Level Security)

## Sequência Correta de Registração

1. Usuário preenche domínio na interface (ex: `otimizza.com.br`)
2. Frontend envia para `/api/register-custom-domain`
3. API valida o formato do domínio
4. API registra o domínio no Vercel (adiciona aos projetos)
5. API recebe os registros DNS recomendados do Vercel
6. API salva tudo no Supabase:
   - `custom_domain` = domínio normalizado (lowercase)
   - `custom_domain_status` = 'pending'
   - `dns_records` = JSON com registros DNS
7. Usuário aponta seu domínio para Vercel via DNS (A record: 216.198.79.1)
8. Depois que DNS propagar (até 24h), domínio passa a funcionar

## Configuração de DNS

O usuário precisa apontar seu domínio para Vercel. Registros necessários:

```
Type: A
Name: @ (ou raiz)
Value: 216.198.79.1
```

Se o domínio usa Vercel Nameservers (recomendado):
```
ns1.vercel-dns.com
ns2.vercel-dns.com
ns3.vercel-dns.com
```

## Logs Importantes

### CustomDomainRedirect
```javascript
console.log('CustomDomainRedirect: Checking hostname:', hostname);
console.log('CustomDomainRedirect:', { isLocalhost, isNleadsPro, isCustomDomain });
console.log('Checking custom domain in database:', hostname);
console.log('Redirecting to website:', profile.website_slug);
```

### API
```javascript
console.log(`[TEST-DOMAIN-ROUTING] Testing domain: ${testDomain}`);
console.log('[TEST] Query by custom_domain:', { profileByDomain, error: error1 });
console.log('[TEST] All registered domains:', { allDomains, error: error2 });
```

## Testes Recomendados

1. **Teste local com hosts file:**
   ```
   127.0.0.1 otimizza.localhost
   ```
   Acesse: `http://otimizza.localhost:3000`

2. **Teste em produção:**
   - Acesse `https://otimizza.com.br` (depois de DNS propagar)
   - Verifique console para logs de redirecionamento
   - Use `/api/test-domain-routing?testDomain=otimizza.com.br`

3. **Teste de slug direto:**
   - Acesse `https://veiculos.nleads.pro/site/otimizza`
   - Deve funcionar independente do domínio customizado

## Checklist de Resolução de Problemas

- [ ] Domínio registrado no Vercel? (verifique na interface do Vercel)
- [ ] Domínio salvo no Supabase `profiles.custom_domain`?
- [ ] `website_slug` preenchido no Supabase?
- [ ] `website_active` = true?
- [ ] DNS apontando para 216.198.79.1?
- [ ] DNS propagou? (teste em https://dnschecker.org)
- [ ] Console mostra logs de redirecionamento?
- [ ] `/api/test-domain-routing` retorna match correto?
- [ ] Limpar cache do navegador (Ctrl+Shift+Del)?
- [ ] Verificar RLS policies no Supabase (profiles table)?

## Endpoints de Teste

```bash
# Testar roteamento de domínio
curl -X POST https://seu-app.vercel.app/api/test-domain-routing \
  -H "Content-Type: application/json" \
  -d '{"testDomain": "otimizza.com.br"}'

# Verificar status do domínio no Vercel
curl -X POST https://seu-app.vercel.app/api/debug-vercel-domain \
  -H "Content-Type: application/json" \
  -d '{"domain": "otimizza.com.br"}'
```
