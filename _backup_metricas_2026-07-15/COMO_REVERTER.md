# Backup da página Métricas — 2026-07-15

Snapshot dos arquivos da página **Métricas** ANTES da melhoria de layout desta data.

## Como reverter (se não gostar do novo layout)

Copie os arquivos de volta para o `src/`:

```bash
cp "_backup_metricas_2026-07-15/pages/DashboardPage.tsx"        src/pages/DashboardPage.tsx
cp "_backup_metricas_2026-07-15/Dashboard.tsx"                  src/components/Dashboard.tsx
cp "_backup_metricas_2026-07-15/dashboard/"*.tsx                src/components/dashboard/
```

Ou, se preferir usar o git (reverte só estes arquivos):

```bash
git checkout -- src/components/Dashboard.tsx src/components/dashboard/ src/pages/DashboardPage.tsx
```

> ⚠️ Nota: mudanças de cor/tema/fonte que estão em `src/index.css` NÃO fazem parte
> deste backup (são globais do sistema, não só da página Métricas).

Arquivos no backup:
- `pages/DashboardPage.tsx`
- `Dashboard.tsx`
- `dashboard/DashboardTabGeral.tsx`
- `dashboard/DashboardTabComercial.tsx`
- `dashboard/DashboardTabEstoque.tsx`
- `dashboard/DashboardTabAgenda.tsx`
- `dashboard/DashboardUiComponents.tsx`
