# ⚡ Quick Deploy — 30 Minutos

## 🔴 PASSO 1: Supabase Schema (5 min)

**COPIE TODO O TEXTO ABAIXO:**

```sql
-- ============================================
-- FASE 4: Admin Audit Logs Schema
-- Execute this in Subase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'export', 'impersonate')),
  resource_type TEXT NOT NULL CHECK (resource_type IN ('user', 'lead', 'vehicle', 'sale', 'plan')),
  resource_id TEXT NOT NULL,
  resource_name TEXT,
  changes JSONB,
  ip_address INET,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON admin_audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id ON admin_audit_logs(resource_id);

ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read all audit logs" ON admin_audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      INNER JOIN profiles p ON u.id = p.id
      WHERE u.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Service role can insert audit logs" ON admin_audit_logs
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Prevent audit log modifications" ON admin_audit_logs
  FOR UPDATE
  USING (false);

CREATE POLICY "Prevent audit log deletions" ON admin_audit_logs
  FOR DELETE
  USING (false);
```

**AGORA:**
1. Ir para: https://app.supabase.com/project/[seu-project-id]/sql/new
2. Colar o SQL acima
3. Clica "Run" (Ctrl+Enter)
4. ✅ Deve completar SEM ERROS

---

## 🟠 PASSO 2: Build (3 min)

```bash
npm run build
# Aguarde completar (sem erros)
```

---

## 🟡 PASSO 3: Push para Git (2 min)

```bash
git push origin main
# Se Vercel: Deploy automático começa
# Se GitHub Pages: Faz `npm run build && git push origin gh-pages`
# Se custom server: Upload dist/ folder
```

---

## 🟢 PASSO 4: Aguardar Deploy (5-10 min)

```
Se Vercel:
- Vercel auto-deploy começa
- Aguarde "✓ Production Deployment"

Se custom:
- Upload concluído
- Restart do servidor
```

---

## 🔵 PASSO 5: Validar em Produção (5 min)

Abra: `https://[seu-dominio]/paineldoadm`

**Teste:**
1. `/paineldoadm/users` → Deletar usuário → Deve mostrar TOAST
2. `/paineldoadm/audit-log` → Deve aparecer o log do delete
3. Mobile (DevTools Ctrl+Shift+M) → Hamburger funciona?

✅ Tudo OK? **DEPLOY CONCLUÍDO!**

---

## ❌ Se der erro:

### "Table already exists"
- Ignorar, tabela já existe

### "Permission denied"
- Usar **Service Role Key** (não Anon Key)

### "Logs não aparecem"
- Abrir DevTools (F12) → Console → Ver erro
- Verificar que tabela foi criada: Supabase → Table Editor → admin_audit_logs

### Deploy ainda pendente
- Vercel: Check status em Dashboard
- GitHub Actions: Aguardar workflow
- Custom: Verificar logs do servidor

---

## 📊 **Checklist Final**

- [ ] Schema executado no Supabase
- [ ] npm run build sem erros
- [ ] git push feito
- [ ] Deploy concluído
- [ ] Production testado
- [ ] Tudo funcionando ✅

**Tempo total: ~30 min**

---

## 🚀 Pronto!

Admin Panel v2 está **LIVE EM PRODUÇÃO!**

Próximo: Monitorar 24h, depois planejar Fase 7.
