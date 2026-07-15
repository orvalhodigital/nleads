# 🪄 Plano de Mudança de Visual — Orvalho Digital (Veículos)

> **Objetivo:** transformar o painel num visual **Clean, Elegante e consistente**, com
> **tema Dia/Noite** impecável e **experiência mobile de primeira classe**.
>
> **Como usar este plano (para qualquer IA que continuar):**
> 1. Leia primeiro `docs/DESIGN_GUIDELINES.md` (as regras).
> 2. Pegue a **próxima tarefa `[ ]` não marcada**, em ordem de fase.
> 3. Implemente, valide nos **dois temas + mobile**, marque `[x]` e anote decisões no rodapé.
> 4. Não faça commit/deploy sem o usuário pedir.
>
> Iniciado em **2026-07-15**. Fonte da verdade das decisões visuais.

---

## 🎯 Princípios do novo visual

- **Clean:** menos ruído, mais respiro. Bordas sutis > sombras pesadas. Hierarquia clara.
- **Elegante:** tipografia com personalidade (Bricolage nos títulos), microinterações discretas, espaçamento generoso.
- **Consistente:** tudo sai dos tokens e da escala. Nada de valores mágicos.
- **Dia & Noite:** paridade total entre os temas.
- **Mobile-first:** desenhado para o polegar antes do mouse.

## 🎨 Decisões já tomadas (não reabrir sem falar com o usuário)

| Tema | Decisão |
|---|---|
| Fonte títulos | **Bricolage Grotesque** (variável, self-hosted) |
| Fonte corpo/UI | **Inter** (variável, self-hosted) |
| Cor primária | **Azul-violeta / índigo** (`--primary` = `#5B46E5` Dia, `#9D92FB` Noite) — o roxo original foi puxado para o azul em 2026-07-15 |
| Distribuição CSS | Tailwind v4 via Vite + tokens em `@theme inline` (`src/index.css`) |
| Fontes | `@fontsource` (sem Google Fonts CDN, sem Tailwind Play CDN) |
| Tema | `ThemeContext` `'dia'|'noite'` + classe `.dark` no `<html>` |

---

## 📋 Fases

Legenda: `[ ]` a fazer · `[~]` em andamento · `[x]` concluído

### ✅ FASE 0 — Fundação tipográfica & limpeza *(feito em 2026-07-15)*

- [x] Instalar `@fontsource-variable/bricolage-grotesque` e `@fontsource-variable/inter`.
- [x] Importar as fontes em `src/index.tsx` (self-hosted).
- [x] Remover `<script src="cdn.tailwindcss.com">` do `index.html`.
- [x] Remover `<link>` de Google Fonts do `index.html`; adicionar `<meta name="color-scheme">`.
- [x] Atualizar `--font-sans` (Inter) e `--font-heading` (Bricolage) em `src/index.css`.
- [x] Base: `h1–h6` usam `font-heading` + `tracking` ótico; font-smoothing; `font-feature-settings` do Inter.
- [x] Validar no browser: ambas as fontes carregam e aplicam (confirmado via `document.fonts`).
- [x] Criar `docs/DESIGN_GUIDELINES.md` (regras para próximas IAs).
- [x] Criar `.claude/launch.json` (dev server na porta 3000 para verificação visual).

> **Pendência técnica herdada:** `tailwind.config.js` ainda tem mapeamentos v3 legados
> (paleta roxa mapeada em `emerald/teal/indigo/lime`). Em Tailwind v4 a fonte da verdade é o
> `@theme` no CSS. **Fase 1** deve consolidar os tokens e reduzir o config ao mínimo.

---

### FASE 1 — Sistema de tokens & escala (design system) *(quase concluída em 2026-07-15)*

Consolidar os fundamentos para que todas as telas puxem do mesmo lugar.

- [x] **🔴 Corrigir a compilação do Tailwind** — adicionado `@import "tailwindcss";` no topo de `src/index.css`. O build agora gera preflight + utilitários (CSS foi de 8 KB → 222 KB) e a produção **não depende mais do Play CDN**. Era a causa-raiz de tudo. *(descoberta não planejada, mas fundamental)*
- [x] Limpar `tailwind.config.js`: removidos os mapeamentos v3 legados (indigo/emerald/teal/lime → roxo) que eram **código morto** (nunca tiveram efeito). Config reduzido a stub documentado.
- [x] Definir **superfície de vidro** padronizada: classe `.surface-glass` em `src/index.css` (blur 12px mobile → 24px desktop).
- [x] Adicionado keyframe/utilitário `.animate-slideIn` que faltava (5 usos eram no-op).
- [~] Auditar `src/index.css`: tokens Dia/Noite existem e são coerentes (background, card, muted, border, ring, chart-1..5, sidebar-*). Falta uma varredura formal de contraste AA.
- [ ] Revisar a paleta de `--primary` e derivados para o tom "elegante" desejado (validar contraste AA nos dois temas).
- [~] Escala tipográfica documentada como receitas de utilitários no `DESIGN_GUIDELINES.md` §2. Avaliar se vale criar componentes `Heading`/`Text` na Fase 4.
- [x] Documentar `.surface-glass`, o `@import` crítico e o config inerte no `DESIGN_GUIDELINES.md`.

