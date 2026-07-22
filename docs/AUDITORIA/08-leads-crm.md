# Fase 8 — Leads / CRM

> Executada em 2026-07-21. O coração do produto: captura → qualificação → funil → conversão.

## 🟡 A32 — Histórico de funil não era carimbado nas trocas de fase (CORRIGIDO)

`funnelHistory` (mapa fase → timestamp de entrada) só era gravado na **criação** do lead (fase `Novo Lead`, em `Agenda.tsx:311`). Quando o lead **mudava de fase**, o timestamp da nova fase nunca era registrado.

**Impacto:** o lembrete **"Esse lead está em Simulação há X dias, evolua o lead"** (`LeadManager.tsx:376`) lê `funnelHistory[SIMULATION]` — que nunca era preenchido. O nudge **nunca disparava**. Qualquer análise de tempo-em-fase também ficava vazia.

**Correção:** `DataContext.updateLead` passa a carimbar `funnelHistory[novaFase] = agora` (uma vez por fase) quando a fase muda. Todos os handlers de fase do `LeadManager` (visita, simulação, follow-up, desqualificação) vão por `updateLead`, então a correção cobre o caminho.

## O que foi auditado e está correto

### ✅ Atribuição de venda ao lead — por `id`, não por nome
O bug histórico (venda atribuída ao lead errado com nomes homônimos) **já estava corrigido**: `LeadSaleModal.tsx:37` e `Inventory.tsx:412` buscam o lead por `l.id === leadId`. Só restou um comentário histórico documentando o antigo lookup por nome. Nenhuma busca por nome sobrou no fluxo de venda.

### ✅ Kanban de vendas — robusto
`SalesKanban.handleDragEnd` usa `draggableId` (id do lead), trata erro com toast, e quando há mais de uma garantia configurada **pergunta qual aplicar** em vez de escolher a primeira silenciosamente. Persiste via `salesFlowService.moveToNextPhase`.

### ✅ Transições de fase do lead — com tratamento de erro
Os handlers em `LeadManager` (desqualificar, agendar visita, simulação, follow-up) usam `try/catch` com toast e refresh. Registram a mudança e notificam (`notifyLeadPhaseChange`).

### ✅ Entrada de leads (webhook) — validada e resiliente
`api/webhook-leads.ts` exige `name`, `phone`, `user_id`; usa retry (3 tentativas com backoff) para falhas transitórias; e é fail-closed desde o A28. Isolamento de tenant garantido pelo RLS (Fase 3).

### ✅ Interações do lead — atômicas
O histórico de comunicação usa a RPC `append_lead_interaction` (append atômico no servidor), evitando corrida de leitura-modificação-escrita.

## 🟡 Observação (não é bug)

**Sem deduplicação de leads por telefone.** Um mesmo lead que chega por origens diferentes (Facebook, Instagram, WhatsApp) cria registros separados. É decisão de produto — alguns preferem registrar todos os toques, outros preferem mesclar. Fica registrado para o dono decidir se quer merge/aviso de duplicata no futuro.

## Resumo

| Item | Situação |
|---|---|
| Atribuição de venda (homônimos) | ✅ correto (já corrigido) |
| Kanban drag-drop | ✅ robusto |
| Transições de fase | ✅ com tratamento de erro |
| Webhook de leads | ✅ validado + resiliente |
| Interações atômicas | ✅ |
| A32 — funnelHistory nas trocas de fase | 🟡 → ✅ corrigido |
| Dedup de leads por telefone | 🟡 decisão de produto |

---

## Adendo (2026-07-21) — lead único por loja + visibilidade

Regra do dono: um lead é **único dentro da loja**. Se o mesmo telefone volta por outro canal, não recria (já é uma oportunidade). O mesmo telefone em **lojas diferentes** são leads distintos (isolados por RLS).

### 🔴 A33 — Leads do webhook ficariam invisíveis para a empresa (corrigido)
`leadService.list` lista, para a empresa, por `admin_id = dono`. Mas `webhook-leads.ts` gravava só `user_id`, **sem `admin_id`** — então um lead entrando pelo webhook teria `admin_id = null` e **não apareceria** para o dono. Bug latente (os leads atuais são do seed, com `admin_id` preenchido; nenhum lead real de webhook ainda). Corrigido: o webhook resolve o dono da loja e grava `admin_id`.

### Deduplicação por loja (implementada)
- **Migração** `20260721010000`: coluna gerada `phone_normalized` (últimos 11 dígitos, ignora máscara e código 55) + índice `(admin_id, phone_normalized)`.
- **Webhook** (`webhook-leads.ts`): antes de inserir, checa se já existe lead com o mesmo telefone na loja (`admin_id`); se sim, retorna `deduped: true` sem recriar.
- **Criação manual** (`DataContext.addLead` via `leadService.findDuplicateByPhone`): mesma checagem; avisa "já existe um lead com este telefone nesta loja".
  - **Exceção:** venda avulsa (fase `COMPLETED`) não deduplica — registrar o comprador no ato da venda é intenção diferente de captar oportunidade.
- Índice único no banco foi **descartado**: já há telefones repetidos na mesma loja (seed) e seria rígido demais. A dedup é no app, tolerante.
- Resiliência: `findDuplicateByPhone` e o webhook não quebram se a coluna ainda não existir (dedup vira no-op até a migração ser aplicada).

Aplicar: `supabase/scripts/APLICAR-leads-dedup.sql` (migração 21).
