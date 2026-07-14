import React from 'react';
import { CalendarDays, Clock, CheckCircle2, XCircle, PhoneCall, Users } from 'lucide-react';
import { VisitStatus } from '../../types';

interface AgendaStatsProps {
  agendaTab: 'visits' | 'followups';
  dateFilter: string;
  statusFilter: VisitStatus | 'all';
  followupFilter: 'overdue' | 'today' | 'upcoming' | 'nodate' | 'all';
  stats: {
    visitsTodayTotal: number;
    visitsPending: number;
    visitsShow: number;
    visitsNoShow: number;
    visitsTotal: number;
    followupsOverdue: number;
    followupsToday: number;
    followupsUpcoming: number;
    followupsNoDate: number;
  };
  setDateFilter: (val: string) => void;
  setStatusFilter: (val: VisitStatus | 'all') => void;
  setFollowupFilter: (val: 'overdue' | 'today' | 'upcoming' | 'nodate' | 'all') => void;
  todayFormatted: string;
}

export const AgendaStats: React.FC<AgendaStatsProps> = ({
  agendaTab,
  dateFilter,
  statusFilter,
  followupFilter,
  stats,
  setDateFilter,
  setStatusFilter,
  setFollowupFilter,
  todayFormatted
}) => {
  if (agendaTab === 'visits') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div
          onClick={() => { setDateFilter(todayFormatted); setStatusFilter('all'); }}
          className={`bg-white rounded-xl border p-4 flex items-center gap-3 cursor-pointer hover:shadow-sm transition-all active:scale-95 group ${dateFilter === todayFormatted ? 'border-brand-500 ring-1 ring-brand-500/10 shadow-sm' : 'border-slate-100'}`}
        >
          <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center group-hover:bg-brand-100 transition-colors">
            <CalendarDays size={16} className="text-brand-500" />
          </div>
          <div>
            <p className="text-lg font-black text-slate-900">{dateFilter ? stats.visitsTotal : stats.visitsTodayTotal}</p>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{dateFilter ? 'Na Data' : 'Hoje'}</p>
          </div>
        </div>
        <div
          onClick={() => setStatusFilter('pending')}
          className={`bg-white rounded-xl border p-4 flex items-center gap-3 cursor-pointer hover:shadow-sm transition-all active:scale-95 group ${statusFilter === 'pending' ? 'border-amber-500 ring-1 ring-amber-500/10 shadow-sm' : 'border-slate-100'}`}
        >
          <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
            <Clock size={16} className="text-amber-500" />
          </div>
          <div>
            <p className="text-lg font-black text-slate-900">{stats.visitsPending}</p>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{dateFilter ? 'Pend. na Data' : 'Total Pendentes'}</p>
          </div>
        </div>
        <div
          onClick={() => setStatusFilter('show')}
          className={`bg-white rounded-xl border p-4 flex items-center gap-3 cursor-pointer hover:shadow-sm transition-all active:scale-95 group ${statusFilter === 'show' ? 'border-brand-500 ring-1 ring-brand-500/10 shadow-sm' : 'border-slate-100'}`}
        >
          <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center group-hover:bg-brand-100 transition-colors">
            <CheckCircle2 size={16} className="text-brand-500" />
          </div>
          <div>
            <p className="text-lg font-black text-slate-900">{stats.visitsShow}</p>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{dateFilter ? 'Real. na Data' : 'Total Realizadas'}</p>
          </div>
        </div>
        <div
          onClick={() => setStatusFilter('noshow')}
          className={`bg-white rounded-xl border p-4 flex items-center gap-3 cursor-pointer hover:shadow-sm transition-all active:scale-95 group ${statusFilter === 'noshow' ? 'border-rose-500 ring-1 ring-rose-500/10 shadow-sm' : 'border-slate-100'}`}
        >
          <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center group-hover:bg-rose-100 transition-colors">
            <XCircle size={16} className="text-rose-500" />
          </div>
          <div>
            <p className="text-lg font-black text-slate-900">{stats.visitsNoShow}</p>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{dateFilter ? 'Faltas na Data' : 'Total Faltaram'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div
        onClick={() => setFollowupFilter('overdue')}
        className={`bg-white rounded-xl border p-4 flex items-center gap-3 cursor-pointer hover:shadow-sm transition-all active:scale-95 group ${followupFilter === 'overdue' ? 'border-red-500 ring-1 ring-red-500/10 shadow-sm' : 'border-slate-100'}`}
      >
        <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
          <Clock size={16} className="text-red-500" />
        </div>
        <div>
          <p className="text-lg font-black text-red-600">{stats.followupsOverdue}</p>
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Atrasados</p>
        </div>
      </div>
      <div
        onClick={() => setFollowupFilter('today')}
        className={`bg-white rounded-xl border p-4 flex items-center gap-3 cursor-pointer hover:shadow-sm transition-all active:scale-95 group ${followupFilter === 'today' ? 'border-amber-500 ring-1 ring-amber-500/10 shadow-sm' : 'border-slate-100'}`}
      >
        <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
          <PhoneCall size={16} className="text-amber-500" />
        </div>
        <div>
          <p className="text-lg font-black text-slate-900">{stats.followupsToday}</p>
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Hoje</p>
        </div>
      </div>
      <div
        onClick={() => setFollowupFilter('upcoming')}
        className={`bg-white rounded-xl border p-4 flex items-center gap-3 cursor-pointer hover:shadow-sm transition-all active:scale-95 group ${followupFilter === 'upcoming' ? 'border-blue-500 ring-1 ring-blue-500/10 shadow-sm' : 'border-slate-100'}`}
      >
        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
          <CalendarDays size={16} className="text-blue-500" />
        </div>
        <div>
          <p className="text-lg font-black text-slate-900">{stats.followupsUpcoming}</p>
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Próximos</p>
        </div>
      </div>
      <div
        onClick={() => setFollowupFilter('nodate')}
        className={`bg-white rounded-xl border p-4 flex items-center gap-3 cursor-pointer hover:shadow-sm transition-all active:scale-95 group ${followupFilter === 'nodate' ? 'border-slate-500 ring-1 ring-slate-500/10 shadow-sm' : 'border-slate-100'}`}
      >
        <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-slate-100 transition-colors">
          <Users size={16} className="text-slate-400" />
        </div>
        <div>
          <p className="text-lg font-black text-slate-900">{stats.followupsNoDate}</p>
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Sem Data</p>
        </div>
      </div>
    </div>
  );
};
