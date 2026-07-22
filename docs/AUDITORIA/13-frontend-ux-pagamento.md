# Fase 13 — Frontend/UX, Acessibilidade & Fluxo de Pagamento

> Executada em 2026-07-22. Começou como auditoria de frontend/UX e destravou (via teste do dono) uma cadeia de bugs no fluxo de pagamento.

## 🟠 A45 — Modo Noite ligado por padrão, mas quebrado em 84% das telas (resolvido)

O dark mode existia (toggle + `.dark` no root) e o **padrão seguia o SO** (`prefers-color-scheme`), mas só **22 de 139** arquivos (16%) tinham suporte `dark:` — o resto usa cor fixa (`bg-white`, `text-slate-900`). Resultado: quem tinha o SO no escuro caía numa UI quebrada sem escolher.

**Decisão do dono:** completar o Noite, mas com **padrão Dia** (opt-in). Correções:
- `ThemeContext`: padrão passa a ser sempre `dia` (não segue mais o SO). Preferência salva é respeitada.
- **Camada de compatibilidade** no `index.css`: como toda cor da paleta vira `var(--color-*)` no Tailwind v4, remapeamos as utilitárias neutras sob `.dark` distinguindo papel (fundo vs texto) — `bg-white`→superfície escura, `text-slate-900`→texto claro, `text-white` intacto. Cobre as ~117 telas sem editá-las. Verificado por `getComputedStyle`.
- **Fix de longo prazo:** migrar para tokens semânticos (`DESIGN_GUIDELINES`), aposentando a camada. Roadmap.

## 🟡 A46 — Acessibilidade (roadmap)
215 inputs sem `<label>`/`aria-label` (só placeholder), poucos botões-ícone com nome acessível, 10/56 `<img>` sem `alt`. Pervasivo — correções priorizadas ficam no roadmap. ✅ ErrorBoundary existe (dashboard e admin); site público responsivo e sem erros de console.

## 🔴 A47 — Upgrade caía para link Stripe hardcoded (resolvido)
O fluxo "Adquirir" tentava o Asaas e, em **qualquer erro**, caía para `https://buy.stripe.com/…` fixo no código. Como o sistema cobra **só via Asaas** (só o webhook do Asaas ativa o plano), um pagamento no Stripe iria para uma conta desintegrada e **o plano nunca ativaria** — o cliente pagaria no vazio. **Removido** o fallback (mostra erro em vez de Stripe), removidos os métodos Stripe do `planService` e o campo "Checkout Stripe" do admin.

## 🔴 A48 — Fluxo de pagamento Asaas quebrado em 3 camadas empilhadas
O teste do dono (após A47) revelou uma cadeia de desalinhamentos de config, cada um escondido atrás do anterior:

1. **`SUPABASE_SERVICE_ROLE_KEY` desatualizada na Vercel** → o endpoint não lia o perfil → "Profile not found". A anon (fallback silencioso) nem lê `profiles` depois do A34. **Corrigido:** dono atualizou a chave; código passou a **exigir** service_role (sem fallback) e a **mostrar o erro real**.
2. **Cliente criado sem `cpfCnpj`** (o Asaas exige) → "Failed to create customer". **Corrigido:** modal de CPF/CNPJ no checkout, enviado ao Asaas e persistido em `profiles.cpf_cnpj` (nova coluna, migração `20260722050000`).
3. **Chave de sandbox (`$aact_hmlg_`) contra URL de produção** → "a chave não pertence a este ambiente". **Corrigido:** a URL do Asaas passa a ser **derivada da chave** (sandbox tem `_hmlg_`), em `create-asaas-payment` e `get-asaas-billing-portal` — mismatch impossível.

**Lição de arquitetura:** os três eram config, não lógica — e ficavam invisíveis porque o código engolia o erro real (fallback pro Stripe + "Profile not found"/"Failed to create" genéricos). Agora **cada etapa mostra a mensagem real** do Supabase/Asaas.

### Status (adiado pelo dono)
Após os 3 fixes, o checkout ainda não completa 100% no teste. **O dono decidiu (2026-07-22) adiar os erros restantes do pagamento para depois das auditorias** — com a vantagem de que agora o erro real aparece. Ver checklist em `DECISOES-E-ROADMAP.md`. Antes do lançamento real, trocar a chave do Asaas por uma de **produção** (`$aact_prod_`).

## Resumo

| Item | Situação |
|---|---|
| A45 — dark mode padrão quebrado | 🟠 → ✅ padrão Dia + Noite opt-in funcional |
| A46 — acessibilidade | 🟡 roadmap |
| A47 — fallback pro Stripe | 🔴 → ✅ removido |
| A48 — pagamento Asaas (3 camadas) | 🔴 → ✅ config corrigida + erro real exposto; **conclusão do teste adiada pelo dono** |
