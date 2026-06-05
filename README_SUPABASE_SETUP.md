# 🗄️ Supabase Setup Guide

## Schema SQL para Audit Logs

Arquivo pronto: `schema_audit_logs.sql`

### Como Executar

#### Opção 1: Via Supabase Dashboard (Recomendado)

1. **Abrir SQL Editor**
   - Ir para: https://app.supabase.com/project/[seu-project-id]/sql/new
   - Ou menu lateral: "SQL Editor" → "New Query"

2. **Copiar e Colar SQL**
   - Abrir arquivo: `schema_audit_logs.sql`
   - Copiar TODO o conteúdo
   - Colar na query do Supabase

3. **Executar**
   - Botão "Run" (ou Ctrl+Enter)
   - Deve completar sem erros

4. **Verificar**
   - Ir para "Table Editor"
   - Procurar por `admin_audit_logs`
   - Deve estar lá com 0 linhas (vazia)

#### Opção 2: Via CLI (avançado)

```bash
# Se tem Supabase CLI instalado
supabase db push

# Ou executar manualmente
psql postgres://[user]:[pass]@[host]/postgres < schema_audit_logs.sql
```

---

## ✅ Checklist After Setup

- [ ] Tabela `admin_audit_logs` criada
- [ ] 5 índices criados (verificar em Table Editor)
- [ ] RLS habilitada
- [ ] 4 políticas criadas
- [ ] 0 linhas na tabela (vazia)

---

## 🧪 Teste Rápido

Depois de criar a tabela:

1. **Admin Panel**
   - Ir para `/paineldoadm/users`
   - Deletar um usuário (qualquer um)
   - Deve ver toast de sucesso

2. **Verificar Log**
   - Ir para `/paineldoadm/audit-log`
   - Deve aparecer o log do delete
   - Se não aparecer, verificar console do navegador (F12)

3. **Supabase Console** (opcional)
   - Ir para "Table Editor" → `admin_audit_logs`
   - Deve ter 1+ linhas (o delete que fizemos)

---

## 🚨 Se der erro

### "Table already exists"
- Erro ignorado, tabela já existe
- Limpar (DROP TABLE se necessário) e refazer

### "Permission denied"
- Usar Supabase Key (Project Settings → API Keys → Service Role Key)
- Não usar Anon Key

### "Logs não aparecem em /audit-log"
- Verificar console do navegador (F12) → errors
- Verificar que tabela foi criada em Table Editor

---

## 📋 O que a Tabela Armazena

Cada ação admin cria 1 registro:

```json
{
  "id": "uuid",
  "admin_id": "uuid-do-admin",
  "action": "delete",
  "resource_type": "user",
  "resource_id": "uuid-do-usuario",
  "resource_name": "João Silva",
  "changes": null,
  "ip_address": "192.168.1.1",
  "created_at": "2026-06-04T14:30:00Z"
}
```

---

## 🔍 Queries Úteis

Depois que tabela estiver pronta, no SQL Editor:

```sql
-- Ver últimos 10 logs
SELECT * FROM admin_audit_logs ORDER BY created_at DESC LIMIT 10;

-- Contar logs por tipo de ação
SELECT action, COUNT(*) FROM admin_audit_logs GROUP BY action;

-- Logs de um admin específico
SELECT * FROM admin_audit_logs 
WHERE admin_id = '[uuid-do-admin]'
ORDER BY created_at DESC;

-- Deletions só
SELECT * FROM admin_audit_logs 
WHERE action = 'delete'
ORDER BY created_at DESC;
```

---

## ✨ Fase 4 Completa!

Depois de executar o SQL, Fase 4 (Audit Logging) está 100% pronto.

Próximo passo: Fase 6 (Dashboard com KPIs) ou manutenção/testes.
