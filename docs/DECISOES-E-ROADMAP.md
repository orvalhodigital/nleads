# Decisões e Roadmap

> **Fonte de verdade sobre o rumo do produto.**
> O que existe, o que virá, o que foi abandonado — e o porquê de cada coisa.
>
> Toda IA e todo dev deve ler antes de mexer em funcionalidade.
> Toda decisão de produto deve ser registrada aqui **no mesmo commit** em que é tomada. Ver [CLAUDE.md](../CLAUDE.md) §7.

---

## Como usar este documento

- **Decisões tomadas** — o registro histórico. Não reescreva o passado; adicione entradas novas.
- **Roadmap** — o que está planejado mas ainda não existe.
- **Fora de escopo** — o que foi deliberadamente descartado, para ninguém reabrir por engano.

Encontrou código que não bate com nada aqui? **Não adivinhe.** Pergunte ao dono do projeto e registre a resposta.

---

## 🚀 Checklist de comercialização

Itens conscientemente adiados que **precisam estar resolvidos antes do primeiro cliente pagante**. Cada um tem a decisão que o adiou registrada abaixo.

- [x] **Rodar `APLICAR-public-profile-view.sql`** (migração 22, achado A34) — ✅ aplicado e verificado em 2026-07-22; o vazamento de `meta_access_token`/tokens/PII pelo site público está fechado no banco.
- [x] **Rodar `APLICAR-notifications-insert.sql`** (migração `20260722020000`, achados A37/A38) — ✅ aplicado e verificado em 2026-07-22; anon não insere mais notificação falsa nem forja log de auditoria.
- [x] **Rodar `APLICAR-secdef-hardening.sql`** (migração `20260722030000`, achados A40/A41) — ✅ aplicado e verificado em 2026-07-22; search_path fixo nas 5 funções e anon sem EXECUTE em `admin_update_user_plan`.
- [x] **Rodar `APLICAR-support-attachments-private.sql`** (migração `20260722040000`, achado A43) — ✅ aplicado e verificado em 2026-07-22; bucket de anexos de suporte agora é privado (leitura só autenticado via URL assinada).
- [x] **Rodar `APLICAR-profiles-cpf-cnpj.sql`** (migração `20260722050000`, achado A48) — ✅ aplicado e verificado em 2026-07-22; coluna `profiles.cpf_cnpj` criada. Falta só o teste end-to-end do checkout (abaixo).
- [x] **Upgrade Asaas: chave service_role da Vercel** (achado A48a) — ✅ dono atualizou a `SUPABASE_SERVICE_ROLE_KEY` na Vercel (estava desatualizada → "Profile not found"). Depois disso o fluxo avançou até a criação do cliente.
- [ ] **🔴 Fechar os erros restantes do fluxo de pagamento Asaas** (A48) — **adiado pelo dono em 2026-07-22 para depois das auditorias.** As 3 camadas de config foram corrigidas (service_role, CPF/CNPJ, ambiente da chave) e o endpoint agora mostra o erro real, mas o checkout ainda não completa 100% no teste. Retomar depois da auditoria, com a mensagem de erro real em mãos.
- [ ] **🔴 Trocar a chave do Asaas por uma de PRODUÇÃO antes do lançamento** (A48c) — hoje a `ASAAS_API_KEY` (na Vercel e no `.env.local`) é uma chave de **sandbox** (`$aact_hmlg_…`), então nenhuma cobrança é real. O código deriva a URL da chave automaticamente: ao colocar a chave de produção (`$aact_prod_…`), ele passa a usar `api.asaas.com` sozinho. Também revisar o webhook do Asaas apontando para o endpoint de produção.
- [ ] **Remover a coluna `plans.stripe_url`** (migração) — resquício do Stripe; já removida do código (A47). Cleanup de banco.
- [ ] **Rotacionar credenciais** — `SUPABASE_ACESS_TOKEN` exposto em texto plano (achado A22). Ver decisão de 2026-07-20. **🔴 Rotacionar também `meta_access_token` (e tokens Google Ads) dos lojistas que já tinham site ativo** — esses tokens estiveram expostos publicamente antes do fix do A34; trocá-los é o único jeito de garantir que ninguém que os copiou ainda os use.
- [x] **Rodar `APLICAR-dedup-ticket-policies.sql`** (migração `20260722060000`, achado A44) — ✅ aplicado e verificado no Supabase em 2026-07-23; políticas RLS duplicadas de tickets removidas.
- [ ] **Revisar documentos legais com apoio jurídico** — o nome da plataforma foi trocado nos contratos durante o rebrand.
- [ ] **Definir Otimizza × Orvalho nos ativos de marca** — resolvido no código; sobra limpar `profiles.logo_url` no banco.
- [ ] **Renomear fluxos no n8n** e atualizar as URLs no código.
- [ ] **Elevar a senha mínima do Supabase Auth para 8** (hoje 6; painel Authentication → Policies) — achado da Fase 4.
- [ ] **Validação e rate-limiting no n8n** para os webhooks chamados de páginas públicas (achado A8) — evita spam de WhatsApp disparado por bots.
- [ ] **Definir bloqueio de assinatura em atraso** (`plan_status=overdue`): hoje há período de graça sem bloqueio; decidir se/quando corta acesso (refinamento do A31).
- [ ] **Rate-limit de IA por usuário** (achado A30): endpoints de IA sem teto; risco baixo hoje, mas necessário para escala.
- [ ] **Cobertura de testes e CI** (achados A6/A7, fases 15 e 18).