**Critério de pronto:** trocar um token no CSS muda o app inteiro coerentemente, sem cor hardcoded sobrando nas telas principais. *(Base pronta; falta a varredura de contraste e o ajuste fino de paleta.)*

---

### FASE 2 — Toggle de tema & experiência Dia/Noite *(parcialmente feita em 2026-07-15)*

O tema já funciona; falta refinar e garantir paridade.

- [x] Redesenhar o toggle Dia/Noite (Header): agora é um **knob deslizante** (sol↔lua) com `role="switch"`, `aria-checked`, `aria-label` e foco visível.
- [x] Corrigir o `switch.tsx` (Base UI): cor "ligado" era verde `#10b981` (marca antiga) → agora usa `var(--primary)` e um neutro theme-aware no "desligado". Consistente nos dois temas.
- [x] Corrigir inconsistência de marca no login (`Auth.tsx`): foco do campo de email era verde `#57a89a` → roxo `#8b5cf6`.
- [ ] Auditar TODAS as telas em busca de `text-slate-*`/`bg-white`/`bg-purple-*` sem par `dark:` (grep + correção). **Bloco grande — precisa de QA autenticado.** Mapa inicial: ~78 arquivos usam classes de cor cruas (ver §"Pendências" no rodapé).
- [ ] Transição suave global ao alternar tema (sem flash), respeitando `prefers-reduced-motion`.
- [ ] Garantir que blobs/gradientes/`backdrop-blur` ficam bons nos dois temas.
- [ ] Opcional: opção "Automático (sistema)" além de Dia/Noite.
- [Nota] O **login** (`Auth.tsx`) é um split-screen de **marca fixa** (painel esquerdo sempre escuro, direito sempre claro) — é intencional, não é bug de tema. Não converter sem alinhar com o usuário.

**Critério de pronto:** percorrer todas as telas nos dois temas sem nenhum elemento ilegível/sumido.

---

### FASE 3 — Navegação & MOBILE (atenção especial) 📱 *(núcleo feito em 2026-07-15)*

O ponto que o usuário mais pediu carinho.

- [x] Redesenhar a **barra inferior mobile** (`AppSidebar.tsx`): agora **4 itens principais** (Métricas, Estoque, Leads, Agenda) + botão **"Mais"** que abre um **bottom sheet** com os secundários (Fluxo de Vendas, Vendas, Motos, Suporte, Website, Configurações) + perfil e Sair. Fim do scroll horizontal apertado.
- [x] Respeitar `env(safe-area-inset-bottom)` na barra e no sheet (notch/gestos).
- [x] Alvos de toque grandes (barra `h-16`, itens do sheet `py-4`); indicador de ativo claro (barrinha superior + cor `primary`); sem depender de hover (usa `active:`).
- [x] Sidebar desktop: separada da mobile (`hidden lg:flex`), estados refinados, avatar/tooltips usando tokens (`bg-foreground`/`text-background` em vez de `slate-800` cru).
- [x] Usa a nova classe `.surface-glass` na barra mobile.
- [ ] **Header mobile** compacto: busca vira ícone→overlay full-screen; logo/título equilibrados. *(pendente)*
- [ ] Revisar `pb-28` do conteúdo em `UserLayout` vs. a nova barra (`h-16`+safe-area) — clearance ok, mas dá pra afinar.
- [ ] Testar em dispositivo real 360/390/414px (verificação visual autenticada pendente — não foi possível logar nesta sessão).

**Critério de pronto:** navegação mobile confortável com o polegar, elegante e sem apertos.

> ⚠️ **Verificação pendente:** a barra/sheet mobile só aparecem autenticado. O código foi
> validado por `tsc` + build, mas **falta QA visual logado** (abrir < lg, conferir a barra,
> o sheet "Mais", o safe-area e o estado ativo). Próxima IA/usuário deve validar ao vivo.

---

### FASE 4 — Componentes base (UI kit)

Padronizar os blocos reutilizáveis antes das telas.

