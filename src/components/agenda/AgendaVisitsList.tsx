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
          <div key={visit.appointmentId} className="group relative bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-50 flex items-center justify-between">
              <div className={`px-2 py-1 rounded text-[9px] font-black uppercase ${isToday(visit.visitDate) ? 'bg-brand-500 text-white' : isPast(visit.visitDate) ? 'bg-red-100 text-red-500' : 'bg-slate-100 text-slate-500'}`}>
                {isToday(visit.visitDate) ? '🟢 HOJE ' : isPast(visit.visitDate) ? '⚠️ ' : ''}{format(visit.visitDate, "dd/MM 'às' HH:mm")}
              </div>
              <button onClick={() => { setEditingVisitId(visit.appointmentId); setTempDate(format(visit.visitDate, "yyyy-MM-dd'T'HH:mm")); }} className="p-1.5 text-slate-300 hover:text-slate-900 transition-colors cursor-pointer">
                <Clock size={14} />
              </button>
            </div>

            <div className="p-4 flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/leads/${visit.id}`)}>
              <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center text-sm font-black shrink-0 overflow-hidden">
                {visit.foto_url ? (
                  <img src={visit.foto_url} alt={visit.name} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  visit.name.charAt(0)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-black text-slate-900 uppercase truncate leading-tight">{visit.name}</h3>
                <p className="text-[9px] font-bold text-slate-400 mt-0.5">{visit.phone}</p>
              </div>
            </div>

            <div className="px-4 pb-4 mt-auto">
              {visit.vehicle ? (
                <div className="bg-slate-50/50 rounded-xl p-3 flex items-center gap-3 border border-slate-100/50 mb-4 cursor-pointer"
                  onClick={() => navigate('/inventory', { state: { selectedVehicleId: visit.vehicle!.id } })}>
                  <Car size={14} className="text-brand-500" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 uppercase text-[9px] truncate">{visit.vehicle.brand} {visit.vehicle.model}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50/50 rounded-xl p-2 border border-dashed border-slate-200 flex items-center justify-center mb-4">
                  <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest italic">Visita Simples</p>
                </div>
              )}

              <div className="flex items-center justify-between gap-2">
                <div className={`flex-1 py-2 rounded-lg text-[8px] font-black uppercase text-center ${getStatusStyle(visit.visit_status || 'pending')}`}>
                  {getStatusLabel(visit.visit_status || 'pending')}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleUpdateVisitStatus(visit.id, visit.appointmentId, visit.visit_status === 'show' ? 'pending' : 'show')} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${visit.visit_status === 'show' ? 'bg-brand-500 text-white shadow-sm' : 'bg-slate-50 text-slate-300 border border-slate-100 hover:text-brand-600'}`}>
                    <CheckCircle2 size={16} />
                  </button>
                  <button onClick={() => handleUpdateVisitStatus(visit.id, visit.appointmentId, visit.visit_status === 'noshow' ? 'pending' : 'noshow')} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${visit.visit_status === 'noshow' ? 'bg-rose-500 text-white shadow-sm' : 'bg-slate-50 text-slate-300 border border-slate-100 hover:text-rose-600'}`}>
                    <XCircle size={16} />
                  </button>
                </div>
              </div>
            </div>

            {editingVisitId === visit.appointmentId && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-10 flex flex-col justify-center p-6 animate-fadeUp">
                <p className="text-[9px] font-black text-slate-900 text-center uppercase tracking-widest mb-4 italic">Reagendar</p>

                <div className="mb-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Data</label>
                  <input
                    type="date"
                    value={tempDate ? tempDate.split('T')[0] : ''}
                    onChange={e => setTempDate(e.target.value + 'T' + (tempDate ? tempDate.split('T')[1] : '10:00'))}
                    className="w-full px-4 py-2 border border-slate-100 rounded-lg text-xs"
                  />
                </div>

                <div className="mb-4">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Horário</label>
                  <input
                    type="time"
                    value={tempDate ? tempDate.split('T')[1] : ''}
                    onChange={e => setTempDate((tempDate ? tempDate.split('T')[0] : new Date().toISOString().split('T')[0]) + 'T' + e.target.value)}
                    className="w-full px-4 py-2 border border-slate-100 rounded-lg text-xs"
                  />
                </div>

                <div className="flex w-full gap-2 mt-2">
                  <button onClick={() => setEditingVisitId(null)} className="flex-1 py-3 bg-white border border-slate-100 text-slate-400 rounded-lg text-[8px] font-black uppercase cursor-pointer">Sair</button>
                  <button onClick={() => handleSaveDate(visit.id, visit.appointmentId)} className="flex-1 py-3 bg-slate-900 text-white rounded-lg text-[8px] font-black uppercase flex items-center justify-center gap-2 cursor-pointer"><Save size={12} /> Salvar</button>
                </div>
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="col-span-full py-20 flex flex-col items-center text-center opacity-20 select-none">
          <CalendarIcon size={48} strokeWidth={1} />
          <h3 className="text-sm font-black uppercase tracking-tight mt-2 italic">Sem Visitas no Momento</h3>
        </div>
      )}
    </div>
  );
};