---

## Decisões tomadas

### 2026-07-23 — Divisão do DataContext (A4) e Desduplicação de Estoque (A5)

**Decisão:** O `DataContext` (God Context) foi fatiado em 3 contextos de domínio isolados e memoizados: `AuthContext`, `InventoryContext` e `LeadContext`. O `DataContext` original foi preservado atuando estritamente como fachada agregadora de retrocompatibilidade para o método `loadData()`.

**Componentes Extraídos (A5):**
- `src/components/inventory/SellVehicleModal.tsx`: modal unificado para venda avulsa e venda por lead para carros e motos.
- `src/components/inventory/LeadInterestModal.tsx`: modal unificado de recomendação/oferta ao lead via WhatsApp, mantendo o encadeamento de `lead_communications` + webhook n8n.
- `src/components/inventory/InventoryHeader.tsx`: componente de cabeçalho responsivo e reutilizável para listagem de carros e motos.

**Por quê:** Elimina a re-renderização em cascata gerada pelo God Context em 32 telas e reduz a duplicação de lógica entre gestão de estoque de veículos e motocicletas.

---

### 2026-07-22 — Tema padrão é Dia; Noite completado como opt-in (A45)

**Decisão:** o tema padrão do app é **Dia** (claro). O **Noite** (escuro) continua disponível, mas só quando o usuário ativa no toggle.

**Contexto:** o modo Noite existia (toggle + `.dark`) mas só ~16% das telas o suportavam — as outras usam cor fixa (`bg-white`, `text-slate-900`) em vez de token semântico. Pior: o padrão seguia o `prefers-color-scheme` do SO, então quem tem o SO no escuro caía numa UI quebrada sem escolher (achado A45, Fase 13).

**O que mudou no código:**
- `ThemeContext`: o padrão (sem preferência salva) passou de "seguir o SO" para **sempre `dia`**. Preferência salva pelo usuário é respeitada.
- **Camada de compatibilidade de tema** no `src/index.css`: como toda cor da paleta vira `var(--color-*)` no Tailwind v4, as utilitárias neutras comuns (`bg-white`, `bg-slate-50/100/200`, `text-slate-500..900`, bordas) são remapeadas sob `.dark`, distinguindo papel (fundo vs texto) — então o Noite funciona nas ~84% de telas que usavam cor fixa, sem editar 117 arquivos. `text-white` (botões) segue branco.

**Por quê:** com o padrão em Dia, ninguém é jogado no Noite sem querer; e o Noite, agora funcional, fica como opção. Menor risco para o lançamento.

**Fix de longo prazo:** migrar os componentes para **tokens semânticos** (`bg-background`, `text-foreground`, `bg-card`…) conforme `DESIGN_GUIDELINES.md`, aposentando a camada de compatibilidade. Fica no roadmap.

---

### 2026-07-20 — Rotação de credenciais adiada para a comercialização

**Decisão:** manter as credenciais atuais, incluindo o `SUPABASE_ACESS_TOKEN` exposto (achado A22), e rotacionar tudo apenas quando o sistema for comercializado.

**Contexto:** durante a execução do teste de segurança da Fase 3 por uma ferramenta externa, o token foi colado em texto plano num comando de shell. Ele ficou registrado no log da ferramenta em disco, no histórico do PowerShell e no transcript da conversa.

**O que esse token permite:** é um token da API de **gestão** do Supabase — controle total do projeto. Lê e escreve qualquer tabela ignorando o RLS, altera políticas, lê segredos do projeto e pode apagar o banco. É mais poderoso que a `service_role`.

**Por quê adiar:** o sistema ainda não tem clientes pagantes, e o risco prático depende de acesso à máquina do dono ou de compartilhamento dos logs.

