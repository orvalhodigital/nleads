# Schema Fix Log - 2026-04-09

## Problema
Erro: "Could not find the 'website_background_color' column of 'profiles' in the schema cache"

A aplicação estava tentando acessar a coluna `website_background_color` na tabela `profiles`, mas a coluna não havia sido criada no banco de dados remoto Supabase.

## Causa
O arquivo de migração `sql/add_website_v2_columns.sql` foi criado mas nunca foi executado no banco de dados remoto.

## Solução Implementada

### 1. Identificação do Problema
- Localizou o arquivo de migração: `/sql/add_website_v2_columns.sql`
- Confirmou que a coluna não existia via query com código de erro 42703 (column doesn't exist)

### 2. Execução da Migração
Usando a Management API do Supabase com service role key, executou:

```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS website_background_color  TEXT    DEFAULT '',
  ADD COLUMN IF NOT EXISTS website_bg_color2         TEXT    DEFAULT '',
  ADD COLUMN IF NOT EXISTS website_bg_gradient       BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS business_hours            JSONB   DEFAULT '[]';

NOTIFY pgrst, 'reload schema';
```

### 3. Verificação
Confirmou que todas as colunas foram criadas com sucesso:
- ✓ website_background_color
- ✓ website_bg_color2
- ✓ website_bg_gradient
- ✓ business_hours

### 4. Sincronização
Executou `NOTIFY pgrst, 'reload schema'` para sincronizar o cache de schema do PostgREST API.

## Resultado
✓ Todas as colunas da tabela `profiles` estão sincronizadas
✓ A query em `websiteService.ts` linha 64 agora funciona sem erros
✓ O aplicativo pode acessar `website_background_color` normalmente

## Arquivos Modificados
- `/sql/add_website_v2_columns.sql` (não modificado, apenas executado no banco)

## Próximas Vezes
Para evitar este problema no futuro:
1. Sempre execute migrações SQL no Supabase Dashboard ou via Management API
2. Ou configure migrations automáticas via `supabase db push`
3. Verifique que todas as colunas referenciadas no código existem no banco de dados