- [ ] `button.tsx`: variantes (primary/secondary/ghost/destructive/outline), tamanhos, estados (loading/disabled), foco visível.
- [ ] `card.tsx`: superfície clean padrão (borda + leve elevação + raio).
- [ ] `input.tsx`, `label.tsx`, `select.tsx`, `CustomSelect`, date/time pickers: estados de foco/erro consistentes com tokens.
- [ ] `dialog.tsx`/`Modal.tsx`: overlay, blur, animação de entrada, responsivo (vira bottom-sheet no mobile quando fizer sentido).
- [ ] `tabs.tsx`, `switch.tsx`, `Toast`: alinhar ao novo visual.
- [ ] Estados vazios (empty states) e skeletons de carregamento consistentes e elegantes.

**Critério de pronto:** um "storybook informal" — abrir cada componente e ver consistência nos dois temas.

---

### FASE 5 — Telas (aplicar o novo visual)

Ordem sugerida por impacto/visibilidade. Cada tela: validar Dia/Noite + mobile.

- [ ] **Dashboard/Métricas** (`DashboardPage` + `components/dashboard/*`): KPIs com `font-heading`, cards clean, gráficos usando `--chart-*`.
- [ ] **Leads** (`LeadsPage`, `LeadManager`, kanban `sales-flow`): listas/cards, filtros, kanban confortável no mobile.
- [ ] **Detalhe do Lead** (`LeadDetailPage`, `components/lead-detail/*`).
- [ ] **Estoque** (`InventoryPage`, `MotorcyclesPage`, `components/inventory/*`, `vehicle-form`): grid de veículos, formulário.
- [ ] **Agenda** (`AgendaPage`, `components/agenda/*`).
- [ ] **Vendas** (`SalesFlowPage`, `SalesClosedPage`).
- [ ] **Configurações** (`SettingsPage`, `components/settings/*`), **Planos** (`Plans`).
- [ ] **Suporte** (`SupportPage`), **Website** (`WebsitePage`).
- [ ] **Auth/Login** (`Auth`) e **Onboarding** (`OnboardingWizard`, `AppTour`).
- [ ] **Header** e busca global (`GlobalSearch`).

**Critério de pronto:** todas as telas com a mesma linguagem visual, tipografia e comportamento nos dois temas.

---

### FASE 6 — Polish, acessibilidade & performance

- [ ] Microinterações finais (hover/press/focus) coerentes e discretas.
- [ ] Acessibilidade: contraste AA em tudo, foco visível, `alt`/`aria-label`, `prefers-reduced-motion`.
- [ ] Performance: conferir custo de `backdrop-blur`/blobs no mobile; lazy onde couber.
- [ ] `npm run build` sem erros/avisos novos.
- [ ] Passada final tela a tela nos dois temas + mobile.
- [ ] Atualizar `BRANDING*.md` se algo divergir do novo sistema.

---

## 🧭 Estado atual (resumo rápido)

- **Fases concluídas:** 0 (fontes + limpeza), ~1 (design system), núcleo da 2 (toggle/switch) e núcleo da 3 (navegação mobile).
- **Próxima fase recomendada:** terminar a **auditoria de cores hardcoded/dark-mode** (Fase 2) e então **Fase 5** (aplicar o visual tela a tela) — ambas exigem **QA autenticado** (logar no sistema).
- **App roda em:** `npm run dev` → http://localhost:3000 (build de produção validado ✓, 222 KB CSS).
- **Tema já funcional:** sim (toggle novo no Header, persiste em localStorage).
- **⚠️ Limitação da sessão de 2026-07-15:** a IA não conseguiu autenticar no sistema, então as telas internas (dashboard, leads, estoque, etc.) e a nova nav mobile **não foram verificadas visualmente logadas** — só por `tsc`/build. Priorizar essa QA.

### Pendências mapeadas (para as Fases 2/5)
- ~78 arquivos usam classes de cor cruas (`slate-*`, `indigo-*`, `emerald-*`, `bg-white`, hex diretos). Muitos têm par `dark:`, mas nem todos. Fazer a varredura tela a tela nos dois temas.
- Componentes base (`ui/*`) já estão majoritariamente tokenizados; `input.tsx` usa `bg-white/40 dark:bg-slate-900/40` (funciona, mas dá pra tokenizar para `bg-input`/`bg-card`).
- Possíveis micro-regressões v3→v4 (border/ring/shadow defaults) — olhar durante a QA.

---

## 📝 Diário de bordo (append-only — cada IA anota o que fez)

