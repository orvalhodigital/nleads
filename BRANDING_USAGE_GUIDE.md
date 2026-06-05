# 🎨 Guia de Uso - Branding Otimizza

Documentação para desenvolvedores sobre como usar os novos componentes e hooks de branding.

---

## 📦 Componentes Disponíveis

### 1. `OtimizzaBrandLogo`

Componente reutilizável para exibir o logo Otimizza em diferentes variações.

#### Importação
```tsx
import { OtimizzaBrandLogo } from '@/components/OtimizzaBrandLogo';
```

#### Propriedades
```tsx
interface OtimizzaBrandLogoProps {
  variant?: 'horizontal' | 'vertical' | 'icon';     // Layout do logo
  size?: 'sm' | 'md' | 'lg' | 'xl';                // Tamanho
  colorScheme?: 'light' | 'dark';                  // Esquema de cores
  className?: string;                               // Classes Tailwind adicionais
  onClick?: () => void;                             // Callback ao clicar
  showText?: boolean;                               // Mostrar texto "Otimizza CRM"
}
```

#### Exemplos de Uso

**Horizontal (padrão para header)**
```tsx
<OtimizzaBrandLogo 
  variant="horizontal" 
  size="md"
  onClick={() => navigate('/')}
/>
```

**Vertical (para sidebar)**
```tsx
<OtimizzaBrandLogo 
  variant="vertical" 
  size="lg"
  className="hidden lg:flex"
/>
```

**Apenas Ícone (para favicon, abas)**
```tsx
<OtimizzaBrandLogo 
  variant="icon" 
  size="sm"
/>
```

**Dark Mode**
```tsx
<OtimizzaBrandLogo 
  variant="horizontal"
  colorScheme="dark"
/>
```

**Sem Texto**
```tsx
<OtimizzaBrandLogo 
  variant="horizontal"
  showText={false}
/>
```

---

## 🎨 Hooks Disponíveis

### 1. `useBrandTheme`

Hook para acessar cores e tema da marca Otimizza.

#### Importação
```tsx
import { useBrandTheme, OTIMIZZA_COLORS } from '@/hooks/useBrandTheme';
```

#### Retorno
```tsx
const {
  theme,               // 'light' | 'dark' | 'auto'
  setTheme,           // (theme: BrandTheme) => void
  isDark,             // boolean
  colors,             // OTIMIZZA_COLORS
  getBrandColor,      // (key) => string
  getPrimaryColor,    // () => string (amarelo)
  getSecondaryColor,  // () => string (escuro/branco)
  getTertiaryColor    // () => string (claro/cinza escuro)
} = useBrandTheme();
```

#### Exemplos de Uso

**Usar cores na renderização**
```tsx
const MyComponent = () => {
  const { isDark, getPrimaryColor } = useBrandTheme();
  
  return (
    <div style={{ backgroundColor: getPrimaryColor() }}>
      {isDark ? 'Tema escuro' : 'Tema claro'}
    </div>
  );
};
```

**Acessar paleta completa**
```tsx
const ButtonComponent = () => {
  const { colors } = useBrandTheme();
  
  return (
    <button style={{ backgroundColor: colors.primary }}>
      Clique aqui
    </button>
  );
};
```

**Detectar preferência do sistema**
```tsx
const ThemedCard = () => {
  const { theme, setTheme, isDark } = useBrandTheme();
  
  return (
    <div className={isDark ? 'bg-slate-900' : 'bg-white'}>
      <button onClick={() => setTheme(isDark ? 'light' : 'dark')}>
        {theme === 'auto' ? 'Sistema' : theme}
      </button>
    </div>
  );
};
```

---

## 🎯 Casos de Uso Comuns

### 1. Logo no Header
```tsx
import { OtimizzaBrandLogo } from '@/components/OtimizzaBrandLogo';

export const Header = () => {
  return (
    <header className="h-20 bg-white border-b">
      <OtimizzaBrandLogo 
        variant="horizontal"
        size="md"
        onClick={() => window.location.href = '/'}
        className="cursor-pointer hover:opacity-80"
      />
    </header>
  );
};
```

### 2. Sidebar com Logo
```tsx
export const Sidebar = () => {
  return (
    <aside className="w-64 bg-white p-6">
      <OtimizzaBrandLogo 
        variant="vertical"
        size="lg"
        className="mb-8"
      />
      {/* Menu items */}
    </aside>
  );
};
```

### 3. Botão com Tema Dinâmico
```tsx
import { useBrandTheme } from '@/hooks/useBrandTheme';

export const ThemedButton = () => {
  const { getPrimaryColor, getSecondaryColor } = useBrandTheme();
  
  return (
    <button
      style={{
        backgroundColor: getPrimaryColor(),
        color: getSecondaryColor()
      }}
      className="px-6 py-3 rounded-lg font-bold transition-all hover:opacity-90"
    >
      Ação Principal
    </button>
  );
};
```

### 4. Card com Cores da Marca
```tsx
const BrandCard = ({ title, content }) => {
  const { colors, isDark } = useBrandTheme();
  
  return (
    <div 
      style={{
        borderLeft: `4px solid ${colors.primary}`,
        backgroundColor: isDark ? colors.darkTertiary : colors.lightTertiary
      }}
      className="p-6 rounded-lg"
    >
      <h3 style={{ color: colors.primary }} className="font-bold">
        {title}
      </h3>
      <p>{content}</p>
    </div>
  );
};
```

---

## 🎨 Paleta de Cores

### Cores Base
```
Amarelo (Primária):    #F79F1B
Escuro (Secundária):   #373435
Claro (Terciária):     #F9FBFC
Laranja (Accent):      #F39C12
```

### Uso em Tailwind
```tsx
// Para adicionar cores customizadas em tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'otimizza-yellow': '#F79F1B',
        'otimizza-dark': '#373435',
        'otimizza-light': '#F9FBFC',
      }
    }
  }
}
```

---

## 📱 Responsividade

Os componentes se adaptam automaticamente com Tailwind:

```tsx
// Logo maior em desktop, menor em mobile
<OtimizzaBrandLogo 
  variant="horizontal"
  className="h-8 md:h-10 lg:h-12"
/>
```

---

## 🔄 Backward Compatibility

Os componentes antigos (`OtimizzaLogo`, `LogoRenderer`) continuam funcionando:

```tsx
// Ainda suportado
import { LogoRenderer } from '@/components/OtimizzaLogo';
<LogoRenderer src={logoUrl} variant="horizontal" />

// Novo (recomendado)
import { OtimizzaBrandLogo } from '@/components/OtimizzaBrandLogo';
<OtimizzaBrandLogo variant="horizontal" />
```

---

## 🚀 Best Practices

1. **Use o componente `OtimizzaBrandLogo`** em novos componentes em vez de duplicar o SVG
2. **Use `useBrandTheme()`** para acessar cores em vez de hardcoding hex colors
3. **Respeite a variação light/dark** usando as cores apropriadas
4. **Mantenha a consistência** usando `size="md"` como padrão

---

## 📞 Suporte

Para adicionar novas variações de logo ou cores:
1. Edite `OTIMIZZA_COLORS` em `useBrandTheme.ts`
2. Atualize `OtimizzaBrandLogo.tsx` se necessário
3. Documente aqui

**Última atualização:** 04/06/2026
