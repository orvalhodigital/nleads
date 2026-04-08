# Documentação da Integração via Webhook

Esta funcionalidade permite importar leads automaticamente de fontes externas (Facebook Ads, Google Ads, formulários externos, etc.) para o sistema n-Leads Veículos.

## URL do Endpoint

Após o deploy no Vercel, sua URL de webhook será:

```
https://<SEU-DOMINIO-VERCEL>/api/webhook-leads
```

Exemplo: `https://n-leads-veiculos.vercel.app/api/webhook-leads`

## Método HTTP

**POST**

## Headers Necessários

`Content-Type: application/json`

## Corpo da Requisição (JSON Payload)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `name` | String | **Sim** | Nome completo do lead |
| `phone` | String | **Sim** | Telefone de contato (WhatsApp) |
| `email` | String | Não | Email do lead |
| `source` | String | Não | Origem do lead (ex: "Facebook Ads", "Site"). Padrão: "Webhook" |
| `temperature` | String | Não | Temperatura inicial ("Quente", "Morna", "Fria"). Padrão: "Fria" |
| `notes` | String | Não | Observações iniciais |

### Exemplo de JSON

```json
{
  "name": "João Silva",
  "phone": "11999998888",
  "email": "joao.silva@teste.com",
  "source": "Facebook Ads",
  "notes": "Interessado no SUV Branco"
}
```

## Resposta de Sucesso (200 OK)

```json
{
  "success": true,
  "message": "Lead imported successfully",
  "data": {
    "id": "uuid-gerado",
    "name": "João Silva",
    ...
  }
}
```

## ⚠️ Configuração Importante (Variáveis de Ambiente) IIMPORTANTE

Para que o webhook funcione corretamente e consiga inserir leads mesmo sem um usuário logado, você **PRECISA** configurar a chave de serviço (Service Role Key) nas variáveis de ambiente do Vercel.

No painel da Vercel (Project Settings > Environment Variables), adicione:

1. `VITE_SUPABASE_URL`: Sua URL do Supabase.
2. `SUPABASE_SERVICE_ROLE_KEY`: Sua chave `service_role` (NÃO é a `anon` key). Você a encontra no Dashboard do Supabase > Settings > API.

> **Atenção**: Nunca exponha a `SUPABASE_SERVICE_ROLE_KEY` no frontend (arquivos que começam com `VITE_`). Ela deve ser usada apenas no backend (servidor/api).

## Solução de Problemas (Troubleshooting)

### 1. Erro "Permission Denied" ou Código 42501
Isso significa que o banco de dados bloqueou a inserção devido às regras de segurança (RLS).
*   **Causa**: O webhook está tentando usar a chave `ANON` ou não encontrou a chave `SERVICE_ROLE`.
*   **Solução**: Adicione a `SUPABASE_SERVICE_ROLE_KEY` nas variáveis de ambiente da Vercel.

### 2. Endpoint retorna 404 Localmente
*   **Causa**: Você está rodando `npm run dev` (Vite). O Vite não processa funções de servidor (`/api`).
*   **Solução**: Para testar localmente, use o comando da Vercel:
    ```bash
    npx vercel dev
    ```
    Isso iniciará um servidor local que suporta tanto o frontend quanto as API Functions.

### 3. Teste via Script
Criei um script `test-webhook.js` na raiz do projeto. Você pode usá-lo para testar a conexão diretamente:
1. Certifique-se de que o arquivo `.env.local` tem `VITE_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`.
2. Rode `node test-webhook.js`.
