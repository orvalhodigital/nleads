import React from 'react';
import { Search, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { format, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { VisitStatus } from '../../types';
import { CustomDatePicker } from '../ui/CustomDatePicker';

interface AgendaFiltersProps {
  viewType: 'list' | 'calendar';
  agendaTab: 'visits' | 'followups';
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  dateFilter: string;
  setDateFilter: (val: string) => void;
  statusFilter: VisitStatus | 'all';
  setStatusFilter: (val: VisitStatus | 'all') => void;
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  getStatusLabel: (status: VisitStatus) => string;
}

export const AgendaFilters: React.FC<AgendaFiltersProps> = ({
  viewType,
  agendaTab,
  searchQuery,
  setSearchQuery,
  dateFilter,
  setDateFilter,
  statusFilter,
  setStatusFilter,
  currentDate,
  setCurrentDate,
  getStatusLabel
}) => {
  return (
    <div className="flex flex-wrap gap-4 items-end">
      <div className="flex-1 min-w-[200px] space-y-1.5">
        <label className="text-[10px] font-bold uppercase text-slate-400 px-1 block">Buscar</label>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
          <input
            placeholder="Buscar por nome..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-100 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-brand-500/5 transition-all outline-none"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {viewType === 'list' && (
        <div className="space-y-1.5 min-w-[140px]">
          <label className="text-[10px] font-bold uppercase text-slate-400 px-1 block flex justify-between items-center h-4">
            Filtrar Data
            {dateFilter && (
              <button onClick={() => setDateFilter('')} className="text-[8px] text-brand-500 hover:text-brand-700 font-extrabold flex items-center gap-0.5 transition-all cursor-pointer">
                <X size={10} /> LIMPAR
              </button>
            )}
          </label>
          <CustomDatePicker
            value={dateFilter}
            onChange={setDateFilter}
            placeholder="Todas as datas"
            className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl text-[11px] font-semibold focus:bg-white focus:border-brand-500/30 transition-all outline-none flex items-center justify-between"
          />
        </div>
      )}

      {agendaTab === 'visits' && viewType === 'list' && (
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase text-slate-400 px-1 block">Status</label>
          <div className="flex bg-white p-1.5 rounded-xl border border-slate-100 h-[45px]">
            {(['all', 'pending', 'show', 'noshow'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 rounded-lg text-[9px] font-bold uppercase tracking-tight transition-all cursor-pointer ${statusFilter === f ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-100'}`}
              >
                {f === 'all' ? 'Todos' : getStatusLabel(f)}
              </button>
            ))}
          </div>
        </div>
      )}

      {viewType === 'calendar' && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between bg-white px-2 py-1.5 rounded-xl border border-slate-100 h-[45px]">
            <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-1 hover:text-brand-500 text-slate-400 cursor-pointer"><ChevronLeft size={16} /></button>
            <span className="text-[11px] font-black text-slate-900 uppercase min-w-[120px] text-center">{format(currentDate, 'MMMM yyyy', { locale: ptBR })}</span>
            <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-1 hover:text-brand-500 text-slate-400 cursor-pointer"><ChevronRight size={16} /></button>
          </div>
        </div>
      )}
    </div>
  );
};
