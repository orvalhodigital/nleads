# Fase 10 — Notificações, WhatsApp & n8n

> Executada em 2026-07-22. A camada de comunicação: sino de notificações in-app, integração WhatsApp/Evolution e os webhooks n8n.

## 🟠 A37 — Qualquer anônimo inseria notificações para qualquer usuário (corrigido via SQL)

A política `System can insert notifications` tinha `WITH CHECK (true)` para `{public}`, e o `anon` tinha GRANT de INSERT. Ou seja, **sem login algum**, só com a chave anônima (que é pública), dava para inserir notificações mirando **qualquer** `user_id`.

**Impacto:** injetar mensagens falsas com cara de "sistema" (ex.: *"Sua assinatura expirou, renove em `<link>`"*) no sino de todos os lojistas — phishing e assédio. **Não é XSS** (o app não usa `dangerouslySetInnerHTML`; o conteúdo é texto escapado pelo React), mas o vetor de engenharia social é real e sem autenticação.

**Correção:** INSERT restrito a `authenticated`; `REVOKE INSERT ... FROM anon`. Todos os fluxos legítimos são autenticados e continuam: troca de fase de lead (`vendedor→empresa`), tickets de suporte (`usuário↔admin`), broadcast do admin. Inserts server-side (`api/` com service_role) ignoram RLS.

## 🟠 A38 — Qualquer anônimo forjava entradas no log de auditoria do admin (corrigido via SQL)

Mesma classe de bug. A política de INSERT em `admin_audit_logs` **se chamava** `Service role can insert audit logs`, mas na prática tinha `WITH CHECK (true)` para `{public}` + GRANT ao `anon`. Qualquer um, sem login, podia **forjar entradas no log de auditoria**: poluir a trilha forense, fabricar ações de admin, incriminar um usuário ou soterrar eventos reais em ruído.

O log era corretamente **append-only** (UPDATE/DELETE = `false`) e de **leitura só para admin** — mas de escrita aberta a todos, o que destrói a confiança na trilha.

**Correção:** INSERT restrito a `authenticated` com `WITH CHECK (admin_id = auth.uid())` — amarra a entrada ao autor real, então nem um autenticado forja em nome de outro admin. `REVOKE INSERT/UPDATE/DELETE/TRUNCATE ... FROM anon`. `auditLogService.logAction` já grava `admin_id = session.user.id`, então nada quebra.

**Aplicar A37+A38:** `supabase/scripts/APLICAR-notifications-insert.sql` (migração `20260722020000`). **Não exige deploy de código** — é só RLS/grant; os fluxos legítimos são autenticados. Conferência: todos os `*_anon_insert=0`, políticas novas=1, antigas=0.

## 🟡 A8 (reafirmado) — Webhooks n8n públicos sem autenticação/rate-limit

Os botões do site público (`BOTAO-tenho-interesse`, `BOTAO-test-drive`, `BOTAO-simular-financiamento`, `BOTAO-troca`) fazem `POST` direto para o n8n, **sem autenticação**. Um bot pode disparar em massa → poluição de leads e **custo/spam de WhatsApp**. A validação por Zod é só no cliente (contornável chamando o webhook direto).

Mitigação é do **lado do n8n** (validação de payload + rate-limit + um segredo compartilhado no header) — não dá para resolver só no repositório. Já está no checklist de comercialização. Nenhum segredo trafega nesses payloads (só nome/telefone do visitante, `store_id`/`vehicle_id`).

## 🟢 A39 — Email do lojista vai na query string ao conectar WhatsApp (menor)

`WhatsAppSettings.handleConnectWhatsApp` abre o webhook do n8n num popup com `email`/`userId` na **URL** (`?email=...`). Query strings entram em logs de servidor/proxy e histórico. É o e-mail do próprio dono, num fluxo que ele iniciou, e o popup precisa de uma URL GET — então fica registrado como item menor de endurecimento (idealmente trocar por um fluxo POST), não corrigido agora.

## O que foi auditado e está correto

- **Isolamento do sino de notificações:** SELECT e UPDATE usam `auth.uid() = user_id`; admin vê todas. Um lojista não lê nem marca como lida a notificação de outro.
- **Tabelas de notificação do admin** (`notification_rules`, `notification_templates`, `broadcast_history`): política `ALL` com checagem de admin (`EXISTS profiles ... admin`). Anônimo e lojista comum são barrados.
- **Log de auditoria:** leitura só admin, e imutável (UPDATE/DELETE = `false`).
- **`puxa-mensagem`** (envio de mensagem ao lead pelo estoque): atrás de autenticação; envia dados do próprio lead da loja, sem segredo.
- **Varredura de classe:** revisei **todas** as tabelas com GRANT de escrita ao `anon` + política para `{public}`. Só `notifications` e `admin_audit_logs` tinham `WITH CHECK (true)`; as demais (`guarantee_configs`, `maintenances`, `phones`, `support_tickets`, `ticket_messages`, etc.) usam `auth.uid() = user_id` ou checagem de admin — o `anon` (sem `auth.uid()`) é rejeitado.

## Resumo

| Item | Situação |
|---|---|
| A37 — anon insere notificação falsa (phishing) | 🟠 → ✅ resolvido e verificado (2026-07-22) |
| A38 — anon forja log de auditoria | 🟠 → ✅ resolvido e verificado (2026-07-22) |
| A8 — webhooks n8n públicos sem auth/rate-limit | 🟡 mitigação no n8n (checklist) |
| A39 — email na query string ao conectar WhatsApp | 🟢 menor, aceito por ora |
| Isolamento do sino / tabelas admin / audit read | ✅ correto |
| Varredura de escrita anônima em todas as tabelas | ✅ só 2 buracos, ambos fechados |
