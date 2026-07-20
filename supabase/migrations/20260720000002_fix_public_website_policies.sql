-- ============================================================================
-- Fase 3 da auditoria — A15: site público quebrado para usuários autenticados
-- ============================================================================
--
-- PROBLEMA
-- As três políticas que sustentam o site público do lojista estão restritas ao
-- papel `anon`. Quem está logado tem papel `authenticated`, então nenhuma delas
-- se aplica e sobram apenas as políticas de dono.
--
-- Resultado medido (mesma URL, mesma anon key, variando só o Authorization):
--   anônimo               -> retorna a loja e os 31 veículos
--   autenticado não-dono  -> retorna vazio, e a vitrine mostra "Site não encontrado"
--
-- Quem é afetado: lojista logado abrindo a vitrine de outra loja, ou uma
-- demonstração feita com a sessão aberta. NÃO afeta o comprador de veículo,
-- que acessa anonimamente — por isso o achado é 🟠 e não 🔴.
--
-- SOLUÇÃO
-- Incluir o papel `authenticated`. A condição `website_active = true` continua
-- intacta; muda apenas a quem a política se aplica.
--
-- NÃO AMPLIA EXPOSIÇÃO: o papel `anon` é a internet inteira, então essas linhas
-- já são legíveis por qualquer pessoa. A mudança apenas para de penalizar quem
-- está autenticado.
-- ============================================================================

ALTER POLICY "profiles_select_public_website"
  ON public.profiles TO anon, authenticated;

ALTER POLICY "Public can read vehicles for active websites"
  ON public.vehicles TO anon, authenticated;

ALTER POLICY "Public can read motorcycles for active websites"
  ON public.motorcycles TO anon, authenticated;
