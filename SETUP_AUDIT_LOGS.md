# ⚙️ Setup: Audit Logging (Fase 4)

## Status
- ✅ Backend: auditLogService.ts implementado
- ✅ UI: AdminAuditLog.tsx componente criado
- ✅ Routes: /paineldoadm/audit-log ativa
- ✅ Integration: AdminUsers logging delete + password change
- ⏳ **PENDENTE**: Criar tabela no Supabase

## 🔧 Como Setup

### Step 1: Abrir SQL Editor no Supabase
1. Ir para: https://app.supabase.com/project/[seu-project-id]/sql
2. Ou: "SQL Editor" → "New Query"

### Step 2: Executar este SQL

```sql
-- Criar tabela admin_audit_logs
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'export', 'impersonate'
  resource_type TEXT NOT NULL, -- 'user', 'lead', 'vehicle', 'sale', 'plan'
  resource_id TEXT NOT NULL,
  resource_name TEXT,
  changes JSONB, -- {field: value_antes -> value_depois} ou {field: action_type}
  ip_address INET,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Criar índices para queries rápidas
CREATE INDEX idx_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX idx_audit_logs_resource ON admin_audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created ON admin_audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON admin_audit_logs(action);

-- (Opcional) Row Level Security - apenas admins veem logs
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Política: Apenas admins (role='admin') podem ler todos os logs
CREATE POLICY "Admins can read all audit logs" ON admin_audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      INNER JOIN profiles p ON u.id = p.id
      WHERE u.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Política: Sistema (service role) pode inserir
CREATE POLICY "Service role can insert audit logs" ON admin_audit_logs
  FOR INSERT
  WITH CHECK (true);
```

### Step 3: Verificar
Depois de executar:
1. Ir para "Table Editor"
2. Procurar tabela `admin_audit_logs`
3. Deve estar vazia (pronto para logs)

### Step 4: Testar
1. Ir para `/paineldoadm/users`
2. Deletar um usuário (vai logar a ação)
3. Ir para `/paineldoadm/audit-log`
4. Deve aparecer o log recém criado

---

## 📝 O que é Logado

### Delete User
```json
{
  "admin_id": "uuid-do-admin",
  "action": "delete",
  "resource_type": "user",
  "resource_id": "uuid-do-usuario",
  "resource_name": "João Silva",
  "created_at": "2026-06-04T14:30:00Z"
}
```

### Password Change
```json
{
  "admin_id": "uuid-do-admin",
  "action": "update",
  "resource_type": "user",
  "resource_id": "uuid-do-usuario",
  "resource_name": "João Silva",
  "changes": {
    "field": "password",
    "action": "changed"
  },
  "created_at": "2026-06-04T14:35:00Z"
}
```

### Bulk Delete
Para cada usuário deletado em massa:
```json
{
  "admin_id": "uuid-do-admin",
  "action": "delete",
  "resource_type": "user",
  "resource_id": "uuid-do-usuario-X",
  "resource_name": "User X",
  "created_at": "2026-06-04T14:40:00Z"
}
```

---

## 🔍 Como Consultar Logs

### Todos os logs (últimos 100)
```sql
SELECT * FROM admin_audit_logs ORDER BY created_at DESC LIMIT 100;
```

### Logs de um admin
```sql
SELECT * FROM admin_audit_logs 
WHERE admin_id = '[uuid]' 
ORDER BY created_at DESC;
```

### Logs de um usuário específico (deletado/editado)
```sql
SELECT * FROM admin_audit_logs 
WHERE resource_type = 'user' AND resource_id = '[uuid]'
ORDER BY created_at DESC;
```

### Deletions só
```sql
SELECT * FROM admin_audit_logs 
WHERE action = 'delete' 
ORDER BY created_at DESC;
```

---

## ✅ Fase 4 Completa!
Depois de criar a tabela, a Fase 4 estará 100% funcional.

Qualquer erro ao inserir logs aparecerá no console do navegador.
