import React from 'react';
import { Search } from 'lucide-react';

interface VehicleFiltersProps {
  filters: {
    query: string;
    yearMin: string;
    yearMax: string;
  };
  onChangeFilters: React.Dispatch<React.SetStateAction<{
    query: string;
    yearMin: string;
    yearMax: string;
  }>>;
  clearFilters: () => void;
}

export const VehicleFilters: React.FC<VehicleFiltersProps> = ({
  filters,
  onChangeFilters,
  clearFilters
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm animate-fadeUp">
      <div className="md:col-span-2 space-y-1.5">
        <label className="text-[10px] font-bold uppercase text-slate-400 px-1 block">Buscar</label>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
          <input
            type="text"
            value={filters.query}
            onChange={e => onChangeFilters(f => ({ ...f, query: e.target.value }))}
            placeholder="Marca, modelo ou placa..."
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-brand-500/5 focus:border-brand-500 transition-all outline-none"
          />
        </div>
      </div>
      
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold uppercase text-slate-400 px-1 block">Ano</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={filters.yearMin}
            onChange={e => onChangeFilters(f => ({ ...f, yearMin: e.target.value }))}
            placeholder="De"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-brand-500/5 focus:border-brand-500 transition-all outline-none"
          />
          <input
            type="number"
            value={filters.yearMax}
            onChange={e => onChangeFilters(f => ({ ...f, yearMax: e.target.value }))}
            placeholder="Até"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-brand-500/5 focus:border-brand-500 transition-all outline-none"
          />
        </div>
      </div>

      <div className="flex items-end">
        <button
          onClick={clearFilters}
          className="w-full py-3.5 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-slate-200 transition-all cursor-pointer"
        >
          Limpar Filtros
        </button>
      </div>
    </div>
  );
};
