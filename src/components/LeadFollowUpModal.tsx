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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[10000] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white w-[80vw] max-w-5xl h-[80vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-fadeUp" onClick={e => e.stopPropagation()}>
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Iniciar Follow-up</h2>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Lead: {lead.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-600 hover:bg-white rounded-xl transition-all">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 space-y-6 flex-1 overflow-y-auto custom-scrollbar">

                    <div className="bg-brand-50 border border-brand-100 p-6 rounded-2xl flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-brand-600">
                            <CheckCircle2 size={16} />
                            <h3 className="text-xs font-bold uppercase tracking-widest">Resumo de Interesses do Lead</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm font-medium text-slate-700 mt-2">
                            <div>
                                <span className="text-brand-600 font-extrabold text-[10px] uppercase tracking-widest block mb-0.5">Orçamento Máximo</span>
                                R$ {lead.preferences.valor_maximo ? lead.preferences.valor_maximo.toLocaleString() : 'Não definido'}
                            </div>
                            <div>
                                <span className="text-brand-600 font-extrabold text-[10px] uppercase tracking-widest block mb-0.5">Veículo na Troca</span>
                                {lead.preferences.possui_troca ? lead.preferences.veiculo_troca || 'Simulação com troca' : 'Não'}
                            </div>
                            <div>
                                <span className="text-brand-600 font-extrabold text-[10px] uppercase tracking-widest block mb-0.5">Marcas</span>
                                {lead.preferences.marcas.length > 0 ? lead.preferences.marcas.join(', ') : 'Qualquer Marca'}
                            </div>
                            <div>
                                <span className="text-brand-600 font-extrabold text-[10px] uppercase tracking-widest block mb-0.5">Modelos</span>
                                {lead.preferences.modelos.length > 0 ? lead.preferences.modelos.join(', ') : 'Qualquer Modelo'}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                                <Calendar size={12} /> Próximo Contato
                            </label>
                            <CustomDatePicker
                                value={nextContactDate}
                                onChange={(date) => setNextContactDate(date)}
                                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-500/10 transition-all font-semibold text-sm"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                                <FileText size={12} /> Motivo do contato / Observações
                            </label>
                            <textarea
                                placeholder="Ex: Mandar fotos do porta malas, negociar IPVA..."
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-500/10 transition-all font-semibold text-sm resize-none custom-scrollbar"
                                rows={3}
                            />
                        </div>
                    </div>
                </div>

                <div className="p-8 border-t border-slate-100 bg-slate-50 flex gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-4 text-slate-400 hover:text-slate-600 font-bold text-xs uppercase tracking-widest transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => onConfirm()}
                        className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                    >
                        Pular (Apenas Mover)
                    </button>
                    <button
                        onClick={() => onConfirm({ nextContactDate, notes })}
                        disabled={!nextContactDate}
                        className="flex-1 py-4 bg-brand-500 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-brand-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-500/20"
                    >
                        Confirmar Follow-up
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
