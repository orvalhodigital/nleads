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
        <div className="flex items-center justify-between bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${followupFilter === 'overdue' ? 'bg-red-500' : followupFilter === 'today' ? 'bg-amber-500' : followupFilter === 'upcoming' ? 'bg-blue-500' : 'bg-slate-500'}`} />
            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
              Filtrando por: {followupFilter === 'overdue' ? 'Atrasados' : followupFilter === 'today' ? 'Hoje' : followupFilter === 'upcoming' ? 'Próximos' : 'Sem Data'}
            </span>
          </div>
          <button onClick={() => setFollowupFilter('all')} className="text-[8px] font-black text-brand-500 hover:text-brand-700 bg-brand-50 px-3 py-1.5 rounded-lg transition-all cursor-pointer">LIMPAR FILTRO</button>
        </div>
      )}

      {/* Overdue Follow-ups */}
      {(followupFilter === 'all' || followupFilter === 'overdue') && followups.filter(f => isPast(f.contactDate) && !isToday(f.contactDate)).length > 0 && (
        <div>
          <h3 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-3 flex items-center gap-2 px-1">
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
          <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3 flex items-center gap-2 px-1">
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
          <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3 flex items-center gap-2 px-1">
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
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2 px-1">
            <Users size={12} /> Follow-ups Sem Data Definida
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {followupsNoDateFil.map(lead => (
              <div key={lead.id} className="bg-white border border-dashed border-slate-200 rounded-2xl p-4 flex items-center gap-3 hover:bg-slate-50/50 transition-all cursor-pointer" onClick={() => navigate(`/leads/${lead.id}`)}>
                <div className="w-10 h-10 rounded-lg bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-black shrink-0 overflow-hidden">
                  {lead.foto_url ? (
                    <img src={lead.foto_url} alt="" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    lead.name.charAt(0)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-black text-slate-700 uppercase truncate">{lead.name}</h3>
                  <p className="text-[9px] font-medium text-slate-400">{lead.phone}</p>
                </div>
                <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Sem data</span>
                <ChevronRight size={14} className="text-slate-300" />
              </div>
            ))}
          </div>
        </div>
      )}

      {followups.length === 0 && followupsNoDateFil.length === 0 && (
        <div className="py-20 flex flex-col items-center text-center opacity-20 select-none">
          <PhoneCall size={48} strokeWidth={1} />
          <h3 className="text-sm font-black uppercase tracking-tight mt-2 italic">Nenhum Follow-up Encontrado</h3>
          <p className="text-xs font-medium mt-1">Mova leads para Follow-up para agendar contatos</p>
        </div>
      )}
    </div>
  );
};
