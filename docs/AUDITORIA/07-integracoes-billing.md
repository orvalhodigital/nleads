# Fase 7 — Integrações Externas & Billing

> Iniciada em 2026-07-20. Retomada no mesmo dia após o dono confirmar o modelo de negócio. A29 corrigido; A30/A31 documentados.

## ✅ A29 — Estrutura de planos corrigida

Modelo confirmado pelo dono:

| Plano | Preço | slug | Sistema |
|---|---|---|---|
| Básico | R$47 | `basico` (era `free`) | limitado: 10 veículos, 50 leads |
| Ilimitado | R$97 | `pro` | ilimitado |
| Estrutura ECV | R$697 | `estrutura-ecv` | ilimitado + tráfego (Meta Ads, 5 anúncios) |
| Estrutura ECV Plus | R$997 | `estrutura-ecv-plus` | ilimitado + tráfego (10 anúncios*) |

\* O dono escreveu "10 veículos ativos"; o card do site diz "50 veículos anunciados". É limite do **serviço de tráfego**, fora do CRM — não afetou código. Fica registrado para o dono alinhar o texto.

### O bug de receita (corrigido)
`api/webhook-asaas.ts` gravava `plan: 'pro'` para qualquer pagamento. Assim, quem assinava o Básico (R$47) recebia acesso **ilimitado** — os benefícios do Ilimitado (R$97) pela metade do preço. Agora o webhook identifica o plano pelo valor pago (os 4 preços são únicos) e grava o slug real.

### O que foi feito
1. **`src/lib/planAccess.ts`** — fonte única de verdade: `LIMITED_PLANS = ['free','trial','basico']`, `isLimitedPlan()`, `hasUnlimitedAccess()`. Substituiu ~17 checagens `plan !== 'free' && plan !== 'trial'` espalhadas (que teriam que ser lembradas uma a uma ao adicionar o `basico`).
2. **Webhook** — grava o slug do plano pago, com fallback `'pro'` só se o pagamento vier sem valor.
3. **Migração** `20260720110000` — renomeia o slug do Básico (`free` → `basico`) e ensina os triggers `check_lead_limit`/`check_vehicle_limit` a limitar também o `basico`.

Nenhum cliente atual afetado: não há assinante do Básico hoje (2 trials, 1 estrutura-ecv-plus).

## 🔴 A31 — Não existe paywall de expiração (pré-existente)

Descoberto ao validar a A29. `TrialExpired` foi construído (`src/components/TrialExpired.tsx`) e é importado em `UserLayout.tsx`, mas **nunca é renderizado** — não há `<TrialExpired>` em lugar nenhum. Nada bloqueia o acesso quando o trial ou a assinatura vence.

Além disso, o downgrade por falta de pagamento em `profileService.ts:20` só rebaixa `'pro'` expirado para `'free'`. `estrutura-ecv` e `estrutura-ecv-plus` **mantêm acesso ilimitado para sempre** se o pagamento parar.

**Consequência:** hoje um trial expirado continua usando o sistema (limitado, mas sem paywall), e uma assinatura ECV que deixa de ser paga não perde acesso. Para comercializar, o "pague ou perca acesso" precisa ser aplicado.

É decisão de produto (o que a expiração deve fazer — bloquear tudo? só limitar?). Não foi implementado nesta fase. Import de `TrialExpired` mantido como sinal da intenção original.
→ Fase futura + checklist de comercialização.

---

## Diagnóstico original (mantido para histórico)

## 🔴 A29 — Estrutura de planos inconsistente (documentado, NÃO corrigido)

### O que existe no banco

| Plano | Preço | slug |
|---|---|---|
| Plano Básico | R$ 47 | **`free`** |
| Plano Ilimitado | R$ 97 | `pro` |
| Plano Estrutura ECV | R$ 697 | `estrutura-ecv` |
| Plano Estrutura ECV Plus | R$ 997 | `estrutura-ecv-plus` |

### Problema 1 — slug `free` num plano pago
Todo o código trata `plan === 'free'` como o tier gratuito e **limitado** (50 leads, 10 veículos — os triggers da Fase 3). O "Plano Básico" custa R$47 mas tem slug `free`. Se o `profile.plan` de um assinante do Básico for setado para esse slug, ele paga e é tratado como gratuito.

### Problema 2 — webhook achata todos os planos em `pro`
`api/webhook-asaas.ts` valida que o valor pago bate com *algum* preço de plano e então grava `plan: 'pro'` — hardcoded, ignorando qual plano foi comprado. `create-asaas-payment.ts` envia `externalReference: userId` (não o plano), então o webhook nem sabe qual plano ativar.

Consequências:
- R$97 e R$997 ficam idênticos em `profile.plan` (`'pro'`).
- `PlanSettings.tsx:193` (`isCurrent = profile.plan === plan.slug`) nunca destaca o plano real.
- `AdminUsers` mostra badge `'pro'` para todos os pagantes.

### Por que ninguém quebrou ainda
O gating de funcionalidade é **binário** em todo o código: `plan !== 'free' && plan !== 'trial'` = acesso ilimitado. Inclusive o `EstruturaECV.tsx`. Então o `'pro'` hardcoded dá acesso a tudo, e a distinção entre planos pagos não afeta funcionalidade hoje — só a exibição e a integridade do dado.

Estado atual dos perfis: 1 com `estrutura-ecv-plus` (setado por outro caminho, não pelo webhook), 2 em `trial`. Nenhum pagante ativo pelo fluxo do webhook ainda.

### Decisão pendente do dono do projeto
Perguntado em 2026-07-20; o dono dispensou as perguntas para decidir depois. Duas questões em aberto:
1. Os planos pagos dão acesso **diferente** entre si, ou todos liberam o sistema por igual?
2. O "Plano Básico" (R$47) é pago mesmo (slug deve virar `basico`) ou deveria ser o tier gratuito (preço deve virar R$0)?

**A correção depende dessas respostas** e não foi feita. Nenhum código de billing foi alterado nesta fase.

## 🟡 A30 — Sem controle de custo de IA
Não há tabela de registro de consumo de IA por usuário. As funções `api/openai/*` chamam OpenAI (com fallback OpenRouter) sem contabilizar tokens/custo por lojista nem impor limite. Num SaaS, um usuário pode gerar custo desproporcional de IA sem que o sistema perceba.

→ Investigar profundidade e mitigação numa continuação da Fase 7, quando o dono retomar.

## O que já foi verificado e está correto
- **Valor da assinatura vem do banco** (`plan.price`), não do cliente — não dá para forjar preço na criação da cobrança.
- **Webhook valida o valor pago** contra os preços cadastrados antes de ativar (rejeita valores que não correspondem a nenhum plano).
- Idempotência e cobertura de eventos do webhook Asaas: já validadas na Fase 6.
