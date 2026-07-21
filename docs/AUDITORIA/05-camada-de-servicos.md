# Fase 5 — Camada de Serviços

> Executada em 2026-07-20. Auditoria dos 13 services em `src/services/` (2.408 linhas).

## Veredito: camada saudável

Ao contrário das fases 2–4, esta não encontrou falha crítica. Os services funcionam, respeitam o isolamento de tenant (via RLS, validado na Fase 3) e não têm gargalos de performance óbvios.

## O que foi verificado

### ✅ Sem consultas N+1
Nenhum `await` dentro de `map`/`forEach`/`for` sobre resultado de query. Os únicos usos de `Promise.all` (`planService`, `salesFlowService`) são paralelização correta de queries independentes. O único `for` (`profileService`) itera um array em memória.

### ✅ Isolamento de tenant apoiado no RLS
Os services não repetem `.eq('user_id', ...)` em toda query — confiam no RLS, que é a barreira real e foi validado na Fase 3. `leadService.list` aceita `userId`/`adminId` explícitos para filtrar a visão (empresa vê a equipe, vendedor vê a loja-mãe), coerente com as funções `is_empresa_of`/`is_vendedor_of`.

### ✅ Fallback de IA no lugar certo
`openaiService` (cliente) é um wrapper fino que chama `/api/openai/*`. O fallback OpenAI→OpenRouter é **server-side**, nas funções serverless — arquitetura correta, o cliente nunca vê as chaves.

### ✅ `handleSupabaseResponse` é robusto
Faz `throw` no erro (não engole), e ainda detecta JWT expirado (`PGRST301`) forçando logoff e redirect para `/login`. Boa peça central.

### ✅ Catches "silenciosos" são intencionais
- `auditLogService` loga-e-continua: falha de auditoria não deve bloquear a ação do usuário. Correto.
- `vehicleService`/`motorcycleService` engolem erro na **limpeza de imagens do storage**: é best-effort, não deve travar a exclusão do veículo. Correto.
- `response.json().catch(() => ({}))` em `openaiService`/`planService`: proteção contra corpo de erro não-JSON. Correto.

## 🟡 A26 — Três padrões de tratamento de erro convivendo

| Padrão | Services |
|---|---|
| `handleSupabaseResponse(...)` | lead, vehicle, motorcycle, profile, website |
| `if (error) throw error` manual | salesFlow, notification, ticket, guarantee, auditLog |
| Mistura dos dois | profile |

Não é bug — todos tratam o erro de alguma forma. Mas a inconsistência aumenta o custo de manutenção e o risco de alguém, no futuro, esquecer o `if (error)` num service que usa o padrão manual (o `handleSupabaseResponse` torna isso impossível, porque o throw é embutido).

**Recomendação:** padronizar em `handleSupabaseResponse` para todas as leituras/escritas Supabase. É a opção mais segura (throw embutido) e já cobre JWT expirado.

**Por que não fiz agora:** tocar nos 13 services de uma vez é um diff grande e arriscado dentro de uma fase de auditoria, sem cobertura de testes para garantir que nada regrediu. Fica para a **Fase 14** (refatoração), idealmente **depois** da Fase 15 (testes), para haver rede de segurança.

## 🟠 A1 — Acesso a dados fora da camada de serviços (quantificado)

Confirmado e medido: **44 escritas diretas** (`insert`/`update`/`delete`/`upsert`) em componentes/páginas/telas admin, sem passar pelos services.

Por tabela: `onboarding_sessions` (7), `notification_rules` (4), `motivation_quotes` (4), `lead_communications` (3), `campaigns` (3), `vehicles` (2), `profiles` (2), `notifications` (2), `broadcast_history` (2), `system_settings` (1), `plans` (1), `notification_templates` (1), `leads` (1).

**Risco de isolamento: baixo.** As escritas em tabelas sensíveis (`profiles`, `plans`) estão todas em telas admin (`AdminUsers`, `AdminPlans`) e são barradas pelas políticas de admin no RLS. Nenhuma permite cruzar a fronteira de tenant — o RLS não deixa.

**Custo real:** validação e regra de negócio ficam espalhadas e inconsistentes. Ex.: o limite de plano existe no `planService` mas as telas que inserem direto não o consultam — foi só a Fase 3 (triggers no banco) que fechou isso de verdade.

→ Refatoração na **Fase 14**. Muitas dessas tabelas (`onboarding_sessions`, `notification_*`, `campaigns`, `motivation_quotes`) **nem têm service** — a Fase 14 precisará criar `notificationRulesService`, `campaignService` etc. antes de migrar as chamadas.

## Resumo

| Item | Situação |
|---|---|
| N+1 | ✅ nenhum |
| Isolamento de tenant | ✅ via RLS |
| Fallback de IA | ✅ server-side |
| Tratamento de erro central | ✅ robusto |
| A26 — 3 padrões de erro | 🟡 padronizar na Fase 14 |
| A1 — 44 escritas fora dos services | 🟠 refatorar na Fase 14 |
