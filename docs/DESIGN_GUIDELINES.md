# 🎨 Diretrizes de Design & Boas Práticas — Orvalho Digital (Veículos)

> **Para toda IA (ou pessoa) que for mexer no visual deste sistema.**
> Leia este documento **antes** de escrever qualquer CSS/JSX de interface.
> Ele é a fonte da verdade de como o painel deve parecer e se comportar.
> Última revisão: **2026-07-15** — durante a migração de visual "Clean & Elegante".

---

## 0. TL;DR — as 10 regras de ouro

1. **Nunca use cores hardcoded** (`#7C3AED`, `bg-purple-600`, `text-slate-900`…). Use os **tokens semânticos**: `bg-primary`, `text-foreground`, `border-border`, `bg-card`, etc. (§3).
2. **Toda tela precisa funcionar no tema Dia E Noite.** Se você escreveu `text-slate-900`, ele some no escuro. Teste os dois. (§4)
3. **Títulos = `font-heading` (Bricolage Grotesque). Corpo/UI = `font-sans` (Inter).** Não importe fontes novas. (§2)
4. **Mobile-first e mobile-perfeito.** Desenhe primeiro no 375px, depois expanda com `sm:` `md:` `lg:`. O mobile tem atenção especial neste projeto. (§6)
5. **Nunca adicione `<script src="cdn.tailwindcss.com">` nem `<link>` de Google Fonts.** Tailwind é compilado pelo Vite; fontes vêm via `@fontsource`. (§1)
6. **Raio, espaçamento e sombra vêm da escala** (`rounded-2xl`, `p-4`, `shadow-sm`). Não invente valores mágicos. (§5)
7. **Acessibilidade não é opcional:** contraste ≥ 4.5:1, `alt` em imagens, foco visível, alvos de toque ≥ 44px. (§7)
8. **Reuse componentes de `src/components/ui/`** antes de criar um botão/card/input do zero. (§8)
9. **Não quebre o que funciona.** Refatore visual sem alterar lógica de dados, rotas ou serviços. Mudança de visual ≠ mudança de comportamento.
10. **Registre o que fez** no plano ativo (`docs/plans/2026-07-15-visual-redesign-plan.md`) para a próxima IA continuar. (§10)

---

## 1. Stack & como o estilo é montado

| Camada | Ferramenta | Onde |
|---|---|---|
| Build CSS | **Tailwind CSS v4** (via `@tailwindcss/postcss`) | `postcss.config.js` |
| Tokens/tema | CSS Custom Properties + `@theme inline` | `src/index.css` |
| Fontes | `@fontsource-variable/*` (self-hosted) | importadas em `src/index.tsx` |
| Ícones | **lucide-react** | `import { X } from 'lucide-react'` |
| Animação | CSS keyframes + **framer-motion** (quando necessário) | `src/index.css` / componentes |
| Utilitário de classes | `clsx` + `tailwind-merge` (via `cn()` em `@/lib/utils`) | `src/lib/utils.ts` |

**⚠️ Armadilha de versão:** este projeto é **Tailwind v4**. A **fonte da verdade dos tokens é o `@theme inline` em `src/index.css`**. Ao adicionar uma cor/token, adicione **no CSS**, não no `tailwind.config.js` (que em v4 é inerte — não é carregado pelo build e serve só como referência mínima de `content`).

**🔴 CRÍTICO — o `src/index.css` DEVE começar com `@import "tailwindcss";`.**
É essa linha que faz o build (Vite/PostCSS) gerar o preflight + todos os utilitários.
Até 2026-07-15 o projeto **não tinha** esse import e dependia do **Play CDN**
(`cdn.tailwindcss.com`) para gerar utilitários em runtime — por isso o CSS buildado
era vazio. Isso foi corrigido. **Nunca remova o `@import "tailwindcss";`** e **nunca
volte a usar o CDN**. Se as telas ficarem sem estilo (sem cor, sem flex, sem padding),
o primeiro suspeito é esse import.

**Nunca** reintroduza:
- `<script src="https://cdn.tailwindcss.com"></script>` — é o "Play CDN" de protótipo; conflita com o build e não deve ir para produção.
- `<link href="fonts.googleapis.com...">` — render-blocking. Use `@fontsource`.

---

## 2. Tipografia

Duas famílias, self-hosted, variáveis:

| Uso | Token Tailwind | Família |
|---|---|---|
| **Títulos, números-destaque, display** | `font-heading` | Bricolage Grotesque Variable |
| **Corpo, UI, labels, tabelas** | `font-sans` (padrão) | Inter Variable |

