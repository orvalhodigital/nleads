# Fase 2 — Configuração, Build & Segredos

> Executada em 2026-07-20. Linha de base herdada da Fase 1: 29 erros de TypeScript, build sem verificação de tipos, sem CI.

## Resultado

| Verificação | Antes | Depois |
|---|---|---|
| `npx tsc --noEmit` | ❌ 29 erros | ✅ **0 erros** |
| Build detecta erro de tipo | ❌ não | ✅ **sim** (`npm run build` roda `typecheck` antes) |
| `api/` verificada | ❌ nunca | ✅ incluída no `tsconfig` |
| `console.error` em produção | ❌ apagados | ✅ preservados |
| Cache do `index.html` | ❌ 1 hora | ✅ revalidação |
| `.env.example` completo | ❌ faltavam 2 | ✅ completo |

---

## 1. Bugs reais encontrados atrás dos erros de tipo

Os erros de tipo não eram ruído — cinco deles escondiam defeitos de comportamento.

### 🔴 Painel admin: métricas quebradas
`src/admin/AdminDashboard.tsx` chamava `.not.in('phase', [...])`, que **não existe** no supabase-js — `.not` é um método, não um objeto. Isso lançava `TypeError` ao montar o array do `Promise.all`, derrubando **todo o carregamento de métricas** do painel administrativo.

Corrigido para a forma válida `.not('phase', 'in', '("Novo Lead","Compradores","Desqualificados")')`, validada contra a API real (HTTP 200).

### 🔴 Onboarding não preenchia nome nem avatar
`OnboardingWizard` desestruturava `user` do `DataContext` — propriedade que **não existe** no contexto. Logo `user?.user_metadata?.full_name` e `?.avatar_url` eram sempre `undefined`, e os campos nunca vinham pré-preenchidos do cadastro. Corrigido para `session?.user`.

### 🔴 Tour do sistema escrito para uma versão anterior da biblioteca
`AppTour` usava a API v2 do `react-joyride`, mas a v3.1.0 está instalada. `callback`, `styles.options`, `disableBeacon`, `buttonNext` e `showSkipButton` foram **silenciosamente ignorados** — o tour rodava com cores erradas, sem botão de pular e sem marcar conclusão corretamente.

Migrado: `callback`→`onEvent`, `CallBackProps`→`EventData`, `disableBeacon`→`skipBeacon`, `buttonNext`→`buttonPrimary`, `styles.options`→prop `options` de topo, `showSkipButton`→`buttons: ['back','skip','primary']`. Cor primária alinhada ao roxo `#5B46E5`.

### 🟠 Venda podia ser aberta para um veículo inexistente
`Inventory.handleOpenSellModal` testava `if (selectedVehicle)`, mas o estado é `Vehicle | 'new' | null` — a string `'new'` passa no teste e não tem `.price`. Corrigido com a mesma guarda já usada em outro ponto do arquivo (`typeof === 'object'`).

### 🟡 Autocomplete desalinhado
`AutocompleteInput` lia `props.className`, mas `className` é desestruturado **fora** de `props` na assinatura — sempre `undefined`. O texto-fantasma nunca usava o padding correto.

---

## 2. Temas Glass e Premium removidos

Decisão registrada em [DECISOES-E-ROADMAP.md](../DECISOES-E-ROADMAP.md). `PublicSiteHome.tsx`: **1.336 → 1.089 linhas**.

Removidos: dois blocos de hero, dois blocos de estilo em `getTC()`, dois layouts de estoque, 16 condicionais inline, o arquivo morto `PublicSiteHomeClassic.tsx` (zero consumidores, passava prop inexistente) e uma condicional que retornava o mesmo valor nos dois ramos (`dark_mode ? '#0f172a' : '#0f172a'`).

`types.ts` foi alinhado ao schema Zod, que **já rejeitava** glass/premium — só o tipo e o renderizador estavam defasados.

**Risco verificado antes de apagar:** consulta ao banco confirmou **uma única loja cadastrada**, com tema `classic`. Nenhum registro legado seria afetado. Renderização confirmada pelo dono do projeto.

---

## 3. Duplicação eliminada

Três blocos idênticos de defaults de `LeadPreference` no `DataContext` — e **todos os três** esqueciam os mesmos campos obrigatórios (`observacoes_adicionais`, `possui_entrada`, `possui_troca`). Extraídos para [`src/lib/leadPreferenceDefaults.ts`](../../src/lib/leadPreferenceDefaults.ts).

Conversões `string → EngineType` espalhadas e forçadas com `as any`. Centralizadas em [`src/lib/engineType.ts`](../../src/lib/engineType.ts) com validação em runtime: valor desconhecido cai num fallback explícito em vez de ser mascarado por um cast mentiroso.

