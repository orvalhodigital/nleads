import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, Edit2 } from 'lucide-react';
import { LeadTemperature } from '../../types';

interface LeadHeaderProps {
  lead: any;
  onBack: () => void;
}

export const LeadHeader: React.FC<LeadHeaderProps> = ({ lead, onBack }) => {
  const navigate = useNavigate();
  return (
    <div className="space-y-4">
      {/* Header com botão Voltar */}
      <div className="flex items-center justify-between mb-2">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm font-bold text-sm">
          <ArrowLeft size={16} /> Voltar
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/leads/${lead.id}/action/sale`)}
            className="flex items-center gap-2 px-6 py-2 bg-brand-500 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-brand-600 transition-all shadow-sm active:scale-95"
          >
            <DollarSign size={14} /> Registrar Venda
          </button>
          <button
            onClick={() => navigate(`/leads/edit/${lead.id}`)}
            className="flex items-center gap-2 px-6 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all shadow-sm active:scale-95"
          >
            <Edit2 size={14} /> Editar
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-2xl shadow-md overflow-hidden">
            {lead.foto_url ? (
              <img src={lead.foto_url} alt="" className="w-full h-full object-cover" />
            ) : (
              lead.name.charAt(0)
            )}
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{lead.name}</h2>
            <div className="flex items-center gap-3 mt-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                lead.temperature === LeadTemperature.HOT 
                  ? 'bg-rose-50 text-rose-600 border-rose-100' 
                  : lead.temperature === LeadTemperature.WARM 
                    ? 'bg-amber-50 text-amber-600 border-amber-100' 
                    : 'bg-sky-50 text-sky-600 border-sky-100'
              }`}>
                {lead.temperature}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lead.phase}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