**Risco aceito:** se a máquina for comprometida, se logs forem enviados a terceiros (suporte, depuração) ou se houver compartilhamento de tela com o histórico do shell visível, o token vaza — e com ele, todo o banco.

**Quando resolver:** antes do primeiro cliente pagante. Ver checklist acima.

**Regra que vale desde já:** nenhuma ferramenta deve receber segredo por linha de comando. Ler sempre do `.env.local` em tempo de execução, sem imprimir o valor.

---

### 2026-07-18 — Temas de site: apenas um modelo, por enquanto

**Decisão:** manter **um único** modelo de layout para o site público do lojista.

**Contexto:** os temas `glass` e `premium` chegaram a ser iniciados em `src/pages/public/PublicSiteHome.tsx`, mas o desenvolvimento foi interrompido. O tipo de tema hoje aceita apenas `'bold' | 'modern' | 'luxury'`, enquanto o código ainda tinha 6 comparações contra `'glass'` e `'premium'` — ramos de renderização que **nunca executavam**. O TypeScript sinalizava isso (`TS2367`), mas os erros passavam despercebidos porque o build não checa tipos.

**Por quê:** foco. Um modelo bem acabado vale mais que três pela metade antes da comercialização.

**O que acontece com o código:** os ramos mortos de `glass`/`premium` são **removidos** na Fase 2 da auditoria. Não ficam comentados nem inativos — o histórico do Git preserva a implementação parcial, e código morto no repositório confunde as próximas IAs.

**Volta no futuro?** **Sim.** Ver *Roadmap → Múltiplos modelos de site*.

---

### 2026-07-18 — Auditoria em 20 fases antes da comercialização

**Decisão:** submeter o sistema a uma auditoria completa, fase por fase, antes de colocar à venda.

**Por quê:** o sistema vai passar a ter clientes pagantes. Falha de isolamento entre tenants, cobrança errada ou perda de dado deixam de ser bug e viram problema contratual.

**Onde acompanhar:** `docs/AUDITORIA/`, um relatório por fase.

---

### 2026-07-18 — Skills de engenharia versionadas no repositório

**Decisão:** versionar `.claude/skills/` no Git.

