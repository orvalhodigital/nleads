-- Create guarantee_configs table for multi-tenant warranty configurations
CREATE TABLE guarantee_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('7dias', '90dias', '180dias', '1ano', 'custom')),
  name TEXT NOT NULL,
  days_warranty INT NOT NULL CHECK (days_warranty > 0),
  description TEXT,
  conditions JSONB DEFAULT NULL, -- { refundPolicy: string, returnDays: int, notes?: string }
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, type)
);

-- Index for quick lookup by user
CREATE INDEX idx_guarantee_configs_user_id ON guarantee_configs(user_id);
CREATE INDEX idx_guarantee_configs_active ON guarantee_configs(user_id, is_active);

-- Add sales flow columns to leads table
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS sale_status TEXT DEFAULT NULL CHECK (sale_status IS NULL OR sale_status IN ('documentacao', 'entrega', 'em_garantia', 'apos_garantia')),
  ADD COLUMN IF NOT EXISTS sale_date TIMESTAMP DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS delivery_date TIMESTAMP DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS guarantee_id UUID DEFAULT NULL REFERENCES guarantee_configs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS guarantee_ends_at TIMESTAMP DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS post_sale_notes TEXT DEFAULT NULL;

-- Index for sales flow queries
CREATE INDEX idx_leads_sale_status ON leads(user_id, sale_status);
CREATE INDEX idx_leads_guarantee_ends_at ON leads(user_id, guarantee_ends_at);

-- RLS policies for guarantee_configs
ALTER TABLE guarantee_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own guarantee configs"
  ON guarantee_configs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own guarantee configs"
  ON guarantee_configs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own guarantee configs"
  ON guarantee_configs
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own guarantee configs"
  ON guarantee_configs
  FOR DELETE
  USING (auth.uid() = user_id);
