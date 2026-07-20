-- 1. Cria função para gerar slug (URL amigável) a partir do nome
CREATE OR REPLACE FUNCTION public.slugify(value TEXT)
RETURNS TEXT AS $$
  WITH unaccented AS (
    SELECT translate(lower(value), 'áàâãäåāăąèééêëēĕėęěìíîïĩīĭįıòóôõöøōŏőùúûüũūŭůűųýÿŷñç', 'aaaaaaaaaeeeeeeeeeeiiiiiiiiiooooooooouuuuuuuuuuyyync') AS val
  )
  SELECT trim(both '-' from regexp_replace(
           regexp_replace(val, '[^a-z0-9]+', '-', 'gi'),
           '\-+', '-', 'gi'
         ))
  FROM unaccented;
$$ LANGUAGE SQL IMMUTABLE STRICT;

-- 2. Atualiza o gatilho para incluir o website_slug
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_company_name TEXT;
  v_slug TEXT;
  v_base_slug TEXT;
  v_counter INT := 1;
BEGIN
  v_company_name := COALESCE(NULLIF(NEW.raw_user_meta_data->>'company_name', ''), '');
  v_base_slug := public.slugify(v_company_name);
  v_slug := v_base_slug;

  -- Garante que o slug é único
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE website_slug = v_slug) LOOP
    v_slug := v_base_slug || '-' || v_counter;
    v_counter := v_counter + 1;
  END LOOP;

  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    company_name, 
    plan, 
    plan_status, 
    trial_ends_at,
    website_slug
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), NEW.raw_user_meta_data->>'name', ''),
    v_company_name,
    'trial',
    'active',
    NOW() + INTERVAL '7 days',
    v_slug
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Preenche o slug para contas existentes que estão sem
DO $$
DECLARE
  r RECORD;
  v_slug TEXT;
  v_base_slug TEXT;
  v_counter INT;
BEGIN
  FOR r IN SELECT id, company_name FROM public.profiles WHERE website_slug IS NULL OR website_slug = '' LOOP
    IF r.company_name IS NOT NULL AND r.company_name <> '' THEN
      v_base_slug := public.slugify(r.company_name);
      v_slug := v_base_slug;
      v_counter := 1;

      WHILE EXISTS (SELECT 1 FROM public.profiles WHERE website_slug = v_slug AND id <> r.id) LOOP
        v_slug := v_base_slug || '-' || v_counter;
        v_counter := v_counter + 1;
      END LOOP;

      UPDATE public.profiles SET website_slug = v_slug WHERE id = r.id;
    END IF;
  END LOOP;
END $$;
