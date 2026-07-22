# Instruções para IAs neste repositório

> **Leia este arquivo inteiro antes de alterar qualquer coisa.**
> Ele vale para Claude Code, Codex, Cursor, Kilo ou qualquer outro agente.
> Humanos: leia também — as mesmas regras se aplicam.

---

## 1. O que é este sistema

**Gestor de Pátio**, da **Orvalho Digital** — SaaS **multi-tenant** para revendas de veículos.
Cada lojista é um tenant isolado. O isolamento é feito por **RLS do Postgres** (coluna `user_id`), não por tabelas separadas.

> 🏷️ **Nomenclatura.** O produto chama-se **Gestor de Pátio**; a empresa, **Orvalho Digital**. As marcas `Otimizza` e `nLeads` foram aposentadas em 2026-07-20. Se você encontrar uma delas no código, **verifique antes de trocar** — algumas ocorrências são intencionais (endpoints n8n em produção, guardas de logo legada, chaves de `localStorage` em migração). Ver `docs/DECISOES-E-ROADMAP.md`.

> ⚠️ **O RLS é a única barreira entre os dados de lojistas diferentes.** Qualquer alteração que toque em query, política ou `service_role` pode vazar dados de um cliente para outro. Trate como código crítico.

Stack: React 19 + Vite 6 + TypeScript + Tailwind 4 · Supabase (Auth/Postgres/Storage) · funções serverless na Vercel (`api/`) · Asaas (assinaturas) · OpenAI com fallback OpenRouter · n8n (WhatsApp).

Mapa completo e atualizado: [docs/AUDITORIA/01-mapa-do-sistema.md](docs/AUDITORIA/01-mapa-do-sistema.md).

---

## 2. Regra de ouro

**Código e documentação mudam juntos, no mesmo commit.**

Se você alterou algo que está descrito num documento e não atualizou o documento, **o trabalho não está concluído**. A próxima IA vai ler o documento desatualizado e tomar decisão errada com base nele.

Se você tomou uma decisão de produto — adiar, abandonar, ou planejar para depois — **registre em [docs/DECISOES-E-ROADMAP.md](docs/DECISOES-E-ROADMAP.md) antes de encerrar**. Conhecimento que fica só na cabeça de quem decidiu se perde.

---

## 3. Matriz: mexeu em X → atualize Y

| Se você alterou… | Atualize obrigatoriamente |
|---|---|
| Rotas em `src/App.tsx` ou `src/admin/AdminApp.tsx` | `docs/AUDITORIA/01-mapa-do-sistema.md` §3 |
| Tabela, coluna ou política RLS | nova migração em `supabase/migrations/` **+** mapa §5 **+** `ARCHITECTURE.md` se o isolamento mudou |
| Função RPC do Postgres | mapa §5 (lista de RPCs) |
| Variável de ambiente | `.env.example` **+** tabela do `README.md` **+** mapa §6 |
| Integração externa (nova API, novo webhook) | mapa §2 **+** §8 (fronteiras de confiança) |
| Serviço em `src/services/` | mapa §4.1 |
| Contexto em `src/contexts/` | mapa §4.2 |
| Função em `api/` | `WEBHOOK_DOCS.md` se for webhook · mapa §2 |
| `vercel.json`, build ou processo de deploy | `DEPLOYMENT.md` |
| Roteamento por domínio customizado | `CUSTOM_DOMAIN_ROUTING.md` **+** `DOMAIN_ROUTING_FLOW.md` |
| Componente de UI novo ou alterado | siga `docs/DESIGN_GUIDELINES.md` — **nunca** hardcode cor de fundo ou texto |
| Token de cor, tema, tipografia | `src/index.css` (`@theme inline`) **+** `docs/DESIGN_GUIDELINES.md` §3 e §4 |
| Navegação / menu | `src/components/AppSidebar.tsx` **+** `docs/DESIGN_GUIDELINES.md` §6 |
| Logo, paleta institucional, ativos de marca | `docs/BRANDING.md` |
| **Decisão de produto** (adiar, abandonar, planejar) | **`docs/DECISOES-E-ROADMAP.md`** |
| Funcionalidade removida ou desativada | `docs/DECISOES-E-ROADMAP.md` — explique **por quê** e se volta no futuro |
| Dependência nova em `package.json` | justifique no commit; se for estrutural, registre em `DECISOES-E-ROADMAP.md` |

---

## 4. Mapa da documentação

| Documento | Serve para |
|---|---|
| `CLAUDE.md` (este) | Regras de trabalho. Ponto de entrada de qualquer IA. |
| `AGENTS.md` | Ponteiro para este arquivo, para agentes que não leem `CLAUDE.md`. |
| `docs/DECISOES-E-ROADMAP.md` | **O que existe, o que virá, o que foi abandonado e por quê.** |
| `docs/DESIGN_GUIDELINES.md` | **Fonte da verdade do visual:** tokens, tema dia/noite, tipografia, mobile, acessibilidade, componentes. **Leia antes de escrever qualquer CSS/JSX.** |
| `docs/BRANDING.md` | Marca, paleta institucional, logotipos e ativos. |
| `.agents/AGENTS.md` | Ponteiro para os dois acima, com os 5 pontos que mais quebram. |
| `docs/AUDITORIA/` | Mapa do sistema e relatórios de auditoria por fase. |
| `README.md` | Como rodar o projeto e variáveis de ambiente. |
| `ARCHITECTURE.md` | Multitenancy e RLS. |
| `DEPLOYMENT.md` · `QUICK_DEPLOY.md` | Deploy. |
| `CUSTOM_DOMAIN_ROUTING.md` · `DOMAIN_ROUTING_FLOW.md` | Domínios dos lojistas. |
| `WEBHOOK_DOCS.md` | Contratos de webhook. |
| `BRANDING*.md` | Identidade visual. |

