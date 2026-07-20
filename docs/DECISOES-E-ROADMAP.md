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

## Decisões tomadas

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
