# Logo Otimizza - Status de Implementação

## 📋 Resumo

A logo Otimizza está agora **salva localmente** e **integrada no sistema**.

---

## 🎨 Assets Disponíveis

```
src/assets/branding/
├── logos/
│   ├── otimizza-logo-amarelo-h.png  ← Logo padrão (usado agora)
│   ├── otimizza-logo-preto-h.png
│   ├── otimizza-logo-branco-h.png
│   ├── otimizza-logo-amarelo-v.png
│   ├── otimizza-logo-preto-v.png
│   └── otimizza-logo-branco-v.png
├── icons/
│   ├── otimizza-icon-amarelo.png
│   ├── otimizza-icon-preto.png
│   └── otimizza-icon-branco.png
└── avatars/ (6 variações)
```

---

## ✅ Onde a Logo Otimizza Está Sendo Usada

### 1. **Sistema Interno** (Header, Sidebar, etc)
- ✅ **Header.tsx** - Logo no topo da navegação
- ✅ **Sidebar.tsx** - Logo na barra lateral
- ✅ **AppSidebar.tsx** - Logo alternativa
- ✅ **useSystemSettings.ts** - Importação da logo local

**Como funciona:**
```tsx
import otimizzaLogoPNG from '../assets/branding/logos/otimizza-logo-amarelo-h.png';

// useSystemSettings retorna:
setLogoUrl(settings['logo_url'] || otimizzaLogoPNG);
```

### 2. **Componente LogoRenderer**
O componente `OtimizzaLogo.tsx` detecta automaticamente:
- Se há uma logo customizada → usa a imagem
- Senão → usa o logo SVG programado (vetor)

```tsx
<LogoRenderer src={logoUrl} variant="horizontal" />
```

---

## 🎯 Áreas Cobertas

| Área | Logo | Status |
|------|------|--------|
| Navegação Principal | Otimizza Amarela | ✅ Ativo |
| Sidebar | Otimizza Amarela | ✅ Ativo |
| Header | Otimizza Amarela | ✅ Ativo |
| Admin | Otimizza Amarela | ✅ Ativo |
| Sistema Celular | Otimizza Amarela | ✅ Ativo |

---

## 📱 Dois Tipos de Logos no Sistema

### Tipo 1: Logo do Sistema (Otimizza)
- **Local:** Sistema interno, navegação, admin
- **Valor:** `src/assets/branding/logos/otimizza-logo-amarelo-h.png`
- **Status:** ✅ Implementado

### Tipo 2: Logo da Empresa
- **Local:** Site público da empresa (PublicNavbar)
- **Valor:** `profile?.company_logo` ou `profile?.website_branding?.logo_primary`
- **Status:** ✅ Independente (cada empresa pode ter sua própria logo)

---

## 🚀 Como a Logo Aparece no Site

### Sistema Interno (Administração)
```
┌─────────────────────────────────────┐
│  [🟨 Otimizza CRM] Dashboard  ⚙️    │  ← Logo Otimizza
├─────────────────────────────────────┤
│ 📊 │ Estoque | Leads | Vendas      │
│    │                                 │
│    │ Conteúdo Principal              │
└─────────────────────────────────────┘
```

### Site Público (para Clientes)
```
┌─────────────────────────────────────┐
│  [Logo da Empresa] WhatsApp         │  ← Logo Customizada
├─────────────────────────────────────┤
│ Estoque | Sobre | Contato           │
└─────────────────────────────────────┘
```

---

## 🔄 Fallbacks Implementados

Se por algum motivo a logo local não carregar:
1. Primeiro tenta: `settings['logo_url']` (do banco de dados)
2. Segundo tenta: `otimizzaLogoPNG` (arquivo local importado)
3. Se nada funcionar: Renderiza o logo SVG programado no componente

---

## 📊 Impacto Visual

### Antes
- Logo padrão era um ícone dinâmico em SVG
- Logo vinha de URL externa (otimizza.com.br)

### Depois
- Logo Otimizza profissional (PNG) em alta qualidade
- Logo carregada localmente (mais rápido)
- Mesmo branding em todos os 3 sistemas (Veículos, Celular, Imobiliárias)

---

## 🛠️ Para Alterar a Logo do Sistema

Se quiser usar uma **variação diferente** da logo Otimizza:

**Opção 1:** Alterar em `useSystemSettings.ts`
```tsx
import otimizzaLogoPNG from '../assets/branding/logos/otimizza-logo-preto-h.png'; // Mudar para escura
```

**Opção 2:** Alterar via Banco de Dados
Adicionar em `system_settings`:
```json
{
  "key": "logo_url",
  "value": "caminho/para/nova-logo.png"
}
```

---

## 📚 Referências

- **Manual de Branding:** `BRANDING_GUIDE.md`
- **Componente Logo:** `src/components/OtimizzaLogo.tsx`
- **Hook de Configuração:** `src/hooks/useSystemSettings.ts`
- **Assets:** `src/assets/branding/`

---

**Última Atualização:** 04/06/2026  
**Status:** ✅ Logo Otimizza integrada em todo o sistema