**Antes de criar um documento novo, verifique se já existe um que cobre o assunto.** Este repositório já tem documentação demais e espalhada; consolidar é melhor que multiplicar.

---

## 5. Onde NÃO trabalhar

Estes caminhos contêm **cópias antigas e desatualizadas**. Nunca edite, e ignore-os em buscas — editar por engano ali significa que sua correção não chega a lugar nenhum:

- `_backup_correcoes_2026-07-15/` · `_backup_metricas_2026-07-15/` · `_backup_paineldoadm_2026-06-05/`
- `.claude/worktrees/` — cópias de trabalho de outras sessões
- `dist/` — saída de build
- `Referência/` · `SistemaCelular/` — material separado, não é o app
- `scratch/` · `tmp/` — scripts descartáveis

O código real está em `src/` e `api/`.

### ⚠️ Não execute `.kilo/skills/vercel-deploy/scripts/deploy.sh`

Esse script compacta **todo o diretório do projeto** excluindo apenas `node_modules` e `.git` — ou seja, **inclui `.env.local`** — e envia por POST para um endpoint externo (`claude-skills-deploy.vercel.com`). Rodá-lo a partir da raiz enviaria a `SUPABASE_SERVICE_ROLE_KEY`, a `ASAAS_API_KEY` e as chaves de IA para fora. O deploy oficial deste projeto é pela Vercel via Git ([DEPLOYMENT.md](DEPLOYMENT.md)).

---

## 5.1 Fluxo de commit e publicação

**Ao fim de cada fase da auditoria, commite e faça push no branch de trabalho.**
Combinado com o dono do projeto em 2026-07-20.

```sh
git add -A
git commit          # mensagem descrevendo os achados corrigidos, não os arquivos
git push origin <branch-de-trabalho>
```

A mensagem de commit deve dizer **o que estava quebrado e o que mudou**, com os
códigos dos achados (`A17`, `A20`…) — não uma lista de arquivos.

> 🔴 **`main` é a branch de produção da Vercel.** Fazer merge/push em `main`
> publica para os clientes.
>
> **Regra atual (definida pelo dono em 2026-07-22):** **suba direto em produção,
> sem pedir autorização a cada vez.** Ao terminar uma correção com `tsc` e build
> limpos, commite e faça push em `main` (ou merge do branch de trabalho em `main`)
> por conta própria. O dono NÃO quer ser consultado antes de cada deploy.
>
> Isso substitui a regra anterior (2026-07-20), que exigia um pedido explícito
> ("suba"/"deploy") a cada publicação. Continua valendo: **nunca** publique com
> `tsc` ou build quebrado, e para mudanças de banco que o código depende, respeite
> a ordem segura (deploy do código antes do SQL quando há fallback; senão, avise).

Deploys de preview saem automaticamente a cada push no branch de trabalho, e o
projeto tem proteção de SSO ativa (`all_except_custom_domains`) — só quem está
logado na Vercel acessa.

---

## 6. Verificação antes de encerrar

```sh
npx tsc --noEmit    # tem que passar limpo
npm run build       # tem que passar
```

> ⚠️ **`npm run build` passa mesmo com erro de tipo** — o Vite transpila sem checar tipos. Rodar só o build **não prova nada**. Sempre rode `tsc --noEmit` também.

Não declare uma tarefa concluída sem ter rodado as duas. Se algo falhar, diga que falhou e mostre a saída — não esconda.

---

## 7. Como registrar uma decisão

Quando você (ou o dono do projeto) decidir algo que afeta o rumo do sistema, adicione uma entrada em `docs/DECISOES-E-ROADMAP.md` com:

- **data**
- **o que foi decidido**
- **por quê**
- **o que acontece com o código** (removido? mantido inativo? adiado?)
- **se volta no futuro**

Exemplo real: os temas de site `glass` e `premium` foram iniciados e abandonados. Sem esse registro, a próxima IA encontra o código morto e não sabe se conserta ou apaga — e uma delas vai adivinhar errado.

---

## 8. Estado da auditoria

O sistema está passando por uma auditoria em 20 fases para prontidão comercial. Relatórios em `docs/AUDITORIA/`.

Problemas conhecidos e ainda **não** corrigidos (não os trate como surpresa nem os "conserte de passagem" — cada um tem fase própria):

- 29 erros de TypeScript (Fase 2)
- Migrações de banco em 3 lugares diferentes: `supabase/migrations/`, `sql/`, raiz (Fase 3)
- 57% do acesso a dados ignora a camada de `src/services/` (Fase 14)
- Cobertura de testes praticamente zero (Fase 15)
- Sem CI (Fase 18)
