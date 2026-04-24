# Arquitetura de Segurança e Dados - n-Leads Veículos

## Modelo de Isolamento (Multitenancy)

Este projeto utiliza o padrão de **Row Level Security (RLS)** do PostgreSQL/Supabase para garantir a segurança e isolamento dos dados dos usuários.

### Como funciona?

Ao invés de criar tabelas separadas para cada usuário (o que tornaria a manutenção impossível e quebraria a tipagem do código), utilizamos tabelas únicas (`leads`, `vehicles`, `profiles`) com políticas de segurança restritivas.

1. **Tabela Única**: Todos os leads de todos os usuários ficam na tabela `public.leads`.
2. **Coluna de Dono**: Cada linha tem uma coluna `user_id` que identifica o dono daquele dado.
3. **Políticas RLS**: O banco de dados intercepta qualquer consulta.
   - Se o usuário João tenta fazer `SELECT * FROM leads`, o banco reescreve a consulta para `SELECT * FROM leads WHERE user_id = 'id_do_joao'`.

### Vantagens desta abordagem

- **Segurança**: A política é aplicada no nível do banco de dados, não importa se o acesso vem do site, do painel ou de uma API.
- **Escalabilidade**: O sistema suporta milhões de usuários sem precisar criar milhões de tabelas.
- **Manutenção**: Adicionar uma nova funcionalidade ou campo (ex: 'Placa do Veículo') é feito uma única vez na tabela principal e todos os usuários recebem a atualização imediatamente.

### Visualização no Painel Admin

No painel de Super Administrador, os nomes de tabelas como `leads_usuario@email.com` são **representações virtuais** do isolamento. Elas indicam que, sob a ótica daquele usuário, é como se ele tivesse uma tabela exclusiva, embora fisicamente todos compartilhem a estrutura otimizada do banco de dados.
