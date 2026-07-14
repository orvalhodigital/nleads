import React from 'react';
import { formatCurrency } from '../../utils/formatters';

interface LeadSimulationDataProps {
  lead: any;
}

export const LeadSimulationData: React.FC<LeadSimulationDataProps> = ({ lead }) => {
  if (!lead.simulation_data?.cpf && !lead.simulation_data?.downPayment && !lead.simulation_data?.installments && !lead.simulation_data?.notes) {
    return null;
  }

  return (
    <div className="p-6 bg-white rounded-3xl border border-indigo-100 shadow-sm">
      <h3 className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-6 px-1">Dados de Simulação</h3>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Entrada Proposta</p>
          <p className="text-sm font-semibold text-indigo-700 bg-indigo-50 px-3 py-2 rounded-xl w-fit">R$ {lead.simulation_data?.downPayment ? formatCurrency(lead.simulation_data.downPayment) : '0'}</p>
        </div>
        <div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Parcelamento</p>
          <p className="text-sm font-semibold text-slate-700">{lead.simulation_data?.installments ? `${lead.simulation_data.installments}x` : 'N/A'}</p>
        </div>
        {(lead.simulation_data?.cpf || lead.simulation_data?.cnh) && (
          <div className="col-span-full flex gap-4">
            {lead.simulation_data?.cpf && <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">CPF: {lead.simulation_data.cpf}</span>}
            {lead.simulation_data?.cnh && <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">CNH: {lead.simulation_data.cnh}</span>}
          </div>
        )}
        {lead.simulation_data?.notes && (
          <div className="col-span-full pt-4 border-t border-indigo-50">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Notas da Simulação</p>
            <p className="text-sm font-medium text-slate-600 bg-slate-50 p-4 rounded-xl">{lead.simulation_data.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};
