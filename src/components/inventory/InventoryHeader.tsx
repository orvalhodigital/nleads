import React from 'react';
import { Plus, Upload, Filter, LayoutGrid, List } from 'lucide-react';

export interface InventoryHeaderProps {
  inventoryView: 'available' | 'sold';
  onInventoryViewChange: (view: 'available' | 'sold') => void;
  availableCount: number;
  soldCount: number;
  availableLabel?: string;
  soldLabel?: string;

  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;

  isFilterOpen: boolean;
  onToggleFilter: () => void;

  sortBy: 'brand' | 'a-z' | 'z-a';
  onSortByChange: (sortBy: 'brand' | 'a-z' | 'z-a') => void;

  onOpenImport?: () => void;
  onNewItem: () => void;
  newItemLabel: string;
}

export const InventoryHeader: React.FC<InventoryHeaderProps> = ({
  inventoryView,
  onInventoryViewChange,
  availableCount,
  soldCount,
  availableLabel = 'Em Estoque',
  soldLabel = 'Vendidos',
  viewMode,
  onViewModeChange,
  isFilterOpen,
  onToggleFilter,
  sortBy,
  onSortByChange,
  onOpenImport,
  onNewItem,
  newItemLabel,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 sm:gap-6 px-1">
      {/* Left controls: Tabs, View mode, Filters & Sorting */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Available / Sold Tabs */}
        <div className="flex bg-muted/60 p-1 rounded-xl border border-border backdrop-blur-sm">
          <button
            type="button"
            onClick={() => onInventoryViewChange('available')}
            className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg transition-all duration-200 ${
              inventoryView === 'available'
                ? 'bg-card text-primary shadow-sm font-black ring-1 ring-border'
                : 'text-muted-foreground hover:text-foreground font-bold'
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                inventoryView === 'available' ? 'bg-primary animate-pulse' : 'bg-muted-foreground/40'
              }`}
            />
            <span className="text-[11px] uppercase tracking-wider">{availableLabel}</span>
            <span
              className={`ml-1 text-[9px] px-1.5 py-0.5 rounded-md font-bold ${
                inventoryView === 'available'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {availableCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onInventoryViewChange('sold')}
            className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg transition-all duration-200 ${
              inventoryView === 'sold'
                ? 'bg-card text-destructive shadow-sm font-black ring-1 ring-border'
                : 'text-muted-foreground hover:text-foreground font-bold'
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                inventoryView === 'sold' ? 'bg-destructive animate-pulse' : 'bg-muted-foreground/40'
              }`}
            />
            <span className="text-[11px] uppercase tracking-wider">{soldLabel}</span>
            <span
              className={`ml-1 text-[9px] px-1.5 py-0.5 rounded-md font-bold ${
                inventoryView === 'sold'
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {soldCount}
            </span>
          </button>
        </div>

        <div className="h-8 w-px bg-border mx-1 hidden md:block" />

        {/* View Mode Toggle */}
        <div className="flex bg-muted/60 p-1 rounded-xl border border-border">
          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'grid'
                ? 'bg-card text-foreground shadow-sm ring-1 ring-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Visualização em Grade"
          >
            <LayoutGrid size={16} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('list')}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'list'
                ? 'bg-card text-foreground shadow-sm ring-1 ring-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Visualização em Lista"
          >
            <List size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Filter Toggle */}
        <button
          type="button"
          onClick={onToggleFilter}
          className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-sm ${
            isFilterOpen
              ? 'bg-foreground text-background border-foreground shadow-md'
              : 'bg-card border-border text-foreground hover:bg-muted'
          }`}
        >
          <Filter size={15} strokeWidth={2.5} />
          Filtrar
        </button>

        {/* Sort Select */}
        <select
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value as 'brand' | 'a-z' | 'z-a')}
          className="px-4 py-2.5 bg-card border border-border text-foreground rounded-xl text-[11px] font-bold uppercase tracking-wider hover:bg-muted transition-all shadow-sm outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="brand">Ordenar: Marca</option>
          <option value="a-z">Ordenar: A-Z</option>
          <option value="z-a">Ordenar: Z-A</option>
        </select>
      </div>

      {/* Right action buttons: Import (if present) & Add New */}
      <div className="flex items-center gap-3">
        {onOpenImport && (
          <button
            type="button"
            onClick={onOpenImport}
            className="flex items-center gap-2 px-5 py-2.5 bg-card border border-border text-foreground rounded-xl text-[11px] font-extrabold uppercase tracking-wider hover:bg-muted transition-all shadow-sm active:scale-95"
          >
            <Upload size={15} strokeWidth={2.5} /> Importar
          </button>
        )}
        <button
          type="button"
          onClick={onNewItem}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-[11px] font-extrabold uppercase tracking-wider hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95"
        >
          <Plus size={16} strokeWidth={3} /> {newItemLabel}
        </button>
      </div>
    </div>
  );
};

export default InventoryHeader;
