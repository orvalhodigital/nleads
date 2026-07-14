# Database & Security Audit Report (Supabase RLS Rules)

Date: 2026-07-10
Status: Draft

---

## 1. Identified Security Vulnerabilities

During the **Phase 3 (Backend & Security Audit)**, I reviewed `SUPABASE_QUERIES_PARA_RODAR.sql`, `schema_audit_logs.sql`, and `SETUP_AUDIT_LOGS.md`. I identified two significant security concerns:

### Impersonation and Log Injection in `admin_audit_logs`
The current RLS policy for inserting audit logs:
```sql
CREATE POLICY "Service role can insert audit logs" ON admin_audit_logs
  FOR INSERT
  WITH CHECK (true);
```
Allows **any user** (including unauthenticated anonymous clients) to insert arbitrary entries into the audit log. Because this is executed client-side via the client-safe Supabase SDK key, a malicious user could flood the table or spoof actions, impersonating admins.

### Public Write/Delete Access to `motivation_quotes`
The policy:
```sql
CREATE POLICY "Permitir leitura/escrita de frases"
ON motivation_quotes FOR ALL USING (true);
```
Allows **public users** to delete, update, or insert any motivational quotes. This is susceptible to complete data wiping or content defacement.

---

## 2. Proposed Hardening & Remediation

We will rewrite and update the database setup scripts with secure RLS policies.

### Secure Audit Logs Insert Policy
```sql
-- Replace the unrestricted INSERT policy with a self-impersonation check
DROP POLICY IF EXISTS "Service role can insert audit logs" ON admin_audit_logs;

CREATE POLICY "Admins can insert audit logs for themselves" ON admin_audit_logs
  FOR INSERT
  WITH CHECK (
    auth.uid() = admin_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### Secure Motivational Quotes Policy
```sql
-- Drop the wide-open select/write policy
DROP POLICY IF EXISTS "Permitir leitura/escrita de frases" ON motivation_quotes;
DROP POLICY IF EXISTS "Permitir leitura para todos os usuários" ON motivation_quotes;

-- 1. Anyone (public) can read quotes
CREATE POLICY "Anyone can read motivational quotes" ON motivation_quotes
  FOR SELECT USING (true);

-- 2. Only authenticated administrators can write/modify quotes
CREATE POLICY "Only admins can modify motivational quotes" ON motivation_quotes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

## 3. Next Steps Selection

Would you like me to update the local SQL schema files (`schema_audit_logs.sql`, `SUPABASE_QUERIES_PARA_RODAR.sql`, and `SETUP_AUDIT_LOGS.md`) with these hardened security rules?

1. **Yes, apply security hardening**: Modify the sql schema and setup files.
2. **Postpone**: Leave security rules as they are and proceed to Phase 4 (Design & UI/UX).