- `h1`–`h6` **já usam `font-heading` automaticamente** (regra base em `src/index.css`). Não precisa repetir a classe — só use `font-heading` em elementos que não são heading semântico mas devem ter cara de título (ex.: um `<p>` com número grande de KPI).
- **Pesos:** corpo 400–500; ênfase 600; títulos 700–800. Evite `font-black` em excesso — elegância vem da moderação.
- **Escala sugerida** (mobile → desktop):
  - Título de página: `text-2xl md:text-3xl font-heading font-bold tracking-tight`
  - Seção: `text-lg md:text-xl font-heading font-semibold`
  - Corpo: `text-sm md:text-base`
  - Auxiliar/label: `text-xs font-medium text-muted-foreground`
  - Micro-label (uppercase): `text-[10px] font-bold uppercase tracking-widest text-muted-foreground`
- **Não importe fontes novas.** Se achar que precisa, atualize este documento e o plano primeiro.

---

## 3. Cores — SEMPRE via tokens semânticos

Os tokens são definidos em `src/index.css` (`:root` = Dia, `.dark` = Noite) e expostos como utilitários Tailwind via `@theme inline`.

| Token | Classe | Papel |
|---|---|---|
| `--background` | `bg-background` | Fundo da página |
| `--foreground` | `text-foreground` | Texto principal |
| `--card` | `bg-card` | Superfície de cartões/painéis |
| `--card-foreground` | `text-card-foreground` | Texto sobre cartões |
| `--primary` | `bg-primary` / `text-primary` | Roxo Orvalho — ação principal |
| `--primary-foreground` | `text-primary-foreground` | Texto sobre o roxo |
| `--secondary` | `bg-secondary` | Superfície secundária/sidebar |
| `--muted` / `--muted-foreground` | `bg-muted` / `text-muted-foreground` | Fundos sutis / texto auxiliar |
| `--accent` | `bg-accent` | Realce sutil (hover) |
| `--border` / `--input` | `border-border` | Bordas e inputs |
| `--ring` | `ring-ring` | Anel de foco |
| `--destructive` | `bg-destructive` | Erro/exclusão |
| `--chart-1..5` | `text-chart-1`… | Séries de gráficos |

**Regra prática:** se você digitou o nome de uma cor (`purple`, `slate`, `violet`, `zinc`, `gray`, `white`, `black`) numa classe de UI, provavelmente está errado. Exceções conscientes: estados semânticos fixos como sucesso (`emerald/green`), alerta (`amber`), erro (`red`) — e mesmo esses devem ter variante `dark:`.

❌ `className="bg-white text-slate-900 border-slate-200"`
✅ `className="bg-card text-foreground border-border"`

❌ `className="bg-purple-600 text-white"`
✅ `className="bg-primary text-primary-foreground"`

---

## 4. Tema Dia / Noite

**🔴 CRÍTICO — a variante `dark:` depende de UMA linha no `src/index.css`:**
```css
@custom-variant dark (&:where(.dark, .dark *));
```
No **Tailwind v4** o `dark:` usa `@media (prefers-color-scheme)` por padrão. O v3 fazia
por classe via `darkMode: 'class'` no config — que o v4 **não carrega**. Sem essa linha,
**todas** as utilitárias `dark:*` seguem o tema do **sistema operacional** em vez do botão
Dia/Noite: os tokens (`.dark { --background }`) escurecem, mas os `dark:bg-*`/`dark:text-*`
não aplicam — o tema quebra pela metade (foi exatamente o bug de 2026-07-15: 115 regras
presas no media query, 0 na classe). **Nunca remova essa linha.**
Sintoma: você liga o Noite, o fundo escurece, mas painéis/textos continuam com cara de tema claro.

- Controlado por `ThemeContext` (`src/contexts/ThemeContext.tsx`), valores `'dia' | 'noite'`.
- Aplica/remove a classe `.dark` no `<html>` e persiste em `localStorage` (`otimizza_theme`).
- Toggle fica no `Header` (`src/components/Header.tsx`).
- Respeita `prefers-color-scheme` no primeiro acesso.

**Checklist obrigatório ao criar/editar tela:**
- [ ] Abri no modo Dia **e** no modo Noite.
- [ ] Nenhum texto sumiu, nenhum fundo ficou branco-no-escuro.
- [ ] Usei tokens, não cores fixas. Onde precisei de cor fixa, adicionei `dark:`.
- [ ] Sombras/blur continuam legíveis nos dois temas.

---

## 5. Espaçamento, raio e elevação

