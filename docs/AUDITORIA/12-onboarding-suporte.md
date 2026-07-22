# Fase 12 — Onboarding & Suporte (tickets)

> Executada em 2026-07-22. A entrada do novo lojista e o canal de suporte.

## 🟡 A43 — Anexos de suporte eram mundo-legíveis (corrigido)

O bucket de storage `support_attachments` era `public=true`, com a política de storage **"Public read support_attachments"** (SELECT liberado a qualquer um). O `ticketService.uploadAttachment` gravava com nome `Math.random()` e retornava a **URL pública** (`getPublicUrl`), guardada em `ticket_messages.attachments`.

**Impacto:** qualquer pessoa com (ou que adivinhasse) a URL lia o anexo — sem login. Anexos de suporte costumam ser **prints do painel do lojista**, que podem conter dados de clientes/leads. Vazamento de privacidade (LGPD).

**Correção (código + SQL):**
- `uploadAttachment` grava em `tickets/<uid>/<uuid>.<ext>` (`crypto.randomUUID`, escopado por usuário) e retorna o **PATH**, não a URL.
- `getAttachmentUrl` gera **URL assinada** (1h) sob demanda; componente `AttachmentChip` resolve na renderização. Valores http legados passam direto (compat).
- SQL: bucket vira **privado**, leitura só `authenticated` (via URL assinada), upload restrito à pasta do próprio usuário.
- Não havia anexos legados (bucket, tickets e mensagens com anexo = 0), então nada quebra.

**Ordem:** deploy do código **antes** de `APLICAR-support-attachments-private.sql`. URL assinada funciona em bucket público ou privado, então o intervalo entre deploy e SQL é seguro.

Resíduo (baixo): a leitura autenticada não é isolada por ticket — um lojista logado que soubesse o path exato (UUID não-adivinhável) de outro leria. Isolamento por ticket via storage RLS fica como endurecimento futuro; o buraco real (leitura anônima) está fechado.

## O que foi auditado e está correto

### ✅ Isolamento de tickets
- `support_tickets`: usuário cria e vê os **próprios** (`auth.uid() = user_id`); admin vê todos. UPDATE é **só-admin** — e `updateTicketStatus` só é chamado no painel admin, então é consistente (o lojista não altera status; ele cria e conversa).
- `ticket_messages`: enviar/ver mensagem exige `EXISTS(support_tickets WHERE id=ticket_id AND (user_id=auth.uid() OR is_admin))` — participante-do-ticket. Um lojista não lê a conversa de outro.

### ✅ Onboarding
- `onboarding_sessions` tem RLS **só-admin** — e é lido só pelo `AdminOnboarding` (o lojista não acessa a tabela). O registro é criado pelo trigger `handle_new_user_onboarding` (SECURITY DEFINER). Correto: não é fluxo do lojista.
- A conclusão do onboarding pelo lojista grava `profiles.onboarding_completed` na **própria** linha (permitido; não é coluna protegida pelo trigger de privilégio). Funciona.

## 🟢 A44 — Políticas RLS duplicadas em tickets (cleanup)
`support_tickets` e `ticket_messages` têm políticas duplicadas (versões em inglês e português, de duas migrações). São redundantes e `OR`-adas — mesmo efeito, sem falha de segurança. Fica para limpeza (Fase 14).

## 🟢 Correção de doc
O mapa §5 listava `support_attachments` como **tabela** — na verdade é um **bucket de storage**. Corrigido no mapa.

## Resumo

| Item | Situação |
|---|---|
| A43 — anexos de suporte mundo-legíveis | 🟡 → ✅ corrigido (código + SQL a aplicar) |
| Isolamento de tickets (owner/admin) | ✅ correto |
| Onboarding (sessions só-admin, conclusão via profile) | ✅ correto |
| A44 — políticas duplicadas em tickets | 🟢 cleanup (Fase 14) |
| `support_attachments` é bucket, não tabela | 🟢 doc corrigido |