### 2026-07-15 — Fase 0 (IA: Claude/Opus)
- Migrado de fontes CDN (Outfit/Jakarta/Inter/Playfair/Oswald/Fraunces via Google) para **Bricolage Grotesque + Inter** self-hosted via `@fontsource-variable`.
- Removido o **Tailwind Play CDN** (`cdn.tailwindcss.com`) do `index.html` — era um conflito real com o build Vite/Tailwind v4.
- `h1–h6` agora usam `font-heading` automaticamente; adicionados `font-smoothing`, `tracking` ótico e `font-feature-settings` do Inter.
- Criado `docs/DESIGN_GUIDELINES.md` e este plano.
- Validado no browser (login): ambas as fontes carregam e aplicam corretamente.
- **Observação p/ próxima IA:** os screenshots do preview estavam expirando (custo dos blobs `animate-pulse` + `backdrop-blur`) — usar `get_page_text`/`javascript_tool` para validar quando o screenshot travar; e considerar reduzir esse custo na Fase 6 (performance).

### 2026-07-15 — Fase 1 (IA: Claude/Opus)
- **🔴 Causa-raiz descoberta:** o `src/index.css` nunca teve `@import "tailwindcss";`. O build gerava um CSS de ~8 KB **sem nenhum utilitário** — todo o estilo vinha do **Play CDN** (`cdn.tailwindcss.com`) em runtime, com a paleta padrão. Ou seja, a produção estava embarcando o CDN de desenvolvimento (lento, com aviso de console, e que ignorava o `tailwind.config.js`).
- **Corrigido:** adicionado `@import "tailwindcss";` no topo do `index.css`. Build agora gera 222 KB de CSS real (30 KB gzip) com preflight + utilitários. Verificado no browser (probe `bg-primary` → roxo `rgb(124,58,237)`, `flex`, padding, raio) e via rebuild.
- **Consequência:** o `tailwind.config.js` era **código morto** (mapeamento v3 indigo/emerald/teal/lime → roxo que nunca aplicou, porque o CDN usava config padrão). Limpo para um stub documentado; nenhuma mudança visual (as classes `indigo-*`/`emerald-*` já renderizavam como as cores padrão).
- Adicionada a classe `.surface-glass` (glassmorphism padronizado) e o keyframe/utilitário `.animate-slideIn` que faltava.
- **Atenção p/ próxima IA:** como o app foi escrito contra o CDN v3 e agora compila em v4, podem existir pequenas regressões de defaults v3→v4 (border color, ring, nomes de `shadow`). Nada gritante apareceu no login, mas vale um olhar tela a tela durante as Fases 2–5.

### 2026-07-15 — Fases 2 e 3 (IA: Claude/Opus)
- **Toggle Dia/Noite** (Header) redesenhado: knob deslizante sol↔lua, acessível (`role="switch"`, `aria-checked`, foco visível).
- **`switch.tsx`**: cor "ligado" verde `#10b981` → `var(--primary)` (roxo da marca), theme-aware nos dois modos.
- **`Auth.tsx`**: foco do email verde `#57a89a` → roxo `#8b5cf6` (consistência). Login mantido como split-screen de marca fixa (decisão consciente).
- **Navegação mobile (Fase 3, prioridade do usuário)**: `AppSidebar.tsx` reescrito. Desktop e mobile agora são blocos separados. Mobile = barra inferior com 4 itens principais + sheet "Mais" (secundários + perfil + Sair), com `safe-area-inset`, alvos grandes, estado ativo claro e `.surface-glass`. Acabou o scroll horizontal de ~9 ícones.
- Validado por `tsc --noEmit` (sem novos erros nos arquivos tocados; erros restantes são pré-existentes em `AdminSales`, `AdminUserDetails`, testes sem `@types/jest`, e o `View`/'home' do Header) e por `npm run build` (222 KB CSS).
- **NÃO verificado logado** (não foi possível autenticar). Deixar QA visual autenticada da nav mobile e do toggle para a próxima sessão.
- **Login mobile** verificado ao vivo (< lg): responsivo e correto.

### 2026-07-15 — Ajuste de matiz + QA autenticado (IA: Claude/Opus)
- Usuário logou no preview → passou a ser possível verificar telas internas ao vivo.
- **Cor primária puxada do roxo para o azul-violeta (índigo)** a pedido do usuário. Deslocamento coordenado em TODOS os tokens (Dia/Noite), escala `--color-brand-*`, sidebar, ring, accent, chart-1: `--primary` `#7C3AED`→`#5B46E5` (Dia) e `#A78BFA`→`#9D92FB` (Noite). Fundos/bordas ganharam leve undertone azul.
- **Verificado ao vivo** no Dashboard nos dois temas (Dia e Noite): tom elegante, clean, claramente mais azul sem sair da família violeta. Build 222 KB ✓.
- Fase 1 (ajuste fino de paleta) essencialmente fechada. Falta só a varredura formal de contraste AA.
