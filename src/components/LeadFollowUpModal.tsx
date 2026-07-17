import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { Lead } from '../types';
import { CustomDatePicker } from './ui/CustomDatePicker';

interface Props {
    lead: Lead;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data?: { nextContactDate: string; notes: string }) => void;
}

export const LeadFollowUpModal: React.FC<Props> = ({ lead, isOpen, onClose, onConfirm }) => {
    const [nextContactDate, setNextContactDate] = useState('');
    const [notes, setNotes] = useState('');

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-[10000] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-card w-[80vw] max-w-5xl h-[80vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-fadeUp border border-border/80" onClick={e => e.stopPropagation()}>
                <div className="p-8 border-b border-border/70 flex items-center justify-between bg-muted/40">
                    <div>
                        <h2 className="text-xl font-heading font-bold text-foreground tracking-tight">Iniciar Follow-up</h2>
                        <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase tracking-widest">Lead: {lead.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground hover:bg-card rounded-xl transition-all cursor-pointer">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 space-y-6 flex-1 overflow-y-auto custom-scrollbar">

                    <div className="bg-primary/5 border border-primary/20 p-6 rounded-2xl flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-primary">
                            <CheckCircle2 size={16} />
                            <h3 className="text-xs font-bold uppercase tracking-widest">Resumo de Interesses do Lead</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm font-medium text-foreground/80 mt-2">
                            <div>
                                <span className="text-primary font-extrabold text-[10px] uppercase tracking-widest block mb-0.5">Orçamento Máximo</span>
                                {(() => {
                                    // LeadForm grava em carro_valor_max; valor_maximo é campo legado.
                                    // Sem esse fallback, o orçamento aparecia "Não definido" para quase todo lead real.
                                    const max = lead.preferences.carro_valor_max || lead.preferences.valor_maximo;
                                    return max ? `R$ ${max.toLocaleString()}` : 'Não definido';
                                })()}
                            </div>
                            <div>
                                <span className="text-primary font-extrabold text-[10px] uppercase tracking-widest block mb-0.5">Veículo na Troca</span>
                                {lead.preferences.possui_troca ? lead.preferences.veiculo_troca || 'Simulação com troca' : 'Não'}
                            </div>
                            <div>
                                <span className="text-primary font-extrabold text-[10px] uppercase tracking-widest block mb-0.5">Marcas</span>
                                {lead.preferences.marcas.length > 0 ? lead.preferences.marcas.join(', ') : 'Qualquer Marca'}
                            </div>
                            <div>
                                <span className="text-primary font-extrabold text-[10px] uppercase tracking-widest block mb-0.5">Modelos</span>
                                {lead.preferences.modelos.length > 0 ? lead.preferences.modelos.join(', ') : 'Qualquer Modelo'}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1 flex items-center gap-2">
                                <Calendar size={12} /> Próximo Contato
                            </label>
                            <CustomDatePicker
                                value={nextContactDate}
                                onChange={(date) => setNextContactDate(date)}
                                className="w-full p-4 bg-muted/75 border border-border/85 rounded-2xl outline-none focus:ring-4 focus:ring-ring transition-all font-semibold text-sm text-foreground"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1 flex items-center gap-2">
                                <FileText size={12} /> Motivo do contato / Observações
                            </label>
                            <textarea
                                placeholder="Ex: Mandar fotos do porta malas, negociar IPVA..."
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                className="w-full p-4 bg-muted/75 border border-border/85 rounded-2xl outline-none focus:ring-4 focus:ring-ring transition-all font-semibold text-sm text-foreground resize-none custom-scrollbar"
                                rows={3}
                            />
                        </div>
                    </div>
                </div>

                <div className="p-8 border-t border-border/70 bg-muted/40 flex gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-4 text-muted-foreground hover:text-foreground font-bold text-xs uppercase tracking-widest transition-all cursor-pointer"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => onConfirm()}
                        className="flex-1 py-4 bg-card border border-border/80 text-muted-foreground rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-muted transition-all cursor-pointer"
                    >
                        Pular (Apenas Mover)
                    </button>
                    <button
                        onClick={() => onConfirm({ nextContactDate, notes })}
                        disabled={!nextContactDate}
                        className="flex-1 py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 cursor-pointer"
                    >
                        Confirmar Follow-up
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
