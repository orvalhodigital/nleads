# Padrão de Layout do Sistema

## PageContainer - Componente Padrão

Todos os componentes devem usar `PageContainer` para manter consistência na largura máxima e padding responsivo.

### Localização
`src/components/ui/PageContainer.tsx`

### Especificações
- **Max Width**: `max-w-7xl` (80rem = ~1280px)
- **Padding Responsivo**:
  - Móvel: `px-4` (16px)
  - Tablet: `sm:px-6` (24px)
  - Desktop: `lg:px-8` (32px)
- **Centralização**: `mx-auto`
- **Fluido**: `w-full`

### Uso

```tsx
import PageContainer from './ui/PageContainer';

export default function MyPage() {
  return (
    <PageContainer className="space-y-8 mt-6">
      {/* Seu conteúdo aqui */}
    </PageContainer>
  );
}
```

## Páginas Atualizadas

✅ **Dashboard.tsx** - Usa PageContainer
✅ **VehicleForm.tsx** - Usa PageContainer
✅ **Inventory.tsx** - Padding progressivo + max-w (otimizado para grid)
✅ **AgendaPage.tsx** - Usa PageContainer (wraps Agenda component)
✅ **SalesClosedPage.tsx** - Usa PageContainer
✅ **SettingsPage.tsx** - Usa PageContainer
✅ **MotorcycleInventory.tsx** - Usa max-w-[1400px] próprio (grid de motos)

## Páginas Pendentes

Use PageContainer para:
- LeadManager.tsx (kanban/lista de leads — verificar impacto no layout)
- Qualquer nova página que centralizar conteúdo

## Notas

- O PageContainer é sensível ao layout responsive automaticamente
- Não precisa adicionar max-w, mx-auto, ou padding individual
- Mantenha className para classes adicionais (espaçamento, animações, etc)
- Em componentes complexos com múltiplas seções, o PageContainer pode ser aplicado na seção principal

