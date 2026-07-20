-- RLS Policies criadas
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles','leads','vehicles','motorcycles','invitations')
ORDER BY tablename, policyname;
