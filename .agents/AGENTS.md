# Diretrizes visuais — ponteiro

> Este arquivo continha uma cópia divergente das diretrizes de design.
> Ela contradizia o documento canônico (mandava usar a fonte **Outfit** e descrevia
> a cor primária como "lilás/lavanda") e foi substituída por este ponteiro em 2026-07-18.

**A fonte da verdade visual é [docs/DESIGN_GUIDELINES.md](../docs/DESIGN_GUIDELINES.md).** Leia antes de escrever qualquer CSS ou JSX de interface.

Marca, logotipos e ativos: [docs/BRANDING.md](../docs/BRANDING.md).

Regras gerais de trabalho no repositório: [CLAUDE.md](../CLAUDE.md).

## Os pontos que mais quebram

1. **Nunca hardcode cor.** Use tokens semânticos: `bg-card`, `text-foreground`, `border-border`, `bg-primary`. Não `bg-white`, `text-slate-900`, `bg-purple-600`.
2. **Toda tela funciona no Dia e no Noite.** Teste os dois antes de dar por pronto.
3. **Títulos = `font-heading` (Bricolage Grotesque). Corpo = `font-sans` (Inter).** Não importe fontes novas — e **não** use Outfit.
4. **Mobile-first.** Desenhe em 375px e expanda. A navegação mobile é o dock inferior em `src/components/AppSidebar.tsx`; alvos de toque ≥ 44px.
5. **Nunca reintroduza `cdn.tailwindcss.com` nem `<link>` do Google Fonts.** Tailwind é compilado pelo Vite; fontes vêm do `@fontsource`.

O detalhe de cada regra — incluindo duas linhas do `src/index.css` que, se removidas, quebram todo o tema — está no documento canônico.
