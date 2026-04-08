import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface DisqualificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reasons: string[], notes: string) => void;
    leadName?: string;
}

const REASONS = [
    "Comprou no concorrente",
    "Achou o valor muito alto (preço acima do orçamento)",
    "Não tínhamos o modelo/carro específico em estoque",
    "Lead não possui CNH ou score para financiamento insuficiente",
    "Desistiu da compra (mudança de planos pessoais)",
    "Não atende aos requisitos mínimos de entrada",
    "Localização geográfica inviável (fora da área de entrega/atuação)",
    "Dados de contato inválidos (telefone/e-mail inexistentes)",
    "Procura apenas por troca com revenda inviável (veículo atual muito desvalorizado)",
    "Curioso/Apenas pesquisando sem intenção real de compra no momento"
];

const DisqualificationModal: React.FC<DisqualificationModalProps> = ({ isOpen, onClose, onConfirm, leadName }) => {
    const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
    const [notes, setNotes] = useState('');

    if (!isOpen) return null;

    const toggleReason = (reason: string) => {
        if (selectedReasons.includes(reason)) {
            setSelectedReasons(selectedReasons.filter(r => r !== reason));
        } else {
            setSelectedReasons([...selectedReasons, reason]);
        }
    };

    const handleConfirm = () => {
        onConfirm(selectedReasons, notes);
        // Reset state
        setSelectedReasons([]);
        setNotes('');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-scaleIn">
                {/* Header */}
                <div className="bg-red-50 p-6 flex items-center justify-between border-b border-red-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-500">
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-red-900 uppercase tracking-tight">Desqualificar Lead</h3>
                            <p className="text-xs font-bold text-red-400 uppercase tracking-widest">{leadName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-red-500">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    <p className="text-sm font-bold text-slate-500 mb-6">
                        Por qual motivo este lead foi perdido? Selecione uma ou mais opções:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                        {REASONS.map((reason) => (
                            <label
                                key={reason}
                                className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedReasons.includes(reason)
                                        ? 'border-red-500 bg-red-50 text-red-800'
                                        : 'border-slate-100 bg-slate-50 hover:border-red-200 text-slate-600'
                                    }`}
                            >
                                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${selectedReasons.includes(reason) ? 'border-red-500 bg-red-500' : 'border-slate-300 bg-white'
                                    }`}>
                                    {selectedReasons.includes(reason) && <X size={12} className="text-white" />}
                                </div>
                                <span className="text-xs font-bold leading-relaxed">{reason}</span>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={selectedReasons.includes(reason)}
                                    onChange={() => toggleReason(reason)}
                                />
                            </label>
                        ))}
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Informações Adicionais</label>
                        <textarea
                            className="w-full h-32 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium text-slate-700 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all resize-none placeholder:text-slate-400"
                            placeholder="Descreva detalhes importantes sobre o motivo da perda..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-extrabold uppercase tracking-widest hover:bg-slate-100 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-6 py-3 rounded-xl bg-red-500 text-white text-xs font-extrabold uppercase tracking-widest hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all"
                    >
                        Confirmar Desqualificação
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DisqualificationModal;
