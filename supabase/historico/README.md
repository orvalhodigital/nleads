# Histórico de SQL — não execute nada daqui

Estes arquivos são o registro de como o banco foi construído **antes** de existir controle de migrações. Estão aqui só para consulta histórica.

> ⚠️ **Nenhum script desta pasta deve ser executado.** Todos os efeitos já estão no banco de produção. Rodar de novo, no melhor caso, não faz nada; no pior, sobrescreve dados.

## O que tem aqui

| Origem | Qtd | O que era |
|---|---|---|
| `sql/` (antiga raiz do projeto) | 35 | Scripts ad-hoc sem ordenação — `fix_rls_recursion.sql`, `fix_admin_lockout.sql`, `_check_fase1*.sql`… |
| Raiz do repositório | 8 | `add_troca_data_column.sql`, `schema_audit_logs.sql`, `supabase_migration.sql`… |

Verificado em 2026-07-20: os objetos que esses scripts criam (`leads.troca_data`, `leads.interesse_caminhao`, `leads.interesse_carro`, `motorcycles.brake_type`, tabela `admin_audit_logs`) **já existem no banco**.

## Por que foram arquivados

Havia três lugares diferentes com SQL — `supabase/migrations/`, `sql/` e a raiz — sem nenhuma indicação de qual valia, o que já tinha rodado e em que ordem. O schema não era reproduzível.

Isso não era um problema teórico. Em 2026-07-17 a migração `add_asaas_subscription_fields` foi criada em `supabase/migrations/` e **nunca aplicada**. O webhook do Asaas passou a gravar colunas inexistentes e falhava em silêncio: o cliente pagava e o plano não era ativado. Ninguém percebeu por três dias, até a auditoria (achado A20).

## Como fica daqui pra frente

Só existe um lugar: **`supabase/migrations/`**. Ver [o guia lá](../migrations/README.md).

Scripts operacionais de uso único (aplicar correção, testar algo) vão para `supabase/scripts/` e **não** são migrações.
