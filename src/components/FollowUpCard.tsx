
import React from 'react';
import { CheckCircle2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { Lead } from '../types';

interface FollowUpCardProps {
    lead: Lead & { contactDate?: Date; vehicle?: any };
    contactDate: Date;
    vehicle?: any;
    type: 'overdue' | 'today' | 'upcoming';
    onViewLead: () => void;
    onMarkDone: () => void;
}

const FollowUpCard: React.FC<FollowUpCardProps> = ({ lead, contactDate, vehicle, type, onViewLead, onMarkDone }) => {
    const borderColor = type === 'overdue' ? 'border-red-200' : type === 'today' ? 'border-amber-200' : 'border-blue-100';
    const bgTag = type === 'overdue' ? 'bg-red-500 text-white' : type === 'today' ? 'bg-amber-500 text-white' : 'bg-blue-100 text-blue-600';
    const tagLabel = type === 'overdue' ? '⚠️ ATRASADO' : type === 'today' ? '📞 HOJE' : format(contactDate, "dd/MM/yyyy");

    return (
        <div className={`bg-white border ${borderColor} rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden`}>
            <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                <div className={`px-2 py-1 rounded text-[9px] font-black uppercase ${bgTag}`}>
                    {tagLabel}
                </div>
                {lead.follow_up_data?.notes && (
                    <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest truncate max-w-[120px]" title={lead.follow_up_data.notes}>
                        {lead.follow_up_data.notes}
                    </span>
                )}
            </div>

            <div className="p-4 flex items-center gap-3 cursor-pointer" onClick={onViewLead}>
                <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center text-sm font-black shrink-0 overflow-hidden">
                    {lead.foto_url ? (
                        <img src={lead.foto_url} alt="" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                        lead.name.charAt(0)
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-black text-slate-900 uppercase truncate leading-tight">{lead.name}</h3>
                    <p className="text-[9px] font-bold text-slate-400 mt-0.5">{lead.phone}</p>
                </div>
            </div>

            <div className="px-4 pb-4 mt-auto flex gap-2">
                <button onClick={onMarkDone} className="flex-1 py-2.5 bg-emerald-50 text-emerald-600 rounded-lg text-[8px] font-black uppercase flex items-center justify-center gap-1.5 hover:bg-emerald-100 transition-colors">
                    <CheckCircle2 size={12} /> Feito
                </button>
                <button onClick={onViewLead} className="flex-1 py-2.5 bg-slate-50 text-slate-500 rounded-lg text-[8px] font-black uppercase flex items-center justify-center gap-1.5 hover:bg-slate-100 transition-colors">
                    <Eye size={12} /> Ver Lead
                </button>
            </div>
        </div>
    );
};

export default FollowUpCard;