---

## 4. Configuração corrigida

### Portão de tipos
```json
"typecheck": "tsc --noEmit",
"build": "npm run typecheck && vite build",
"build:only": "vite build"
```
**Verificado na prática:** introduzi um erro de tipo proposital — o build falhou; removido, voltou a passar.

`api/` foi adicionada ao `include` do `tsconfig` (passa limpa; antes nunca era verificada).

### Cache
`vercel.json` aplicava `max-age=3600` a **todas** as rotas, inclusive o `index.html` — usuários ficavam até 1h na versão antiga após deploy. Agora:
- `/assets/*` → `max-age=31536000, immutable` (nomes têm hash, nunca mudam)
- demais rotas → `max-age=0, must-revalidate`

### Logs de produção
`vite.config.ts` usava `drop: ['console']`, apagando **154 `console.error` e 18 `console.warn`** do bundle — zerando o diagnóstico em produção. Agora usa `drop: ['debugger']` + `pure: ['console.log','console.debug','console.trace']`.
**Verificado no bundle:** `console.error` presente, `console.log` ausente.

### Variáveis de ambiente
`VERCEL_API_TOKEN` e `VERCEL_PROJECT_ID` eram usadas em `api/` mas **não estavam no `.env.example`** — um ambiente novo teria o cadastro de domínio customizado falhando sem explicação. Adicionadas, com o arquivo reorganizado por área e aviso sobre o prefixo `VITE_`.

**Nenhum segredo vaza para o cliente.** Confirmado: só `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` chegam ao bundle, ambas públicas por design.

---

## 5. Verificação em navegador

- App autenticado carrega completo (sidebar, busca, navegação) — console sem erros
- **Migração de `localStorage` testada de ponta a ponta:** simulei um usuário existente com `otimizza_theme='noite'`; após recarregar, a chave virou `orvalho_theme='noite'`, a antiga foi removida e **o tema escuro foi de fato aplicado**

---

## 🔴 Pendências para o dono do projeto

### Modo `strict` do TypeScript está desligado
É a razão de fundo pela qual os bugs acima passaram despercebidos. Custo medido:

| Configuração | Erros a corrigir |
|---|---|
| `strict` completo | 33 |
| só `noImplicitAny` | 22 |
| só `strictNullChecks` | 11 |

Recomendo `strictNullChecks` primeiro — é o que pega a classe de bug mais perigosa (acesso a `undefined` em runtime) pelo menor custo. Decisão de escopo: fica para uma fase própria.

### Três temas continuam inalcançáveis
`modern`, `bold` e `luxury` seguem no schema Zod e no renderizador, mas `WebsiteSettings.tsx:45` fixa `const website_theme = 'classic'` — **não existe seletor de tema na interface**. São ~200 linhas de código que nenhum lojista consegue ativar.

Não removi: diferente de glass/premium, o dono do projeto não os declarou abandonados, e são valores válidos no schema. Decidir na retomada do roadmap de múltiplos modelos.

---

# Adendo — 2026-07-20 (segunda rodada)

## `strictNullChecks` ativado

Os 11 erros foram corrigidos e a flag está permanente em `tsconfig.json`. **Verificado:** com a flag ligada, `const t: string = null` derruba o build.

Dois eram crash em produção, não apenas ruído de tipo:

- **Consulta de placa quebrava com campo vazio.** `VehicleForm.tsx:157` e `MotorcycleInventory.tsx:317` faziam `form.plate.replace(...)` sem checar `undefined`. A linha seguinte já tratava placa curta — só não chegava lá, porque `.replace` lançava `TypeError` antes. Corrigido com `(form.plate ?? '')`.
- **`initiateSaleFlow` podia receber `null`.** `LeadSaleModal.tsx` passava `buyerLeadId` possivelmente nulo para uma função que exige `string`. Agora só chama quando há id.

Os demais eram divergências de contrato: `changes` no `auditLogService` (`null` vs `undefined`), `admin_id` no `DataContext` (o `leadService.create` já converte para `null` na inserção — o `|| null` era redundante e conflitava com o tipo), `Plan.style.color` obrigatório enquanto todo o resto do objeto é opcional, e `x?.length > 0` no `LeadForm` (funcionava em runtime, mas o padrão correto é `(x?.length ?? 0) > 0`).

## Temas não usados removidos

Restava apenas `classic` em uso — `WebsiteSettings.tsx:45` o fixa no código e não há seletor na interface. Removidos `modern`, `bold` e `luxury`.

