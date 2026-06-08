# Landing Page - Índice de Arquivos

## 📁 Estrutura de Pastas

```
Landing/
├── components/
│   ├── HeroSection.tsx
│   ├── ProblemsSection.tsx
│   ├── SolutionSection.tsx
│   ├── FeaturesSection.tsx
│   ├── PricingSection.tsx
│   ├── CTASection.tsx
│   └── Footer.tsx
├── LandingPage.tsx
└── INDEX.md (este arquivo)
```

## 📋 Descrição dos Arquivos

### **LandingPage.tsx** (Componente Principal)
Componente raiz que orquestra todas as seções da landing page.
```tsx
import HeroSection from './sections/HeroSection';
import ProblemsSection from './sections/ProblemsSection';
import SolutionSection from './sections/SolutionSection';
import FeaturesSection from './sections/FeaturesSection';
import PricingSection from './sections/PricingSection';
import CTASection from './sections/CTASection';
import Footer from './sections/Footer';
```

---

## 🎨 Componentes (Seções)

### **HeroSection.tsx**
- Headline: "Venda Mais Veículos Sem Perder Clientes"
- Subheadline e descrição
- 2 CTAs: "Começar Grátis" + "Ver Demo"
- Trust indicators (100% seguro, sem cartão, suporte 24/7)
- Mock de dashboard

**Props:**
- `onGetStarted: () => void` - Callback para botão "Começar Grátis"

---

### **ProblemsSection.tsx**
- 4 problemas principais:
  1. Leads Desorganizados (50-70% esquecidos)
  2. Estoque Confuso (40% faturamento parado)
  3. Equipe Desalinhada (conflitos internos)
  4. Perda de Tempo (10-15h/semana administrativas)
- Cards com ícones e métricas de dor
- Call-out final: "Você enfrenta esses problemas?"

---

### **SolutionSection.tsx**
- Apresentação da solução Otimizza
- Headline: "Um sistema que funciona como você"
- 6 benefícios principais listados
- Mock visual do dashboard com 3 cards de KPI
- Resultado real: "+45% de vendas em 3 meses"

---

### **FeaturesSection.tsx**
- 6 features principais:
  1. Gestão de Leads
  2. Inventário Inteligente
  3. Agenda de Visitas
  4. Relatórios & Análise
  5. Website Profissional
  6. Integrações
- Destaque: "Tudo isso no Plano Free"
- Cards com ícones e descrições

---

### **PricingSection.tsx**
Seção de preços com 2 planos lado a lado:

**Plano Free (R$ 0)**
- Até 10 veículos
- Até 50 leads
- Gestão básica de leads, inventário, agenda
- Relatórios simples
- Suporte por email

**Plano Pro (R$ 197/mês) - DESTAQUE**
- Veículos ilimitados
- Leads ilimitados
- Todas as features Free
- Website profissional
- Integrações avançadas
- Prioridade no suporte

**Bonus:**
- Mini FAQ com 3 dúvidas frequentes

**Props:**
- `onGetStarted: () => void` - Callback para botão de upgrade

---

### **CTASection.tsx**
Call-To-Action final forte:
- Headline: "Pare de Perder Vendas. Comece Hoje"
- Foco em conversão
- Trust badges finais
- Botão destacado

**Props:**
- `onGetStarted: () => void` - Callback para ação final

---

### **Footer.tsx**
- Logo/Branding
- Links de Produto (Features, Preços, Segurança, Status)
- Links de Empresa (Sobre, Blog, Carreiras, Contato)
- Informações de Contato (Email, Telefone, Localização)
- Links Legais (Privacidade, Termos, LGPD)
- Copyright

---

## 🎯 Como Usar

### Integração no App.tsx

```tsx
const LandingPage = lazy(() => import('./pages/Landing/LandingPage'));

// Na rota raiz
<Route path="/" element={<LandingPage />} />
```

### Com Callbacks de Upgrade

```tsx
const handleGetStarted = () => {
  navigate('/auth');
};

<LandingPage onGetStarted={handleGetStarted} />
```

---

## 📱 Responsividade

Todos os componentes são totalmente responsivos:
- ✅ Mobile first (sm: breakpoint)
- ✅ Tablet (md: breakpoint)
- ✅ Desktop (lg: breakpoint)
- ✅ Grids adaptativos
- ✅ Typography responsiva

---

## 🎨 Design System

**Cores principais:**
- Primary: `emerald-500` / `emerald-600`
- Secondary: `slate-900` / `slate-600`
- Accent: `blue-500`, `purple-500`, `red-500`
- Background: gradients e padrões

**Componentes de UI:**
- Buttons com hover states
- Cards com shadow e border effects
- Progress bars e indicadores
- Badges e tags
- Forms e inputs

---

## 🔄 Fluxo de Usuário

```
Landing Page (/)
    ↓
[Escolhe "Começar Grátis"]
    ↓
Auth Page (/auth)
    ↓
[Login/Signup]
    ↓
Dashboard (/dashboard)
```

---

## ✨ Características

- ✅ Headline forte e centrado em valor
- ✅ Trabalha problemas reais do prospect
- ✅ Mostra solução clara
- ✅ Features bem organizadas
- ✅ Pricing transparente
- ✅ CTAs estratégicos em múltiplos pontos
- ✅ Trust indicators
- ✅ Footer completo
- ✅ Totalmente responsivo
- ✅ Design profissional

---

## 📝 Notas

- Todos os componentes usam Tailwind CSS
- Ícones do lucide-react
- React Router para navegação
- Sem dependências externas além de React

Pronto para integrar ao seu projeto! 🚀
