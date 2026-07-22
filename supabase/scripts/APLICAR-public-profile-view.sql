-- ============================================================================
-- APLICAR: A34 — fecha o vazamento de credenciais/PII pelo site público.
-- Cole TODO este bloco no SQL Editor do Supabase e rode.
-- É idempotente: pode rodar mais de uma vez sem efeito colateral.
-- ============================================================================

-- 1) Helper SECURITY DEFINER (checa site ativo sem exigir acesso a profiles).
CREATE OR REPLACE FUNCTION public.is_store_website_active(store_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE((SELECT website_active FROM public.profiles WHERE id = store_id), false);
$$;

REVOKE ALL ON FUNCTION public.is_store_website_active(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.is_store_website_active(uuid) TO anon, authenticated;

-- 2) Políticas públicas de vehicles/motorcycles via função.
DROP POLICY IF EXISTS "Public can read vehicles for active websites" ON public.vehicles;
CREATE POLICY "Public can read vehicles for active websites"
  ON public.vehicles FOR SELECT TO anon, authenticated
  USING (public.is_store_website_active(user_id));

DROP POLICY IF EXISTS "Public can read motorcycles for active websites" ON public.motorcycles;
CREATE POLICY "Public can read motorcycles for active websites"
  ON public.motorcycles FOR SELECT TO anon, authenticated
  USING (public.is_store_website_active(user_id));

-- 3) View pública (whitelist de colunas de apresentação).
DROP VIEW IF EXISTS public.store_public_profile;
CREATE VIEW public.store_public_profile
WITH (security_invoker = false)
AS SELECT
  id, company_name, company_logo, enable_manual_vehicles, enable_cars,
  enable_motorcycles, preset_messages, website_active, website_theme,
  website_primary_color, website_secondary_color, website_text_color,
  website_title_color, website_use_gradient, website_hero_text,
  website_hero_subtitle, website_whatsapp, website_cta_text, website_slug,
  website_city, website_google_maps, custom_domain, website_hero_image,
  website_background_color, website_bg_color2, website_bg_gradient,
  business_hours, website_about_text, website_instagram, website_facebook,
  website_youtube, website_hero_button_text, website_show_sold,
  website_show_filters, website_diff1_active, website_diff1_title,
  website_diff1_sub, website_diff2_active, website_diff2_title, website_diff2_sub,
  website_diff3_active, website_diff3_title, website_diff3_sub,
  website_diff4_active, website_diff4_title, website_diff4_sub, website_diff1_icon,
  website_diff2_icon, website_diff3_icon, website_diff4_icon, website_sections,
  website_branding, website_optimization, website_content, website_contact,
  website_typography, website_card_style, website_hero_images, website_video_url,
  website_privacy_policy, website_terms_of_use, website_business_hours,
  website_tiktok, website_diff1_subtitle, website_diff2_subtitle,
  website_diff3_subtitle, meta_pixel_id
FROM public.profiles
WHERE website_slug IS NOT NULL;

GRANT SELECT ON public.store_public_profile TO anon, authenticated;

-- 4) Remove a política ampla e o SELECT direto do anon em profiles.
DROP POLICY IF EXISTS profiles_select_public_website ON public.profiles;
REVOKE SELECT ON public.profiles FROM anon;

-- 5) Registro da migração.
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20260722010000', 'public_profile_view')
ON CONFLICT (version) DO NOTHING;


-- ============================================================================
-- CONFERÊNCIA — esperado:
--   anon_select_profiles_removido = 0   (anon NÃO tem mais SELECT na tabela)
--   politica_ampla_removida       = 0   (a política vazadora não existe mais)
--   view_publica_existe           = 1
--   anon_pode_ler_view            = 1
--   funcao_site_ativo             = 1
--   view_expoe_segredo            = 0   (nenhuma coluna sensível na view)
--   esta_migracao_registrada      = 1   (a 20260722010000 foi registrada)
-- ============================================================================
SELECT 'anon_select_profiles_removido' AS verificacao,
       count(*)::text AS resultado
  FROM information_schema.role_table_grants
 WHERE table_schema='public' AND table_name='profiles'
   AND grantee='anon' AND privilege_type='SELECT'
UNION ALL
SELECT 'politica_ampla_removida', count(*)::text
  FROM pg_policies
 WHERE schemaname='public' AND tablename='profiles'
   AND policyname='profiles_select_public_website'
UNION ALL
SELECT 'view_publica_existe', count(*)::text
  FROM information_schema.views
 WHERE table_schema='public' AND table_name='store_public_profile'
UNION ALL
SELECT 'anon_pode_ler_view', count(*)::text
  FROM information_schema.role_table_grants
 WHERE table_schema='public' AND table_name='store_public_profile'
   AND grantee='anon' AND privilege_type='SELECT'
UNION ALL
SELECT 'funcao_site_ativo', count(*)::text
  FROM pg_proc WHERE proname='is_store_website_active'
UNION ALL
SELECT 'view_expoe_segredo', count(*)::text
  FROM information_schema.columns
 WHERE table_schema='public' AND table_name='store_public_profile'
   AND column_name IN ('meta_access_token','google_ads_developer_token',
                       'asaas_customer_id','email','phone','plan_status',
                       'overdue_since','whatsapp_webhook_url','webhook_url','role')
UNION ALL
SELECT 'esta_migracao_registrada', count(*)::text
  FROM supabase_migrations.schema_migrations
 WHERE version='20260722010000';
