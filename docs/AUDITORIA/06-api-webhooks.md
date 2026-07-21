# Fase 6 — API Serverless & Webhooks

> Executada em 2026-07-20. As 11 funções em `api/` + a fronteira n8n.

## 🔴 A28 — Webhook de leads falhava aberto (CORRIGIDO)

`api/webhook-leads.ts` validava o header `x-webhook-token` contra `WEBHOOK_SECRET` **apenas se a env var existisse**. Sem ela, aceitava qualquer requisição:

```js
if (!webhookSecret) {
  console.warn('... ACEITANDO requisições não autenticadas');
} else { /* valida */ }
```

**Risco:** o endpoint injeta leads em qualquer loja a partir de um `user_id` no corpo. E `user_id` é descobrível — a política `profiles_select_public_website` expõe `profiles.id` de qualquer loja ativa. Com o secret ausente, qualquer um floda o CRM de qualquer lojista.

**Exposição atual: baixa.** Verifiquei via API da Vercel que `WEBHOOK_SECRET` **está configurado em produção** — então hoje o token é exigido. O problema era o *padrão*: um ambiente novo, ou o secret removido por engano, abriria o endpoint em silêncio.

**Correção:** fail-closed, igual ao webhook-asaas. Sem a env var, rejeita (500). Como o chamador (n8n) já envia o token em produção, o caminho atual não é afetado.

## O que está bem feito

### ✅ Webhook do Asaas — exemplar
`api/webhook-asaas.ts`:
- **Token fail-closed:** exige `asaas-access-token` = `ASAAS_WEBHOOK_TOKEN`; sem a env var, rejeita.
- **Idempotência:** checa `profile.last_asaas_payment_id === payment.id` e ignora eventos repetidos — o Asaas reenvia, e sem isso o plano seria estendido em duplicidade a cada reenvio.
- **Cobertura de eventos:** `PAYMENT_RECEIVED`/`PAYMENT_CONFIRMED` (ativa), `PAYMENT_OVERDUE` (marca em atraso), `PAYMENT_DELETED`/`PAYMENT_REFUNDED`/`SUBSCRIPTION_DELETED` (revoga).

### ✅ Funções internas autenticadas
`consulta-placa`, `create-asaas-payment`, `get-asaas-billing-portal`, `register-custom-domain`, `remove-custom-domain` validam o chamador por `getVerifiedUserId` (Bearer token → `auth.getUser`). Todas checam `req.method`.

### ✅ Sem segredo no cliente
As chamadas ao n8n a partir do frontend enviam apenas dados de lead/veículo — nenhum token, chave ou segredo nos headers.

## 🟡 A8 — Frontend chama n8n diretamente (aceito, com ressalva)

Os webhooks de WhatsApp (`webhook.orvalhodigital.com.br/webhook/BOTAO-*`, `puxa-mensagem`, etc.) são chamados direto do navegador — inclusive de **páginas públicas** (`PublicVehicleDetail`: botões "tenho interesse", "test-drive"). São, portanto, endpoints públicos: qualquer um pode POSTar para disparar um fluxo de WhatsApp.

**Por que não é corrigível só neste repositório:** mover para o lado servidor exigiria um proxy serverless para cada botão, e a segurança real desses endpoints é responsabilidade do **n8n**. Nenhum segredo vaza no caminho atual.

**Recomendação (checklist de comercialização):** validação e rate-limiting no lado do n8n, para evitar abuso (spam de mensagens de WhatsApp disparado por bots contra a loja). Não bloqueia o lançamento, mas deve ser endereçado.

## Resumo

| Item | Situação |
|---|---|
| Webhook Asaas (token, idempotência, eventos) | ✅ exemplar |
| Webhook leads fail-open | 🔴 → ✅ corrigido (A28) |
| Funções internas autenticadas | ✅ |
| Segredo no cliente | ✅ nenhum |
| A8 — n8n direto do front | 🟡 aceito; rate-limit no n8n → checklist |
