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
          className={`bg-card rounded-xl border p-4 flex items-center gap-3 cursor-pointer hover:shadow-sm transition-all active:scale-95 group ${dateFilter === todayFormatted ? 'border-primary ring-1 ring-primary/10 shadow-sm' : 'border-border/80'}`}
        >
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <CalendarDays size={16} className="text-primary" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">{dateFilter ? stats.visitsTotal : stats.visitsTodayTotal}</p>
            <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">{dateFilter ? 'Na Data' : 'Hoje'}</p>
          </div>
        </div>
        <div
          onClick={() => setStatusFilter('pending')}
          className={`bg-card rounded-xl border p-4 flex items-center gap-3 cursor-pointer hover:shadow-sm transition-all active:scale-95 group ${statusFilter === 'pending' ? 'border-amber-500 ring-1 ring-amber-500/10 shadow-sm' : 'border-border/80'}`}
        >
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
            <Clock size={16} className="text-amber-500" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">{stats.visitsPending}</p>
            <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">{dateFilter ? 'Pend. na Data' : 'Total Pendentes'}</p>
          </div>
        </div>
        <div
          onClick={() => setStatusFilter('show')}
          className={`bg-card rounded-xl border p-4 flex items-center gap-3 cursor-pointer hover:shadow-sm transition-all active:scale-95 group ${statusFilter === 'show' ? 'border-primary ring-1 ring-primary/10 shadow-sm' : 'border-border/80'}`}
        >
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <CheckCircle2 size={16} className="text-primary" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">{stats.visitsShow}</p>
            <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">{dateFilter ? 'Real. na Data' : 'Total Realizadas'}</p>
          </div>
        </div>
        <div
          onClick={() => setStatusFilter('noshow')}
          className={`bg-card rounded-xl border p-4 flex items-center gap-3 cursor-pointer hover:shadow-sm transition-all active:scale-95 group ${statusFilter === 'noshow' ? 'border-rose-500 ring-1 ring-rose-500/10 shadow-sm' : 'border-border/80'}`}
        >
          <div className="w-9 h-9 rounded-lg bg-rose-500/10 flex items-center justify-center group-hover:bg-rose-500/20 transition-colors">
            <XCircle size={16} className="text-rose-500" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">{stats.visitsNoShow}</p>
            <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">{dateFilter ? 'Faltas na Data' : 'Total Faltaram'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div
        onClick={() => setFollowupFilter('overdue')}
        className={`bg-card rounded-xl border p-4 flex items-center gap-3 cursor-pointer hover:shadow-sm transition-all active:scale-95 group ${followupFilter === 'overdue' ? 'border-rose-500 ring-1 ring-rose-500/10 shadow-sm' : 'border-border/80'}`}
      >
        <div className="w-9 h-9 rounded-lg bg-rose-500/10 flex items-center justify-center group-hover:bg-rose-500/20 transition-colors">
          <Clock size={16} className="text-rose-500" />
        </div>
        <div>
          <p className="text-lg font-bold text-rose-500">{stats.followupsOverdue}</p>
          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Atrasados</p>
        </div>
      </div>
      <div
        onClick={() => setFollowupFilter('today')}
        className={`bg-card rounded-xl border p-4 flex items-center gap-3 cursor-pointer hover:shadow-sm transition-all active:scale-95 group ${followupFilter === 'today' ? 'border-amber-500 ring-1 ring-amber-500/10 shadow-sm' : 'border-border/80'}`}
      >
        <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
          <PhoneCall size={16} className="text-amber-500" />
        </div>
        <div>
          <p className="text-lg font-bold text-foreground">{stats.followupsToday}</p>
          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Hoje</p>
        </div>
      </div>
      <div
        onClick={() => setFollowupFilter('upcoming')}
        className={`bg-card rounded-xl border p-4 flex items-center gap-3 cursor-pointer hover:shadow-sm transition-all active:scale-95 group ${followupFilter === 'upcoming' ? 'border-blue-500 ring-1 ring-blue-500/10 shadow-sm' : 'border-border/80'}`}
      >
        <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
          <CalendarDays size={16} className="text-blue-500" />
        </div>
        <div>
          <p className="text-lg font-bold text-foreground">{stats.followupsUpcoming}</p>
          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Próximos</p>
        </div>
      </div>
      <div
        onClick={() => setFollowupFilter('nodate')}
        className={`bg-card rounded-xl border p-4 flex items-center gap-3 cursor-pointer hover:shadow-sm transition-all active:scale-95 group ${followupFilter === 'nodate' ? 'border-muted-foreground ring-1 ring-muted-foreground/10 shadow-sm' : 'border-border/80'}`}
      >
        <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center group-hover:bg-muted-foreground/10 transition-colors">
          <Users size={16} className="text-muted-foreground" />
        </div>
        <div>
          <p className="text-lg font-bold text-foreground">{stats.followupsNoDate}</p>
          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Sem Data</p>
        </div>
      </div>
    </div>
  );
};
