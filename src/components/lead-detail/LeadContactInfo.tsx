import React from 'react';
import { Phone, Mail } from 'lucide-react';

interface LeadContactInfoProps {
  lead: any;
}

export const LeadContactInfo: React.FC<LeadContactInfoProps> = ({ lead }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 px-1">Contato</h3>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
              <Phone size={14} />
            </div>
            <span className="text-sm font-semibold text-slate-700">{lead.phone}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
              <Mail size={14} />
            </div>
            <span className="text-sm font-semibold text-slate-700">{lead.email || 'Não informado'}</span>
          </div>
        </div>
      </div>

      {(lead.follow_up_data?.nextContactDate || lead.follow_up_data?.notes) && (
        <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 px-1">Follow-up</h3>

          {lead.follow_up_data.nextContactDate && (
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Próximo Contato</p>
              <p className="text-sm font-semibold text-slate-700">{new Date(lead.follow_up_data.nextContactDate).toLocaleDateString('pt-BR')}</p>
            </div>
          )}
          {lead.follow_up_data.notes && (
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Observações</p>
              <p className="text-sm font-medium text-slate-600 bg-slate-50 p-3 rounded-xl">{lead.follow_up_data.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
