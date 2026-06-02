-- Add funnel goals to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS monthly_leads_goal   integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS monthly_visits_goal  integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS monthly_revenue_goal numeric  DEFAULT NULL;
