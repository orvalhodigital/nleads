# Fase 9 — Estoque, Veículos, Motos & Site da Loja

> Executada em 2026-07-22. Do cadastro de veículo ao site público que o vende.

## 🔴 A34 — Site público vazava credenciais e PII de TODO lojista com site ativo (CRÍTICO)

`websiteService.getProfileBySlug` fazia `supabase.from('profiles').select('*')` com a **chave anônima**. A política `profiles_select_public_website` liberava, para `anon` **e** `authenticated`, o SELECT da **linha inteira** de qualquer perfil com `website_active = true`.

Como a chave anônima é pública (vai no bundle do front), qualquer pessoa podia chamar direto o PostgREST:

```
GET /rest/v1/profiles?website_active=eq.true&select=*
```

…e baixar, de **todos** os lojistas com site ativo:

| Campo exposto | Gravidade |
|---|---|
| `meta_access_token` | 🔴 credencial viva — acessa/gasta a conta de anúncios Meta do lojista |
| `google_ads_developer_token`, `google_ads_client_id` | 🔴 credenciais Google Ads |
| `asaas_customer_id`, `asaas_subscription_id`, `last_asaas_payment_id` | identificadores de cobrança |
| `email`, `phone` | PII do dono |
| `plan`, `plan_status`, `overdue_since`, `trial_ends_at` | estado comercial |
| `whatsapp_webhook_url`, `webhook_url` | endpoints internos |
| `role`, `parent_id` | estrutura interna do tenant |

O mesmo valia para **qualquer lojista logado** consultando outro lojista (a política também cobria `authenticated`) — concorrentes na mesma plataforma podiam extrair o token de anúncios um do outro.

### Correção (código pronto; falta aplicar o SQL)

- **View `store_public_profile`** — projeção de `profiles` com **whitelist** de 67 colunas de apresentação (sem nenhum segredo). Roda como dono (`security_invoker=false`), então não depende de o `anon` ter acesso à tabela base. Coluna nova só aparece se for adicionada de propósito (default-deny).
- **Função `is_store_website_active(uuid)` (SECURITY DEFINER)** — as políticas públicas de `vehicles`/`motorcycles` referenciavam `profiles` inline (dependiam do acesso do `anon` à tabela). Passam a checar o flag pela função, sem exigir esse acesso.
- **Política ampla removida** (`profiles_select_public_website`) e **`REVOKE SELECT ON profiles FROM anon`** — o `anon` deixa de tocar a tabela base.
- **App** (`getProfileBySlug`) passa a ler a view. Tem fallback transitório para a tabela caso a view ainda não exista (o site não sai do ar antes do SQL rodar; depois de aplicado, o fallback nunca é acionado).

**Aplicar:** `supabase/scripts/APLICAR-public-profile-view.sql`. Conferência esperada: `anon_select_profiles_removido=0`, `politica_ampla_removida=0`, `view_publica_existe=1`, `anon_pode_ler_view=1`, `funcao_site_ativo=1`, `view_expoe_segredo=0`, `esta_migracao_registrada=1`.

## 🟢 A35 — Mensagens de limite citavam planos aposentados (corrigido)
Os toasts de limite diziam "plano Free" / "upgrade para Pro" — nomes que saíram no rebrand. Agora: *"Limite de N … do seu plano atingido. Faça upgrade para o Ilimitado!"* (`DataContext.tsx`).

## 🟢 A36 — `createPublicLead` é código morto (remover na Fase 14)
`websiteService.createPublicLead` não tem nenhuma chamada. O site público envia leads pelos webhooks n8n (`webhook.orvalhodigital.com.br/...`), que voltam por `api/webhook-leads.ts` (service_role). O método antigo de insert direto ficou órfão. Não é bug — é limpeza.

## O que foi auditado e está correto

### ✅ Limites de plano — defesa em profundidade
O teto (10 veículos no trial/básico, 50 leads) é checado no **cliente** (`DataContext`) **e** por **trigger no banco** (Fase 3, A23). Mesmo um caminho que ignore o cliente (importação em massa) esbarra no trigger.

### ✅ Importação em massa — capada e resiliente
`InventoryImportModal.handleImportNew` insere via `vehicleService.create`, em loop com `try/catch` por item e contagem de sucesso/falha. Se o trigger recusa o 11º veículo, o item falha isolado e o usuário vê "N importados, M falhas" — sem tela branca nem burla do limite.

### ✅ Domínio customizado — sem sequestro
`api/register-custom-domain.ts` autentica por `getVerifiedUserId`, valida o formato do domínio, checa disponibilidade com `.neq('id', userId)` (não deixa tomar domínio de outro) e tem `rollbackVercel` se a gravação falhar.

### ✅ Leads do site — corretos por webhook (não por anon)
`leads` não tem política de INSERT para `anon` (correto). O site público não insere direto: posta nos webhooks n8n → `api/webhook-leads.ts` (service_role, que resolve o dono e grava `admin_id`/dedup — A33). A ausência de política anon não é falha; é o desenho certo.

## 🟡 Observações (não corrigidas nesta fase)

- **`plate` visível na listagem pública** (`mapRowToVehicle` expõe a placa). Alguns lojistas exibem, outros preferem ocultar. Não é credencial; fica registrado para decidir se vira opção de "ocultar placa no site".
- **Inventory.tsx × MotorcycleInventory.tsx** — duplicação grande (medida: 81 diferenças de função entre arquivos quase gêmeos). Refatoração fica para a **Fase 14**.

## Resumo

| Item | Situação |
|---|---|
| A34 — vazamento de credenciais/PII pelo site público | 🔴 → código corrigido, **pendente aplicar SQL** |
| A35 — mensagens de limite com plano aposentado | 🟢 corrigido |
| A36 — `createPublicLead` morto | 🟢 remover na Fase 14 |
| Limites de plano (cliente + trigger) | ✅ defesa em profundidade |
| Importação em massa | ✅ capada + por-item |
| Domínio customizado | ✅ sem sequestro |
| Leads do site (via webhook) | ✅ desenho correto |
| Placa na vitrine pública | 🟡 decisão de produto |
| Duplicação Inventory/Motorcycle | 🟡 Fase 14 |
