# Diretrizes de Desenvolvimento e Identidade Visual (Orvalho Digital)

Este guia estabelece os padrões visuais e as melhores práticas para que qualquer desenvolvedor ou agente de IA que trabalhe neste repositório mantenha a consistência do sistema.

---

## 1. Princípios de Design

O sistema utiliza uma estética moderna, limpa (Clean), altamente arredondada e com sensação de profundidade por meio de gradientes suaves e desfoques (glassmorphism).

- **Tipografia**: A fonte principal é **Outfit** (com fallback em *Plus Jakarta Sans* e *Inter*). Use sempre a classe utilitária do Tailwind `font-sans`.
- **Bordas Arredondadas**:
  - Contêineres de páginas, seções e cards grandes: `rounded-3xl` (`1.5rem` ou `24px`).
  - Botões, inputs e elementos interativos médios: `rounded-xl` (`1.2rem` ou `19.2px`) ou `rounded-2xl` (`1rem` ou `16px`).
  - Elementos pequenos (tags, badges): `rounded-lg` ou `rounded-md`.
- **Bordas & Linhas**: Evite linhas pretas ou cinzas sólidas e duras. Use bordas semi-transparentes ou lavanda suaves (`border border-border/80` ou `border-white/20`).

---

## 2. Padrão de Cores e Temas (Dia & Noite)

O sistema possui suporte nativo para dois temas: **Dia** (Claro) e **Noite** (Escuro).

### Regras para Criação de Componentes:
- **NUNCA** hardcodeie cores de fundo claras (`bg-white` ou `bg-slate-50`) ou textos escuros (`text-slate-800` ou `text-slate-900`) sem suporte a dark mode.
- Use as variáveis semânticas do Tailwind v4:
  - Fundo principal: `bg-background`
  - Fundo de cartões/cards: `bg-card`
  - Texto principal: `text-foreground`
  - Texto secundário/suave: `text-muted-foreground`
  - Borda padrão: `border-border`
  - Cor primária do sistema: `bg-primary` / `text-primary` (lilás/lavanda).
- Ao usar cores transparentes, utilize a opacidade nativa do Tailwind (ex: `bg-card/60`, `border-border/80`).

---

## 3. Diretrizes de Layout Mobile

A experiência móvel deve ser limpa e focada:
- A navegação em telas pequenas é realizada através do **Floating Dock** (dock flutuante) posicionado no rodapé (`fixed bottom-4 left-4 right-4`).
- Qualquer alteração na navegação ou adição de itens deve ser feita em `src/components/AppSidebar.tsx` e deve caber na estrutura deslizante horizontal (`overflow-x-auto hide-scrollbar`).
- Sempre utilize o recuo inferior `pb-28` nas páginas internas do painel em telas móveis para evitar que o dock flutuante sobreponha o conteúdo das páginas (exemplo em `UserLayout.tsx`).

---

## 4. Código Limpo (Clean Code)

- Mantenha funções focadas e componentes reutilizáveis.
- Evite comentários óbvios que apenas repetem o que o código faz.
- Mantenha a integridade da documentação e de comentários de lógica de negócios não relacionados às suas alterações.
