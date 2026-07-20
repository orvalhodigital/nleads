-- ============================================================================
-- Fase 4 — A24: RPC de troca de senha sem verificação de permissão
-- ============================================================================
--
-- PROBLEMA (a falha mais grave encontrada na auditoria)
--
-- A função `admin_update_user_password(uuid, text)` é SECURITY DEFINER — roda
-- com privilégio do dono e escreve direto em `auth.users` — e **não tinha
-- nenhuma verificação de quem está chamando**:
--
--   UPDATE auth.users
--      SET encrypted_password = crypt(new_password, gen_salt('bf'))
--    WHERE id = target_user_id;
--
-- Pior: o ACL era `=X/postgres`, ou seja **PUBLIC podia executar**, incluindo o
-- papel `anon`. A chave anônima vai no bundle JavaScript, então qualquer pessoa
-- na internet podia chamar:
--
--   supabase.rpc('admin_update_user_password', {
--     target_user_id: '<id de qualquer usuário>',
--     new_password: 'outra'
--   })
--
-- E os ids são descobríveis: a política `profiles_select_public_website` expõe
-- `profiles.id` de toda loja com `website_active = true` para leitura anônima.
--
-- Cadeia completa de ataque, sem precisar de conta:
--   1. abrir o site público de uma loja e ler o id do dono
--   2. trocar a senha dele por esta RPC
--   3. entrar na conta
--
-- SOLUÇÃO
-- Verificação de administrador dentro da função, e revogação do PUBLIC/anon.
--
-- A verificação precisa estar DENTRO da função: no Supabase, o schema `public`
-- concede EXECUTE a `anon` e `authenticated` por padrão, então depender só de
-- GRANT é frágil. Foi por isso que `claim_first_admin` e `admin_update_user_plan`
-- continuam seguras mesmo sendo executáveis por qualquer papel — ambas checam
-- internamente.
--
-- Único chamador legítimo: src/admin/AdminUsers.tsx (painel do sistema).
-- Senha de vendedor é trocada pela edge function `invite_user`, que usa
-- service_role e não passa por aqui.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.admin_update_user_password(
  target_user_id uuid,
  new_password   text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem alterar a senha de outro usuario'
      USING ERRCODE = '42501';
  END IF;

  IF new_password IS NULL OR length(new_password) < 8 THEN
    RAISE EXCEPTION 'A senha deve ter ao menos 8 caracteres'
      USING ERRCODE = '22023';
  END IF;

  UPDATE auth.users
     SET encrypted_password = crypt(new_password, gen_salt('bf'))
   WHERE id = target_user_id;

  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_user_password(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_update_user_password(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_update_user_password(uuid, text) TO authenticated;

COMMENT ON FUNCTION public.admin_update_user_password IS
  'Troca a senha de um usuario. Exige administrador (verificado internamente, nao apenas por GRANT). Corrigida na Fase 4 da auditoria — antes qualquer pessoa anonima podia assumir qualquer conta.';
