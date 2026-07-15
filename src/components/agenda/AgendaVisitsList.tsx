import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock, Car, CheckCircle2, XCircle, Save } from 'lucide-react';
import { format, isToday, isPast } from 'date-fns';
import { VisitStatus } from '../../types';

interface AgendaVisitsListProps {
  visits: any[];
  editingVisitId: string | null;
  setEditingVisitId: (val: string | null) => void;
  tempDate: string;
  setTempDate: (val: string) => void;
  getStatusStyle: (status: VisitStatus) => string;
  getStatusLabel: (status: VisitStatus) => string;
  handleUpdateVisitStatus: (leadId: string, appointmentId: string, status: VisitStatus) => Promise<void>;
  handleSaveDate: (leadId: string, appointmentId: string) => Promise<void>;
}

export const AgendaVisitsList: React.FC<AgendaVisitsListProps> = ({
  visits,
  editingVisitId,
  setEditingVisitId,
  tempDate,
  setTempDate,
  getStatusStyle,
  getStatusLabel,
  handleUpdateVisitStatus,
  handleSaveDate
}) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {visits.length > 0 ? (
        visits.map((visit) => (
          <div key={visit.appointmentId} className="group relative bg-card border border-border/80 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border/60 flex items-center justify-between">
              <div className={`px-2 py-1 rounded text-[9px] font-bold uppercase ${isToday(visit.visitDate) ? 'bg-primary text-primary-foreground' : isPast(visit.visitDate) ? 'bg-rose-500/10 text-rose-500' : 'bg-muted text-muted-foreground'}`}>
                {isToday(visit.visitDate) ? '🟢 HOJE ' : isPast(visit.visitDate) ? '⚠️ ' : ''}{format(visit.visitDate, "dd/MM 'às' HH:mm")}
              </div>
              <button onClick={() => { setEditingVisitId(visit.appointmentId); setTempDate(format(visit.visitDate, "yyyy-MM-dd'T'HH:mm")); }} className="p-1.5 text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer">
                <Clock size={14} />
              </button>
            </div>

            <div className="p-4 flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/leads/${visit.id}`)}>
              <div className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0 overflow-hidden">
                {visit.foto_url ? (
                  <img src={visit.foto_url} alt={visit.name} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  visit.name.charAt(0)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-bold text-foreground uppercase truncate leading-tight">{visit.name}</h3>
                <p className="text-[9px] font-bold text-muted-foreground mt-0.5">{visit.phone}</p>
              </div>
            </div>

            <div className="px-4 pb-4 mt-auto">
              {visit.vehicle ? (
                <div className="bg-muted/50 rounded-xl p-3 flex items-center gap-3 border border-border/40 mb-4 cursor-pointer"
                  onClick={() => navigate('/inventory', { state: { selectedVehicleId: visit.vehicle!.id } })}>
                  <Car size={14} className="text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground uppercase text-[9px] truncate">{visit.vehicle.brand} {visit.vehicle.model}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-muted/50 rounded-xl p-2 border border-dashed border-border/80 flex items-center justify-center mb-4">
                  <p className="text-[8px] font-bold text-muted-foreground/60 uppercase tracking-widest italic">Visita Simples</p>
                </div>
              )}

              <div className="flex items-center justify-between gap-2">
                <div className={`flex-1 py-2 rounded-lg text-[8px] font-bold uppercase text-center ${getStatusStyle(visit.visit_status || 'pending')}`}>
                  {getStatusLabel(visit.visit_status || 'pending')}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleUpdateVisitStatus(visit.id, visit.appointmentId, visit.visit_status === 'show' ? 'pending' : 'show')} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${visit.visit_status === 'show' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground border border-border/60 hover:text-primary'}`}>
                    <CheckCircle2 size={16} />
                  </button>
                  <button onClick={() => handleUpdateVisitStatus(visit.id, visit.appointmentId, visit.visit_status === 'noshow' ? 'pending' : 'noshow')} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${visit.visit_status === 'noshow' ? 'bg-rose-500 text-white shadow-sm' : 'bg-muted text-muted-foreground border border-border/60 hover:text-rose-500'}`}>
                    <XCircle size={16} />
                  </button>
                </div>
              </div>
            </div>

            {editingVisitId === visit.appointmentId && (
              <div className="absolute inset-0 bg-card/95 backdrop-blur-sm z-10 flex flex-col justify-center p-6 animate-fadeUp">
                <p className="text-[9px] font-bold text-foreground text-center uppercase tracking-widest mb-4 italic">Reagendar</p>

                <div className="mb-3">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Data</label>
                  <input
                    type="date"
                    value={tempDate ? tempDate.split('T')[0] : ''}
                    onChange={e => setTempDate(e.target.value + 'T' + (tempDate ? tempDate.split('T')[1] : '10:00'))}
                    className="w-full px-4 py-2 border border-border/80 rounded-lg text-xs bg-muted/50 text-foreground outline-none focus:bg-card focus:border-primary/45"
                  />
                </div>

                <div className="mb-4">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Horário</label>
                  <input
                    type="time"
                    value={tempDate ? tempDate.split('T')[1] : ''}
                    onChange={e => setTempDate((tempDate ? tempDate.split('T')[0] : new Date().toISOString().split('T')[0]) + 'T' + e.target.value)}
                    className="w-full px-4 py-2 border border-border/80 rounded-lg text-xs bg-muted/50 text-foreground outline-none focus:bg-card focus:border-primary/45"
                  />
                </div>

                <div className="flex w-full gap-2 mt-2">
                  <button onClick={() => setEditingVisitId(null)} className="flex-1 py-3 bg-card border border-border/80 text-muted-foreground rounded-lg text-[8px] font-bold uppercase cursor-pointer hover:bg-muted">Sair</button>
                  <button onClick={() => handleSaveDate(visit.id, visit.appointmentId)} className="flex-1 py-3 bg-primary text-primary-foreground rounded-lg text-[8px] font-bold uppercase flex items-center justify-center gap-2 cursor-pointer hover:bg-primary/90"><Save size={12} /> Salvar</button>
                </div>
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="col-span-full py-20 flex flex-col items-center text-center opacity-20 select-none">
          <CalendarIcon size={48} strokeWidth={1} className="text-foreground" />
          <h3 className="text-sm font-bold uppercase tracking-tight mt-2 italic text-foreground">Sem Visitas no Momento</h3>
        </div>
      )}
    </div>
  );
};
