-- ============================================================================
-- A34 — Vazamento de credenciais/PII de lojistas pela leitura pública do site
-- ============================================================================
-- A política `profiles_select_public_website` liberava, para os papéis `anon` e
-- `authenticated`, o SELECT da LINHA INTEIRA de qualquer perfil com
-- `website_active = true`. Como a chave anônima é pública (vai no bundle do
-- front) e o site fazia `select('*')`, qualquer visitante — ou qualquer lojista
-- logado consultando outro lojista — conseguia ler:
--   meta_access_token, google_ads_developer_token, google_ads_client_id,
--   asaas_customer_id/subscription_id/last_payment_id, email, phone,
--   plan/plan_status/overdue_since/trial_ends_at, role, parent_id,
--   webhook_url, whatsapp_webhook_url.
--
-- Correção: o site público passa a ler uma VIEW (`store_public_profile`) que
-- expõe SOMENTE colunas de apresentação. A política ampla é removida e o `anon`
-- perde o SELECT direto na tabela `profiles`. As políticas públicas de
-- `vehicles`/`motorcycles` referenciavam `profiles` inline (dependiam do acesso
-- do anon à tabela); passam a usar a função SECURITY DEFINER
-- `is_store_website_active()`, que checa o flag sem exigir acesso à tabela.
-- ============================================================================

-- 1) Helper SECURITY DEFINER: responde se a loja tem site ativo, sem exigir que
--    o chamador (anon/authenticated) tenha SELECT em profiles.
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

-- 2) Políticas públicas de vehicles/motorcycles passam a usar a função.
DROP POLICY IF EXISTS "Public can read vehicles for active websites" ON public.vehicles;
CREATE POLICY "Public can read vehicles for active websites"
  ON public.vehicles FOR SELECT
  TO anon, authenticated
  USING (public.is_store_website_active(user_id));

DROP POLICY IF EXISTS "Public can read motorcycles for active websites" ON public.motorcycles;
CREATE POLICY "Public can read motorcycles for active websites"
  ON public.motorcycles FOR SELECT
  TO anon, authenticated
  USING (public.is_store_website_active(user_id));

-- 3) View pública com whitelist de colunas de apresentação (default-deny:
--    coluna nova só aparece se for adicionada aqui de propósito).
--    security_invoker=false (padrão) → roda com privilégios do dono (postgres),
--    que não está sujeito ao RLS de profiles (FORCE RLS está desligado).
DROP VIEW IF EXISTS public.store_public_profile;
CREATE VIEW public.store_public_profile
WITH (security_invoker = false)
AS SELECT
  id,
  company_name,
  company_logo,
  enable_manual_vehicles,
  enable_cars,
  enable_motorcycles,
  preset_messages,
  website_active,
  website_theme,
  website_primary_color,
  website_secondary_color,
  website_text_color,
  website_title_color,
  website_use_gradient,
  website_hero_text,
  website_hero_subtitle,
  website_whatsapp,
  website_cta_text,
  website_slug,
  website_city,
  website_google_maps,
  custom_domain,
  website_hero_image,
  website_background_color,
  website_bg_color2,
  website_bg_gradient,
  business_hours,
  website_about_text,
  website_instagram,
  website_facebook,
  website_youtube,
  website_hero_button_text,
  website_show_sold,
  website_show_filters,
  website_diff1_active,
  website_diff1_title,
  website_diff1_sub,
  website_diff2_active,
  website_diff2_title,
  website_diff2_sub,
  website_diff3_active,
  website_diff3_title,
  website_diff3_sub,
  website_diff4_active,
  website_diff4_title,
  website_diff4_sub,
  website_diff1_icon,
  website_diff2_icon,
  website_diff3_icon,
  website_diff4_icon,
  website_sections,
  website_branding,
  website_optimization,
  website_content,
  website_contact,
  website_typography,
  website_card_style,
  website_hero_images,
  website_video_url,
  website_privacy_policy,
  website_terms_of_use,
  website_business_hours,
  website_tiktok,
  website_diff1_subtitle,
  website_diff2_subtitle,
  website_diff3_subtitle,
  meta_pixel_id
FROM public.profiles
WHERE website_slug IS NOT NULL;

GRANT SELECT ON public.store_public_profile TO anon, authenticated;

-- 4) Remove a política ampla e o acesso do anon à tabela base.
DROP POLICY IF EXISTS profiles_select_public_website ON public.profiles;
REVOKE SELECT ON public.profiles FROM anon;
