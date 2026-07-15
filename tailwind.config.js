/** @type {import('tailwindcss').Config} */

// ─────────────────────────────────────────────────────────────────────────────
// Tailwind CSS v4 — este projeto configura o design system via CSS.
//
// A FONTE DA VERDADE de tokens (cores, fontes, raio, sombras) é o bloco
// `@theme inline` em `src/index.css`, e os temas Dia/Noite ficam em `:root` /
// `.dark` no mesmo arquivo. O plugin `@tailwindcss/postcss` NÃO carrega este
// arquivo automaticamente e faz auto-detecção de conteúdo — então este config
// é intencionalmente mínimo.
//
// ⚠️ Histórico: até 2026-07-15 o projeto tinha aqui um mapeamento legado do
// Tailwind v3 (paleta roxa sobrescrevendo indigo/emerald/teal/lime). Esse
// mapeamento NUNCA teve efeito (o build não gerava utilitários; tudo vinha do
// Play CDN em runtime com a paleta padrão). Foi removido para não confundir.
// Se precisar de uma cor de marca, use os tokens `brand-*` / `primary` do
// `@theme` em src/index.css. Ver docs/DESIGN_GUIDELINES.md.
// ─────────────────────────────────────────────────────────────────────────────

export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {},
    },
    plugins: [],
}
