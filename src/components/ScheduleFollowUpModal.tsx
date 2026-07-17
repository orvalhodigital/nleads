import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Users, Calendar, FileText, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { Lead } from '../types';
import { CustomDatePicker } from './ui/CustomDatePicker';

interface ScheduleFollowUpModalProps {
    isOpen: boolean;
    onClose: () => void;
    leads: Lead[];
    onSchedule: (data: { leadId: string; nextContactDate: string; notes: string }) => Promise<void>;
}

/**
 * Cria (ou reagenda) um follow-up para um lead já existente — equivalente ao
 * "Novo Agendamento" (ScheduleVisitModal), mas para a aba Follow-ups da Agenda.
 * Move o lead para a fase Follow-up e preenche `follow_up_data`.
 */
const ScheduleFollowUpModal: React.FC<ScheduleFollowUpModalProps> = ({ isOpen, onClose, leads, onSchedule }) => {
    const [leadId, setLeadId] = useState('');
    const [nextContactDate, setNextContactDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [notes, setNotes] = useState('');
    const [leadSearch, setLeadSearch] = useState('');
    const [isLeadDropdownOpen, setIsLeadDropdownOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const leadDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (leadDropdownRef.current && !leadDropdownRef.current.contains(event.target as Node)) {
                setIsLeadDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Reseta o formulário sempre que o modal é reaberto.
    useEffect(() => {
        if (isOpen) {
            setLeadId('');
            setLeadSearch('');
            setNextContactDate(format(new Date(), 'yyyy-MM-dd'));
            setNotes('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const filteredLeads = leads.filter(l =>
        l.name.toLowerCase().includes(leadSearch.toLowerCase()) ||
        l.phone?.includes(leadSearch)
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!leadId || !nextContactDate || submitting) return;
        setSubmitting(true);
        try {
            await onSchedule({ leadId, nextContactDate, notes });
        } finally {
            setSubmitting(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-[10000] flex items-center justify-center p-4" onClick={onClose}>
            <div className="w-full max-w-lg bg-card border border-border/80 rounded-3xl shadow-2xl animate-fadeUp overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-border/70 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-heading font-bold text-foreground tracking-tight">Novo Follow-up</h2>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1 tracking-widest">Agendar próximo contato</p>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-all group cursor-pointer">
                        <X size={20} className="text-muted-foreground group-hover:rotate-90 transition-all" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
                    <div className="relative" ref={leadDropdownRef}>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                            <Users size={12} /> Selecione o Lead
                        </label>
                        <input
                            type="text"
                            placeholder="Buscar por nome ou telefone..."
                            value={leadSearch}
                            onChange={(e) => {
                                setLeadSearch(e.target.value);
                                setIsLeadDropdownOpen(true);
                                if (leadId) setLeadId('');
                            }}
                            onFocus={() => setIsLeadDropdownOpen(true)}
                            className="w-full text-xs font-bold p-3.5 rounded-xl border border-border/85 bg-muted/75 text-foreground focus:bg-card focus:border-primary/45 transition-all outline-none"
                        />
                        {isLeadDropdownOpen && leadSearch && filteredLeads.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border/80 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto custom-scrollbar">
                                {filteredLeads.map(l => (
                                    <div
                                        key={l.id}
                                        className="p-3 hover:bg-muted cursor-pointer border-b border-border/60 last:border-0"
                                        onClick={() => {
                                            setLeadSearch(`${l.name} (${l.phone || 'Sem telefone'})`);
                                            setLeadId(l.id);
                                            setIsLeadDropdownOpen(false);
                                        }}
                                    >
                                        <p className="text-sm font-bold text-foreground">{l.name}</p>
                                        <p className="text-[10px] font-bold text-primary mt-0.5">{l.phone || 'Sem telefone'}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1 flex items-center gap-1.5">
                            <Calendar size={12} /> Próximo Contato
                        </label>
                        <CustomDatePicker
                            value={nextContactDate}
                            onChange={(date) => setNextContactDate(date)}
                            className="w-full p-3.5 bg-muted/75 border border-border/85 rounded-xl outline-none font-bold text-xs text-foreground focus:bg-card focus:border-primary/45 transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1 flex items-center gap-1.5">
                            <FileText size={12} /> Motivo do contato / Observações
                        </label>
                        <textarea
                            placeholder="Ex: Mandar fotos do porta-malas, negociar IPVA..."
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            rows={3}
                            className="w-full p-3.5 bg-muted/75 border border-border/85 rounded-xl outline-none font-semibold text-sm text-foreground focus:bg-card focus:border-primary/45 transition-all resize-none custom-scrollbar"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={!leadId || !nextContactDate || submitting}
                        className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        <Plus size={16} /> {submitting ? 'Salvando...' : 'Agendar Follow-up'}
                    </button>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default ScheduleFollowUpModal;