**Contexto:** foram instaladas 333 skills de engenharia de software do pacote [skill-harness](https://github.com/45ck/skill-harness) (MIT, de terceiro). São arquivos Markdown de instrução — playbooks de arquitetura, segurança, testes, revisão e qualidade.

**Por quê:** a auditoria depende delas. Se ficarem só numa máquina, o trabalho não é reprodutível por outro dev ou outra sessão.

**Restrição de segurança:** a instalação foi feita **repo-local e somente com Markdown**. O instalador oficial do skill-harness foi deliberadamente **não** executado, porque ele escreve em diretórios globais (`~/.claude`, `~/.agents`), instala pacotes npm e baixa o Beads via `irm | iex`. Nada disso foi feito.

**Regra permanente:** nenhuma ferramenta de terceiro entra neste projeto executando script remoto ou escrevendo fora do repositório. Se for preciso, copia-se o conteúdo inspecionado, manualmente.

---

### 2026-07-20 — Correção de RLS do site público entra como migração versionada

**Decisão:** o achado A15 (políticas do site público restritas ao papel `anon`, quebrando a vitrine para usuários logados de outra loja) **não** será corrigido por alteração manual no banco. Entra na Fase 3, como migração versionada em `supabase/migrations/`.

**Por quê:** o bug não bloqueia o caminho comercial — compradores de veículo acessam anonimamente e a vitrine funciona. Corrigir manualmente agora agravaria o achado A2 (schema alterado por scripts avulsos, sem rastro reproduzível). A correção fica junto da auditoria completa de RLS, com verificação de isolamento antes e depois.

**SQL definido, aguardando a Fase 3:**

```sql
ALTER POLICY "profiles_select_public_website"                  ON public.profiles    TO anon, authenticated;
ALTER POLICY "Public can read vehicles for active websites"    ON public.vehicles    TO anon, authenticated;
ALTER POLICY "Public can read motorcycles for active websites" ON public.motorcycles TO anon, authenticated;
```

Não amplia exposição de dados: `anon` já é a internet inteira, e a condição `website_active = true` permanece intacta.

**Regra que fica:** nenhuma alteração de política RLS é aplicada manualmente neste projeto. Toda mudança no schema ou na segurança do banco passa por migração versionada.

---

### 2026-07-20 — Rebrand: Orvalho é o padrão; o produto chama-se Gestor de Pátio

**Decisão:** eliminar as marcas `Otimizza` e `nLeads`.

| Papel | Nome |
|---|---|
| Empresa / marca | **Orvalho Digital** (razão social: Orvalho Digital Tecnologia Ltda) |
| Produto (vertical de veículos) | **Gestor de Pátio** |
| Cor primária | Roxo `#5B46E5` |
| Domínio | `orvalhodigital.com.br` / `painel.orvalhodigital.com.br` |

**Regra para quem vier depois:** nomes de **plataforma/produto** na interface usam *Gestor de Pátio*; referências à **empresa** (rodapé, suporte, jurídico, logo) usam *Orvalho Digital*.

#### 🔴 Bug corrigido junto: o domínio Orvalho estava bloqueado no backend

As 10 funções em `api/` tinham `ALLOWED_ORIGINS` apenas com `nleads.pro` / `nleads.com.br`, enquanto o frontend já aceitava `orvalhodigital.com.br`. Como o código faz fallback silencioso (`ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]`), qualquer acesso pelo domínio Orvalho recebia `Access-Control-Allow-Origin` divergente e **era bloqueado pelo navegador** — derrubando cobrança Asaas, portal de faturas, consulta de placa, os 3 recursos de IA, domínios customizados e webhooks.

A migração para Orvalho havia sido feita no frontend e nunca chegou ao backend.

#### O que **não** foi renomeado, de propósito

Renomear qualquer um destes quebra o sistema:

- **`webhook/nLeads-veiculos-criar-instancia`** e **`webhook/nleads-veiculos-verifica-conexao-whatsapp`** — caminhos reais de endpoints n8n em produção. Só podem mudar quando os fluxos forem renomeados no próprio n8n.
- **Guardas de legado em `src/components/OrvalhoLogo.tsx`** — os testes `otimizza-logo` / `nleads-logo` detectam logos antigas ainda salvas em `profiles.logo_url`. Removê-los faria o sistema exibir a marca antiga.
- **Chaves legadas de `localStorage`** (`otimizza_theme`, `otimizza_tour_completed`, `otimizza_ficha_diagnostico`) — lidas uma última vez por `readMigrated()` em `src/lib/storage.ts`, que promove o valor para o prefixo `orvalho_` e apaga o antigo. Sem isso, todo usuário existente perderia o tema salvo e refaria o tour. O parâmetro legado pode ser removido quando os usuários ativos já tiverem passado pelo sistema.
- **`attentionLeads`** — variável do dashboard que contém a substring "nLeads". Busca-e-substitui cega a corromperia.

#### Removidos

`src/components/OtimizzaBrandLogo.tsx` e `src/hooks/useBrandTheme.ts` — ambos com zero importações, resíduo da identidade amarela.

#### Links atualizados para o domínio Orvalho

Os botões "Ir para o Gestor de Pátio" apontavam para `https://otimizzacrm.com.br` e passaram a apontar para `https://painel.orvalhodigital.com.br`, alinhados com o `RootGate`:

- `src/pages/CustomDomainRedirect.tsx`
- `src/pages/CustomDomainVehicleDetail.tsx`
- `src/pages/public/PublicSiteHome.tsx`

Nenhuma referência a `otimizzacrm` restou em `src/` ou `api/`.

#### 🔴 Pendências

- Renomear os fluxos no **n8n** e depois atualizar as URLs em `src/components/Header.tsx` e `src/components/settings/WhatsAppSettings.tsx`.
- Limpar `profiles.logo_url` no banco para registros apontando a logos antigas — só então os guardas de legado em `OrvalhoLogo.tsx` poderão sair.
- Confirmar que `orvalhodigital.com.br`, `www.orvalhodigital.com.br` e `painel.orvalhodigital.com.br` estão configurados na Vercel, já que os domínios `nleads.*` foram removidos do CORS.
- Revisar com apoio jurídico a troca do nome da plataforma nos documentos legais (`LegalContractPage`, `LegalTermsPage`, `LegalPrivacyPage`). A razão social não foi alterada.

---

### 2026-07-18 — Landing pages removidas do projeto

**Decisão:** excluir as duas implementações de landing page. O projeto não contém mais nenhuma.

**Contexto:** existiam duas cópias do mesmo design — `Landing/` na raiz (junho, paleta `emerald-*`, com um `index.html` estático) e `src/pages/Landing/` (julho, já migrada para tokens `brand-*`). **Nenhuma das duas estava conectada:** não havia rota apontando para elas e `LandingPage` não era importado em lugar nenhum. Foram construídas e nunca ligadas ao sistema.

**Por quê:** código morto no repositório confunde devs e IAs, e o dono do projeto desconhecia sua existência — sinal claro de que não faziam parte do produto.

**Como recuperar, se um dia quiser retomar:** o design está preservado no histórico do Git, no commit `d61f328`.

```sh
# ver os arquivos
git show d61f328 --stat -- Landing src/pages/Landing

# restaurar a versão boa (a de julho, com tokens semânticos)
git checkout d61f328 -- src/pages/Landing

# restaurar o mockup HTML estático
git checkout d61f328 -- Landing/index.html
```

**Ao retomar:** use `src/pages/Landing/`, não a da raiz — ela é a versão com as cores já migradas para os tokens do sistema. E lembre de **criar a rota**, que era justamente o que faltava.

---

### 2026-07-18 — Documentação de design consolidada de 6 para 2

**Decisão:** manter apenas [DESIGN_GUIDELINES.md](DESIGN_GUIDELINES.md) (interface) e [BRANDING.md](BRANDING.md) (marca).

**Removidos:** `BRANDING.md` (raiz), `BRANDING_GUIDE.md`, `BRANDING_USAGE_GUIDE.md`, `LOGO_DEPLOYMENT.md`, `src/LAYOUT_GUIDE.md`. O conteúdo útil foi absorvido; o histórico do Git preserva os originais.

**Por quê:** os seis documentos se contradiziam. `.agents/AGENTS.md` mandava usar a fonte **Outfit** e descrevia a cor primária como lavanda, enquanto `DESIGN_GUIDELINES.md` — o único alinhado com o código — especifica Bricolage Grotesque + Inter e roxo `#5B46E5`. `BRANDING_USAGE_GUIDE.md` documentava componentes com zero uso real. `LOGO_DEPLOYMENT.md` era um relatório de status pontual, não um guia.

**Também feito:** `.agents/AGENTS.md` virou ponteiro para o documento canônico; a especificação do `PageContainer` foi absorvida em `DESIGN_GUIDELINES.md` §8.

---

### 2026-07-18 — Script de deploy de terceiro removido

**Decisão:** remover `.kilo/skills/` do repositório e do disco, e bloquear `.kilo/skills/` no `.gitignore`.

**Por quê:** `deploy.sh` compactava todo o diretório do projeto excluindo apenas `node_modules` e `.git` — **incluindo `.env.local`** — e enviava por POST para `claude-skills-deploy.vercel.com`. Rodá-lo teria exposto `SUPABASE_SERVICE_ROLE_KEY`, `ASAAS_API_KEY`, `OPENAI_API_KEY` e `VERCEL_API_TOKEN`.

**Confirmado com o dono do projeto:** o script **nunca foi executado**. Nenhuma rotação de credencial foi necessária.

---

### 2026-07-18 — Backups locais fora do Git

**Decisão:** `_backup_*/` e `scratch/` saíram do controle de versão (permanecem no disco) e entraram no `.gitignore`.

**Por quê:** eram cópias divergentes do código atual. O risco concreto é uma IA ou dev buscar um arquivo, encontrar duas versões e editar a obsoleta — a correção não chega a lugar nenhum. O Git já é o backup.

---

## Roadmap

### Múltiplos modelos de site para o lojista
**Status:** planejado, sem data.
Oferecer ao lojista opções de layout para o site público, em vez de um modelo único. `glass` e `premium` foram as primeiras tentativas (ver decisão de 2026-07-18).

**Ao retomar, atentar para:**
- o tema é escolhido por lojista e persistido no perfil — a seleção precisa ser dado, não código
- o site público é a superfície que os clientes finais do lojista veem: performance e SEO importam mais aqui que em qualquer outra tela
- `PublicSiteHome.tsx` já tem 1.336 linhas com um só tema; adicionar modelos exige extrair a estrutura antes, não depois

---

## Fora de escopo

*(nada registrado ainda)*

Use esta seção para funcionalidades **descartadas em definitivo**, para que ninguém as reabra por engano. Diferente do Roadmap: aquilo volta, isto não.

---

## Perguntas em aberto

Dúvida sobre comportamento do sistema que ninguém sabe responder? Registre aqui em vez de adivinhar no código.

### Qual landing page é a válida?
**Aberta desde 2026-07-18.**
Existem duas implementações — `Landing/` (raiz) e `src/pages/Landing/` — e nenhuma está conectada ao app. Nenhuma rota aponta para elas e `LandingPage` não é importado em lugar nenhum.

Precisa ser definido: uma delas é o site de vendas em produção (hospedado à parte)? As duas são resíduo? Enquanto não houver resposta, **nenhuma das duas deve ser alterada**.