- **Raio:** derivado de `--radius` (1.5rem). Use `rounded-lg/xl/2xl/3xl`. Cartões grandes → `rounded-2xl`/`rounded-3xl`; botões/inputs → `rounded-xl`; chips → `rounded-full`.
- **Espaçamento:** escala Tailwind (`gap-2/3/4`, `p-4/6`, `space-y-4`). Ritmo consistente > pixels aleatórios.
- **Elevação:** prefira `shadow-sm`/`shadow-md` + `border border-border`. Evite sombras pesadas. O visual é **clean** — profundidade vem de bordas sutis e do `backdrop-blur`, não de drop-shadows fortes.
- **Glassmorphism** (assinatura do painel): use a classe utilitária **`.surface-glass`** (definida em `src/index.css`) — já traz fundo translúcido do `--card`, borda sutil e blur (mais leve no mobile, 12px → 24px no desktop, por custo de performance). Evite reescrever `bg-card/60 backdrop-blur-xl border...` à mão; prefira `surface-glass` para manter a linguagem consistente.

---

## 6. Mobile (atenção especial)

Este projeto trata mobile como **primeira classe**, não como adaptação.

- **Mobile-first:** escreva as classes-base para 375px; adicione `sm:`/`md:`/`lg:` para telas maiores.
- **Navegação:** no mobile a sidebar vira **barra inferior flutuante** (`AppSidebar.tsx`). Mantenha alvos ≥ 44×44px, sem depender de hover.
- **Sem hover como única via:** tudo acionável por hover precisa de equivalente por toque/tap.
- **Header mobile:** compacto; busca pode virar ícone que abre overlay.
- **Conteúdo:** tabelas viram cards empilhados no mobile quando possível; evite scroll horizontal não intencional.
- **Safe areas:** respeite `env(safe-area-inset-*)` em barras fixas (notch/gestos).
- **Teste real:** 360–414px de largura. Nada pode "vazar" na horizontal.

---

## 7. Acessibilidade

- Contraste texto/fundo ≥ **4.5:1** (≥ 3:1 para texto grande). Vale nos dois temas.
- Foco **sempre visível** — não remova `outline` sem substituir por `ring`.
- Imagens com `alt` significativo; ícones decorativos com `aria-hidden`.
- Botões só de ícone precisam de `title`/`aria-label`.
- Alvos de toque ≥ 44px. Ordem de tabulação lógica.
- Não comunique estado **só** por cor (adicione ícone/rótulo).

---

## 8. Componentes

- **Reuse antes de criar.** Base em `src/components/ui/` (`button`, `card`, `input`, `select`, `dialog`, `tabs`, `switch`, etc.).
- Componha com `cn()` (`@/lib/utils`) para mesclar classes com segurança.
- Um novo componente visual deve: aceitar `className`, respeitar tokens, funcionar nos dois temas e no mobile.
- Padrões de variante: use `class-variance-authority` (já no projeto) como em `button.tsx`.

---

## 9. Animação & microinterações

- Transições curtas e suaves: `transition-all duration-200/300`, `ease-out`.
- Keyframes utilitários já existem em `src/index.css` (`animate-fadeUp`, `animate-fadeIn`, `animate-toast-in`…). Reuse.
- Use `framer-motion` só quando o CSS não resolve (listas reordenáveis, gestos).
- Respeite `prefers-reduced-motion` para quem desativou animações.
- Regra de ouro: animação serve à **clareza**, não ao espetáculo.

---

## 10. Fluxo de trabalho da IA

1. **Leia** este documento + o plano ativo em `docs/plans/2026-07-15-visual-redesign-plan.md`.
2. **Pegue a próxima tarefa não concluída** do plano (as fases são ordenadas).
3. **Implemente** seguindo as regras acima.
4. **Verifique nos dois temas e no mobile** (rode `npm run dev`, porta 3000).
5. **Marque a tarefa como concluída** no plano e anote decisões/pendências.
6. **Não** faça deploy nem commit sem o usuário pedir. Não altere lógica de negócio a pretexto de "arrumar o visual".

### Comandos úteis
```bash
npm run dev       # dev server (localhost:3000)
npm run build     # build de produção (valida que nada quebrou)
```

---

## Anexo — cheatsheet de substituição rápida

| ❌ Evite | ✅ Use |
|---|---|
| `bg-white` | `bg-card` |
| `bg-gray-50` / `bg-slate-50` | `bg-background` ou `bg-muted` |
| `text-slate-900` / `text-black` | `text-foreground` |
| `text-slate-500` / `text-gray-400` | `text-muted-foreground` |
| `border-slate-200` | `border-border` |
| `bg-purple-600` | `bg-primary` |
| `text-purple-600` | `text-primary` |
| `<link>` Google Fonts | `import '@fontsource-variable/...'` |
| `font-['Outfit']` | `font-heading` (títulos) / `font-sans` (corpo) |
