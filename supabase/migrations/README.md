# Migrações do banco

**Este é o único lugar onde mudanças de schema podem ser escritas.**

## Regras

1. **Toda mudança de schema, política RLS, função ou trigger vira um arquivo aqui.** Nada é aplicado à mão no SQL Editor sem existir o arquivo correspondente.
2. **Nome:** `AAAAMMDDHHMMSS_descricao_curta.sql` — 14 dígitos, sempre. Versões repetidas quebram o CLI.
3. **Idempotente sempre que possível:** `IF NOT EXISTS`, `CREATE OR REPLACE`, `DROP POLICY IF EXISTS` antes de `CREATE POLICY`.
4. **Comente o *porquê*, não o *o quê*.** O SQL já diz o que faz; o arquivo precisa dizer qual problema resolve.
5. **Nunca edite uma migração já aplicada.** Crie uma nova que corrija.

## O que NÃO vai aqui

- Scripts de uso único (aplicar, testar, investigar) → `supabase/scripts/`
- Seeds e dados de teste → `supabase/scripts/`
- Consultas de diagnóstico → `supabase/scripts/`

Qualquer arquivo `.sql` nesta pasta é tratado como migração pelo `supabase db push` e **será executado**.

## Fluxo

```sh
# 1. criar a migração
npx supabase migration new nome_da_mudanca

# 2. escrever o SQL no arquivo gerado

# 3. conferir o que seria aplicado
npx supabase migration list --linked

# 4. aplicar
npx supabase db push --linked
```

O token de acesso é lido do ambiente:

```sh
export SUPABASE_ACCESS_TOKEN=$(grep -oP '(?<=^SUPABASE_ACESS_TOKEN=).*' .env.local | tr -d '\r')
```

> 🔴 **Nunca cole o token direto na linha de comando.** Ele fica no histórico do shell e nos logs de ferramentas. Foi assim que o achado A22 aconteceu.

## Estado atual — leia antes de rodar `db push`

O banco de produção **não tem histórico de migrações registrado** (achado A21). As migrações abaixo já estão aplicadas, mas o Postgres não sabe disso — um `db push` sem preparação tentaria rodar tudo de novo.

Antes do primeiro `db push`, é preciso registrar as migrações existentes como já aplicadas:

```sh
npx supabase migration repair --status applied <versao> --linked
```

O script [`supabase/scripts/BASELINE-migracoes.sql`](../scripts/BASELINE-migracoes.sql) faz isso de uma vez, criando a tabela de controle e registrando todas as versões atuais.

**Limitação conhecida:** não existe um dump completo do schema como ponto de partida. Recriar o banco do zero a partir daqui não funciona, porque as primeiras migrações pressupõem estado que veio dos scripts em `supabase/historico/`. Gerar esse baseline exige `supabase db dump`, que depende de Docker — não disponível no ambiente atual. Está no checklist de comercialização em `docs/DECISOES-E-ROADMAP.md`.
