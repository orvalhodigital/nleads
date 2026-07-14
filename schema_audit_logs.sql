-- ============================================
-- FASE 4: Admin Audit Logs Schema
-- Execute this in Supabase SQL Editor
-- ============================================

-- 1. Create table admin_audit_logs
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

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON admin_audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id ON admin_audit_logs(resource_id);

-- 3. Enable RLS (optional but recommended)
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
-- Policy 1: Admins can read all audit logs
CREATE POLICY "Admins can read all audit logs" ON admin_audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      INNER JOIN profiles p ON u.id = p.id
      WHERE u.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Policy 2: Only authenticated administrators can insert audit logs for themselves
CREATE POLICY "Admins can insert audit logs for themselves" ON admin_audit_logs
  FOR INSERT
  WITH CHECK (
    auth.uid() = admin_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy 3: Prevent updates/deletes to audit logs (immutable)
CREATE POLICY "Prevent audit log modifications" ON admin_audit_logs
  FOR UPDATE
  USING (false);

CREATE POLICY "Prevent audit log deletions" ON admin_audit_logs
  FOR DELETE
  USING (false);

-- ============================================
-- Verification query - run after schema creation
-- ============================================
-- SELECT COUNT(*) as total_logs FROM admin_audit_logs;
-- SELECT * FROM admin_audit_logs ORDER BY created_at DESC LIMIT 10;