| Arquivo | Antes | Depois |
|---|---|---|
| `PublicSiteHome.tsx` | 1.089 | **881** |
| `PublicVehicleDetail.tsx` | 957 | **815** |

O tipo passou a ser `website_theme?: 'classic'` em `types.ts`, `websiteService.ts` e no schema Zod. As funções `getTC()` perderam o `switch` e o parâmetro `theme`. `PublicVehicleDetail` ainda tinha 5 cases mortos e 3 comparações com `'premium'` que escaparam da primeira limpeza.

Também corrigido: o rodapé do site público exibia **"POWERED BY OTIMIZZA"** — resquício de marca que passou pelo rebrand.

## 🟠 A15 — RLS bloqueia o site público para logados de outra loja

Descoberto ao tentar verificar a vitrine no navegador.

**Causa exata** (lida de `pg_policies`): as três políticas do site público estão restritas ao papel `anon`.

```sql
profiles_select_public_website               TO anon   USING (website_active = true)
"Public can read vehicles for active..."     TO anon   USING (EXISTS ... website_active = true)
"Public can read motorcycles for active..."  TO anon   USING (EXISTS ... website_active = true)
```

Quem está logado tem papel `authenticated`, não `anon` — nenhuma delas se aplica, e sobram apenas as políticas de dono (`profiles_select_own`, `vehicles_select_policy`).

**Impacto medido caso a caso:**

| Quem acessa | Funciona? | Por quê |
|---|:---:|---|
| Cliente final anônimo | ✅ | política `anon` se aplica — 31 veículos carregam |
| Lojista vendo o próprio site | ✅ | `auth.uid() = id` |
| Vendedor da mesma loja | ✅ | `parent_id = auth.uid()` / `id = get_my_parent_id()` |
| Admin do sistema | ✅ | `is_current_user_admin()` |
| **Logado de outra loja** | ❌ | nenhuma política cobre |

**O caminho comercial está intacto** — compradores de veículo não têm conta e entram como anônimos. O bug atinge quem está logado olhando a vitrine de outra loja: demonstração para prospect com sessão aberta, ou um lojista conferindo outro.

> Classificado como 🔴 na primeira anotação, **rebaixado para 🟠** depois da medição. O registro inicial foi feito sem medir o alcance.

**Correção proposta** (não aplicada — ver decisão abaixo):

```sql
ALTER POLICY "profiles_select_public_website"               ON public.profiles    TO anon, authenticated;
ALTER POLICY "Public can read vehicles for active websites"    ON public.vehicles    TO anon, authenticated;
ALTER POLICY "Public can read motorcycles for active websites" ON public.motorcycles TO anon, authenticated;
```

`ALTER POLICY ... TO` altera apenas os papéis; a condição `website_active = true` permanece. **Não amplia exposição:** o papel `anon` é a internet inteira, então essas linhas já são públicas — a mudança só deixa de penalizar quem está autenticado.

→ **Fase 3**, por decisão do dono do projeto (2026-07-20): entra como migração versionada em `supabase/migrations/`, junto com a auditoria completa de RLS. Aplicar manualmente agora agravaria o achado A2 (alterações de schema sem rastro).

## 🟡 A16 — `createPublicLead` é código morto que falharia se usado

`websiteService.createPublicLead` (linha ~242) insere em `leads` pelo cliente anônimo, mas **não tem nenhum chamador**. E não funcionaria: as quatro políticas de `leads` são `TO authenticated`, sem `INSERT` para `anon`.

O formulário de contato do site **não grava lead** — monta uma mensagem e abre o WhatsApp (`ContactSection.tsx:22`). Os leads do site entram pelos 4 webhooks n8n chamados em `PublicVehicleDetail.tsx` (`BOTAO-tenho-interesse`, `BOTAO-test-drive`, `BOTAO-simular-financiamento`, `BOTAO-troca`), que rodam no servidor e não passam por RLS.

**Nenhum lead está sendo perdido hoje.** Mas quem ligar essa função ao formulário no futuro terá falha silenciosa.

> Durante a investigação isto foi levantado como suspeita de perda de leads. A verificação descartou: os 3 leads com `source='Site'` no banco são dados fictícios — os nomes coincidem com a lista do `seed_ficticio.js`.

→ Remover ou corrigir na Fase 14.

## Verificação visual da vitrine

Com a sessão temporariamente removida (e restaurada em seguida), `/site/gelsonveiculos` renderizou completo: hero com imagem da loja, barra de busca, os 4 diferenciais, "Nosso Estoque" com 16 veículos, filtros por categoria, cards com preço/km/câmbio e rodapé. Nenhum erro no console.
