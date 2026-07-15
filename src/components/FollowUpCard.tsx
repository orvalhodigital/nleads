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
    const borderColor = type === 'overdue' ? 'border-rose-500/30' : type === 'today' ? 'border-amber-500/30' : 'border-blue-500/20';
    const bgTag = type === 'overdue' ? 'bg-rose-500 text-white' : type === 'today' ? 'bg-amber-500 text-white' : 'bg-blue-500/10 text-blue-500';
    const tagLabel = type === 'overdue' ? '⚠️ ATRASADO' : type === 'today' ? '📞 HOJE' : format(contactDate, "dd/MM/yyyy");

    return (
        <div className={`bg-card border ${borderColor} rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden`}>
            <div className="p-4 border-b border-border/60 flex items-center justify-between">
                <div className={`px-2 py-1 rounded text-[9px] font-bold uppercase ${bgTag}`}>
                    {tagLabel}
                </div>
                {lead.follow_up_data?.notes && (
                    <span className="text-[8px] font-bold text-muted-foreground/40 uppercase tracking-widest truncate max-w-[120px]" title={lead.follow_up_data.notes}>
                        {lead.follow_up_data.notes}
                    </span>
                )}
            </div>

            <div className="p-4 flex items-center gap-3 cursor-pointer" onClick={onViewLead}>
                <div className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0 overflow-hidden">
                    {lead.foto_url ? (
                        <img src={lead.foto_url} alt="" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                        lead.name.charAt(0)
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-bold text-foreground uppercase truncate leading-tight">{lead.name}</h3>
                    <p className="text-[9px] font-bold text-muted-foreground mt-0.5">{lead.phone}</p>
                </div>
            </div>

            <div className="px-4 pb-4 mt-auto flex gap-2">
                <button onClick={onMarkDone} className="flex-1 py-2.5 bg-primary/10 text-primary rounded-lg text-[8px] font-bold uppercase flex items-center justify-center gap-1.5 hover:bg-primary/20 transition-colors cursor-pointer">
                    <CheckCircle2 size={12} /> Feito
                </button>
                <button onClick={onViewLead} className="flex-1 py-2.5 bg-muted text-muted-foreground rounded-lg text-[8px] font-bold uppercase flex items-center justify-center gap-1.5 hover:bg-muted/80 transition-colors cursor-pointer">
                    <Eye size={12} /> Ver Lead
                </button>
            </div>
        </div>
    );
};

export default FollowUpCard;
