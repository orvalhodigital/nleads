import React from 'react';
import { useNavigate } from 'react-router-dom';
import { format, isPast, isToday, isAfter } from 'date-fns';
import { PhoneCall, Clock, CalendarDays, Users, ChevronRight } from 'lucide-react';
import { Lead } from '../../types';
import FollowUpCard from '../FollowUpCard';

interface AgendaFollowupsListProps {
  followups: any[];
  followupsNoDateFil: Lead[];
  followupFilter: 'overdue' | 'today' | 'upcoming' | 'nodate' | 'all';
  setFollowupFilter: (val: 'overdue' | 'today' | 'upcoming' | 'nodate' | 'all') => void;
  now: Date;
  handleMarkFollowUpDone: (lead: Lead) => Promise<void>;
}

export const AgendaFollowupsList: React.FC<AgendaFollowupsListProps> = ({
  followups,
  followupsNoDateFil,
  followupFilter,
  setFollowupFilter,
  now,
  handleMarkFollowUpDone
}) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Filter Summary */}
      {followupFilter !== 'all' && (
        <div className="flex items-center justify-between bg-muted/50 p-3 rounded-2xl border border-border/80">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${followupFilter === 'overdue' ? 'bg-rose-500' : followupFilter === 'today' ? 'bg-amber-500' : followupFilter === 'upcoming' ? 'bg-blue-500' : 'bg-muted-foreground'}`} />
            <span className="text-[10px] font-bold text-foreground uppercase tracking-widest">
              Filtrando por: {followupFilter === 'overdue' ? 'Atrasados' : followupFilter === 'today' ? 'Hoje' : followupFilter === 'upcoming' ? 'Próximos' : 'Sem Data'}
            </span>
          </div>
          <button onClick={() => setFollowupFilter('all')} className="text-[8px] font-bold text-primary hover:text-primary/80 bg-primary/10 px-3 py-1.5 rounded-lg transition-all cursor-pointer">LIMPAR FILTRO</button>
        </div>
      )}

      {/* Overdue Follow-ups */}
      {(followupFilter === 'all' || followupFilter === 'overdue') && followups.filter(f => isPast(f.contactDate) && !isToday(f.contactDate)).length > 0 && (
        <div>
          <h3 className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-3 flex items-center gap-2 px-1">
            <Clock size={12} /> Atrasados
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {followups.filter(f => isPast(f.contactDate) && !isToday(f.contactDate)).map(followup => (
              <FollowUpCard key={followup.id} lead={followup} contactDate={followup.contactDate} vehicle={followup.vehicle} type="overdue" onViewLead={() => navigate(`/leads/${followup.id}`)} onMarkDone={() => handleMarkFollowUpDone(followup)} />
            ))}
          </div>
        </div>
      )}

      {/* Today's Follow-ups */}
      {(followupFilter === 'all' || followupFilter === 'today') && followups.filter(f => isToday(f.contactDate)).length > 0 && (
        <div>
          <h3 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-3 flex items-center gap-2 px-1">
            <PhoneCall size={12} /> Contatos para Hoje
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {followups.filter(f => isToday(f.contactDate)).map(followup => (
              <FollowUpCard key={followup.id} lead={followup} contactDate={followup.contactDate} vehicle={followup.vehicle} type="today" onViewLead={() => navigate(`/leads/${followup.id}`)} onMarkDone={() => handleMarkFollowUpDone(followup)} />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Follow-ups */}
      {(followupFilter === 'all' || followupFilter === 'upcoming') && followups.filter(f => isAfter(f.contactDate, now) && !isToday(f.contactDate)).length > 0 && (
        <div>
          <h3 className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-3 flex items-center gap-2 px-1">
            <CalendarDays size={12} /> Próximos Contatos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {followups.filter(f => isAfter(f.contactDate, now) && !isToday(f.contactDate)).map(followup => (
              <FollowUpCard key={followup.id} lead={followup} contactDate={followup.contactDate} vehicle={followup.vehicle} type="upcoming" onViewLead={() => navigate(`/leads/${followup.id}`)} onMarkDone={() => handleMarkFollowUpDone(followup)} />
            ))}
          </div>
        </div>
      )}

      {/* Follow-ups without date */}
      {(followupFilter === 'all' || followupFilter === 'nodate') && followupsNoDateFil.length > 0 && (
        <div>
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2 px-1">
            <Users size={12} /> Follow-ups Sem Data Definida
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {followupsNoDateFil.map(lead => (
              <div key={lead.id} className="bg-card border border-dashed border-border/80 rounded-2xl p-4 flex items-center gap-3 hover:bg-muted transition-all cursor-pointer" onClick={() => navigate(`/leads/${lead.id}`)}>
                <div className="w-10 h-10 rounded-lg bg-muted text-muted-foreground flex items-center justify-center text-sm font-bold shrink-0 overflow-hidden">
                  {lead.foto_url ? (
                     <img src={lead.foto_url} alt="" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    lead.name.charAt(0)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-bold text-foreground uppercase truncate">{lead.name}</h3>
                  <p className="text-[9px] font-medium text-muted-foreground">{lead.phone}</p>
                </div>
                <span className="text-[8px] font-bold text-muted-foreground/60 uppercase tracking-widest">Sem data</span>
                <ChevronRight size={14} className="text-muted-foreground/60" />
              </div>
            ))}
          </div>
        </div>
      )}

      {followups.length === 0 && followupsNoDateFil.length === 0 && (
        <div className="py-20 flex flex-col items-center text-center opacity-20 select-none">
          <PhoneCall size={48} strokeWidth={1} className="text-foreground" />
          <h3 className="text-sm font-bold uppercase tracking-tight mt-2 italic text-foreground">Nenhum Follow-up Encontrado</h3>
          <p className="text-xs font-semibold mt-1 text-foreground">Mova leads para Follow-up para agendar contatos</p>
        </div>
      )}
    </div>
  );
};
