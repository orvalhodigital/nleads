import React from 'react';
import { MotorcycleCategory } from '../../types';

interface MotoFiltersProps {
    filters: {
        category: string;
        yearMin: string;
        yearMax: string;
        priceMin: string;
        priceMax: string;
    };
    onChangeFilters: React.Dispatch<React.SetStateAction<{
        query: string;
        priceMin: string;
        priceMax: string;
        category: string;
        yearMin: string;
        yearMax: string;
    }>>;
    clearFilters: () => void;
    motoCategories: MotorcycleCategory[];
}

export const MotoFilters: React.FC<MotoFiltersProps> = ({
    filters,
    onChangeFilters,
    clearFilters,
    motoCategories
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm animate-fadeUp">
            <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-400 px-1 block">Categoria</label>
                <select
                    value={filters.category}
                    onChange={e => onChangeFilters(f => ({ ...f, category: e.target.value }))}
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm outline-none focus:border-brand-500 transition-colors"
                >
                    <option value="">Todas</option>
                    {motoCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>
            
            <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-400 px-1 block">Ano</label>
                <div className="flex gap-2">
                    <input
                        type="number"
                        value={filters.yearMin}
                        onChange={e => onChangeFilters(f => ({ ...f, yearMin: e.target.value }))}
                        placeholder="De"
                        className="w-full px-3 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-brand-500/5 focus:border-brand-500 transition-all"
                    />
                    <input
                        type="number"
                        value={filters.yearMax}
                        onChange={e => onChangeFilters(f => ({ ...f, yearMax: e.target.value }))}
                        placeholder="Até"
                        className="w-full px-3 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-brand-500/5 focus:border-brand-500 transition-all"
                    />
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Preço Mín.</label>
                <input
                    type="number"
                    value={filters.priceMin}
                    onChange={e => onChangeFilters(f => ({ ...f, priceMin: e.target.value }))}
                    placeholder="0"
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm outline-none focus:border-brand-500 transition-colors"
                />
            </div>

            <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Preço Máx.</label>
                <input
                    type="number"
                    value={filters.priceMax}
                    onChange={e => onChangeFilters(f => ({ ...f, priceMax: e.target.value }))}
                    placeholder="999.999"
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm outline-none focus:border-brand-500 transition-colors"
                />
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
