import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, CreditCard, IdCard, DollarSign, CalendarDays, FileText } from 'lucide-react';
import { Lead } from '../types';
import { formatCurrency, parseCurrency } from '../utils/formatters';


interface Props {
    lead: Lead;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data?: { cpf: string; cnh: string; downPayment: number; installments: number; notes: string }) => void;
}

export const LeadSimulationModal: React.FC<Props> = ({ lead, isOpen, onClose, onConfirm }) => {
    const [cpf, setCpf] = useState('');
    const [cnh, setCnh] = useState('');
    const [downPayment, setDownPayment] = useState<number>(0);
    const [installments, setInstallments] = useState('');
    const [notes, setNotes] = useState('');


    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[10000] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white w-[80vw] max-w-5xl h-[80vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-fadeUp" onClick={e => e.stopPropagation()}>
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Iniciar Simulação</h2>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Lead: {lead.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-600 hover:bg-white rounded-xl transition-all">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                                <IdCard size={12} /> CPF (Opcional)
                            </label>
                            <input
                                type="text"
                                placeholder="000.000.000-00"
                                value={cpf}
                                onChange={e => setCpf(e.target.value)}
                                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-500/10 transition-all font-semibold text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                                <CreditCard size={12} /> CNH (Opcional)
                            </label>
                            <input
                                type="text"
                                placeholder="Nº de Registro"
                                value={cnh}
                                onChange={e => setCnh(e.target.value)}
                                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-500/10 transition-all font-semibold text-sm"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                                <DollarSign size={12} /> Valor da Entrada
                            </label>
                            <input
                                type="text"
                                placeholder="R$ 0"
                                value={formatCurrency(downPayment)}
                                onChange={e => setDownPayment(parseCurrency(e.target.value))}
                                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-500/10 transition-all font-semibold text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                                <CalendarDays size={12} /> Quantidade de Parcelas
                            </label>
                            <select
                                value={installments}
                                onChange={e => setInstallments(e.target.value)}
                                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-500/10 transition-all font-semibold text-sm appearance-none"
                            >
                                <option value="">Selecione...</option>
                                <option value="12">12x</option>
                                <option value="24">24x</option>
                                <option value="36">36x</option>
                                <option value="48">48x</option>
                                <option value="60">60x</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                            <FileText size={12} /> Notas da Simulação
                        </label>
                        <textarea
                            placeholder="Detalhes sobre taxas, banco de preferência, restrições..."
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-500/10 transition-all font-semibold text-sm resize-none custom-scrollbar"
                            rows={3}
                        />
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
                        onClick={() => onConfirm({
                            cpf,
                            cnh,
                            downPayment: downPayment || 0,
                            installments: installments ? parseInt(installments) : 0,
                            notes
                        })}
                        className="flex-1 py-4 bg-brand-500 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/20"
                    >
                        Registrar Simulação
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
