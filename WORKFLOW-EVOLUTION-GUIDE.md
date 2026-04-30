# Workflow n8n - Lead WhatsApp via Evolution API

## 📋 Visão Geral

Este workflow recebe dados de um formulário do site, valida os dados e envia uma mensagem automática via WhatsApp utilizando a Evolution API.

## 🔄 Fluxo do Workflow

```
Webhook → Processar Dados → Validar Telefone → Enviar WhatsApp
                                              ↓
                                        (Sucesso/Erro)
```

## 🎯 Nodes

### 1. **Webhook - Formulário**
- **Função**: Recebe os dados POST do formulário do site
- **Endpoint**: `POST /lead-webhook`
- **Método**: Responde imediatamente (antes de processar)

### 2. **Processar Dados**
- **Função**: Transforma e enriquece os dados recebidos
- **Operações**:
  - Gera UUID único para o lead
  - Normaliza todos os campos
  - Remove caracteres especiais do telefone
  - Define a instância Evolution pelo email do usuário
  - Adiciona timestamp

### 3. **Validar Telefone**
- **Função**: IF statement que verifica se o telefone é válido
- **Condição**: `telefone !== null && telefone !== ""`
- **Saída Verdadeira**: Envia WhatsApp
- **Saída Falsa**: Envia mensagem de erro

### 4. **Enviar WhatsApp via Evolution** ✅
- **Função**: Envia mensagem de confirmação via WhatsApp
- **URL**: `http://localhost:3000/message/sendText/{instancia}`
- **Autenticação**: Bearer Token (configure no n8n)
- **Retry**: 3 tentativas com 2s de intervalo
- **Dados Enviados**:
  - `number`: Telefone formatado
  - `text`: Mensagem com dados do lead

### 5. **Erro - Telefone Inválido** ❌
- **Função**: Envia mensagem de erro se telefone for inválido
- **Mensagem**: Avisa sobre número inválido

### 6. **Resposta Sucesso/Erro**
- **Função**: Retorna status final para logging/análise

---

## 📤 Exemplo de Payload do Formulário

```json
{
  "name": "João Silva",
  "email": "joao@example.com",
  "phone": "(21) 99999-8888",
  "subject": "Consulta sobre veículos",
  "message": "Gostaria de saber sobre os modelos disponíveis",
  "userEmail": "admin@nleads.com.br"
}
```

## 📨 Dados Processados Internamente

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "nomeCompleto": "João Silva",
  "email": "joao@example.com",
  "telefone": "(21) 99999-8888",
  "assunto": "Consulta sobre veículos",
  "mensagem": "Gostaria de saber sobre os modelos disponíveis",
  "empresaUsuario": "admin@nleads.com.br",
  "instanciaEvolution": "admin@nleads.com.br",
  "dataRecebimento": "2026-04-09T10:30:45.123Z",
  "validado": true,
  "numeroFormatado": "21999998888"
}
```

## 🤖 Exemplo de Mensagem WhatsApp Enviada

```
Olá João Silva,

Recebemos seu contato com sucesso!

📋 *Detalhes da sua solicitação:*
Nome: João Silva
Email: joao@example.com
Assunto: Consulta sobre veículos

Em breve um de nossos especialistas entrará em contato.

Atenciosamente,
Equipe admin@nleads.com.br
```

---

## 🔐 Configuração da Evolution API

### 1. **URL Base**
- Padrão: `http://localhost:3000`
- Adapte para seu servidor Evolution

### 2. **Instância**
- Identificada pelo **email do usuário** (`userEmail`)
- Exemplo: `admin@nleads.com.br`

### 3. **Bearer Token**
No n8n, configure a credencial:
- Vá em **Credentials** → **New**
- Tipo: **Generic Credential Type**
- **Generic Auth Type**: Bearer Token
- **Token**: Sua chave da Evolution API

### 4. **Endpoint da API**
- **Método**: POST
- **Rota**: `/message/sendText/{instancia}`
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
  "number": "21999998888",
  "text": "Sua mensagem aqui"
}
```

---

## ⚙️ Como Configurar no n8n

### Importar o Workflow

1. Abra o n8n (`http://localhost:5678`)
2. Vá em **Workflows** → **New**
3. Clique em **Menu** → **Import from File**
4. Selecione o arquivo `n8n-workflow-lead-whatsapp.json`

### Configurar Credenciais

1. Clique no node **"Enviar WhatsApp via Evolution"**
2. Em **Authentication**, selecione ou crie credencial Bearer Token
3. Insira seu token da Evolution API

### Testar o Webhook

```bash
curl -X POST http://localhost:5678/webhook/lead-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste Silva",
    "email": "teste@example.com",
    "phone": "(21) 99999-8888",
    "subject": "Teste",
    "message": "Mensagem de teste",
    "userEmail": "admin@nleads.com.br"
  }'
```

---

## 🛡️ Tratamento de Erros

### Validação de Telefone
- Se vazio ou null → Envia erro via WhatsApp
- O workflow continua sem parar

### Retry Automático
- Se a Evolution API falhar, tenta 3 vezes
- Aguarda 2 segundos entre tentativas

### Logging
- Todos os leads são registrados no histórico do n8n
- Acesse **Executions** para ver detalhes completos

---

## 📌 Variáveis de Ambiente (Opcional)

Se usar Docker, passe as variáveis:

```bash
docker run -e EVOLUTION_API_URL=http://api:3000 \
           -e EVOLUTION_TOKEN=seu_token \
           -p 5678:5678 \
           docker.n8n.io/n8nio/n8n
```

---

## 🔗 Integração com Seu Site

### Frontend (Exemplo com Fetch)

```javascript
async function enviarFormulario(dados) {
  const response = await fetch('http://seu-n8n.com/webhook/lead-webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: dados.nome,
      email: dados.email,
      phone: dados.telefone,
      subject: dados.assunto,
      message: dados.mensagem,
      userEmail: 'admin@nleads.com.br' // Email do responsável pelo site
    })
  });
  
  const resultado = await response.json();
  console.log('Lead enviado:', resultado);
}
```

---

## ✅ Checklist de Implementação

- [x] Arquivo JSON importado no n8n (Estrutura validada em `src/types.ts`)
- [ ] Credencial Bearer Token configurada no n8n
- [ ] URL da Evolution API configurada no `.env` do n8n
- [ ] Teste manual com curl realizado (Veja seção de Exemplos)
- [ ] Webhook testado via formulário do site (Integração Gemini ativa)
- [ ] Mensagem WhatsApp recebida com sucesso no celular
- [ ] Workflow ativado para produção no n8n

---

## 🐛 Troubleshooting

| Problema | Solução |
|----------|---------|
| Webhook não recebe dados | Verifique URL correta do n8n no formulário |
| Erro 401 Evolution API | Confirme Bearer Token na credencial |
| Telefone não formatado | O campo phone pode estar vazio |
| Mensagem não chega | Verifique se instância Evolution está ativa |
| Webhook 404 | Ative o workflow após importar |

---

## 📞 Suporte

Para dúvidas sobre a Evolution API, consulte:
- [Evolution API Docs](https://evolution-api.com)
- [n8n Webhook Reference](https://docs.n8n.io/nodes/n8n-nodes-base.webhook/)
