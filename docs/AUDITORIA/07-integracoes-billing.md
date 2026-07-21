# Fase 7 — Integrações Externas & Billing

> Iniciada em 2026-07-20. **Em pausa** — o achado principal (A29) depende de decisão de modelo de negócio do dono do projeto. Nenhum código de billing foi alterado.

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
