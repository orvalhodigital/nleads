import React from 'react';
import { Plus, PlusCircle, Trash2 } from 'lucide-react';
import { Vehicle } from '../../types';

interface VehicleFormCostsProps {
    formData: Omit<Vehicle, 'id' | 'status'>;
    newCostDesc: string;
    setNewCostDesc: React.Dispatch<React.SetStateAction<string>>;
    newCostAmount: number;
    setNewCostAmount: React.Dispatch<React.SetStateAction<number>>;
    addOperationalCost: (desc: string, amt: number) => void;
    removeOperationalCost: (id: string) => void;
    formatCurrency: (val: number) => string;
    parseCurrency: (val: string) => number;
    totalCosts: number;
}

export const VehicleFormCosts: React.FC<VehicleFormCostsProps> = ({
    formData,
    newCostDesc,
    setNewCostDesc,
    newCostAmount,
    setNewCostAmount,
    addOperationalCost,
    removeOperationalCost,
    formatCurrency,
    parseCurrency,
    totalCosts
}) => {
    return (
        <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm space-y-8 animate-fadeUp">
            <div>
                <h3 className="text-lg font-black text-slate-900">Custos Operacionais do Veículo</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wide">Reparos, Impostos, Preparação e Mídia</p>
            </div>

            {/* Fast inserts buttons */}
            <div className="space-y-2">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Adicionar Custos Frequentes</p>
                <div className="flex flex-wrap gap-2">
                    {[
                        { label: 'Tráfego Pago / Mídia', amount: 150 },
                        { label: 'Oficina Mecânica', amount: 500 },
                        { label: 'Peças de Reposição', amount: 350 },
                        { label: 'Pintura', amount: 400 },
                        { label: 'Polimento', amount: 180 },
                        { label: 'Lavagem Detalhada', amount: 80 },
                        { label: 'Documentação / IPVA', amount: 600 }
                    ].map((item, idx) => (
                        <button
                            type="button"
                            key={idx}
                            onClick={() => addOperationalCost(item.label, item.amount)}
                            className="px-4 py-2.5 bg-slate-50 border border-slate-100 hover:border-violet-500 hover:bg-violet-50/20 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                            <PlusCircle size={14} className="text-violet-600" />
                            {item.label} (R$ {item.amount})
                        </button>
                    ))}
                </div>
            </div>

            {/* Custom inputs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Descrição do Custo</label>
                    <input
                        type="text"
                        value={newCostDesc}
                        onChange={e => setNewCostDesc(e.target.value)}
                        placeholder="Ex: Troca de pastilhas"
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-semibold text-sm focus:border-violet-500"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Valor (R$)</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
                        <input
                            type="text"
                            value={formatCurrency(newCostAmount)}
                            onChange={e => setNewCostAmount(parseCurrency(e.target.value))}
                            className="w-full p-4 pl-12 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-semibold text-sm focus:border-violet-500"
                        />
                    </div>
                </div>
                <div className="flex items-end">
                    <button
                        type="button"
                        onClick={() => addOperationalCost(newCostDesc, newCostAmount)}
                        className="w-full py-4 bg-slate-900 hover:bg-violet-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <Plus size={16} /> Adicionar Custo
                    </button>
                </div>
            </div>

            {/* Costs list */}
            <div className="pt-6 border-t border-slate-100 space-y-4">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Histórico de Custos Adicionados</p>
                
                {(!formData.operationalCosts || formData.operationalCosts.length === 0) ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-slate-400 font-medium text-xs uppercase tracking-wider">Nenhum custo operacional lançado para este veículo.</p>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
                        {formData.operationalCosts.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                <div>
                                    <p className="text-xs font-black text-slate-800">{item.description}</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.date}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs font-black text-slate-900">R$ {formatCurrency(item.amount)}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeOperationalCost(item.id)}
                                        className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors cursor-pointer"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Total summary */}
                <div className="flex justify-between items-center p-6 bg-slate-900 text-white rounded-3xl mt-4">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">Total de Custos de Preparação</span>
                    <span className="text-2xl font-black">R$ {formatCurrency(totalCosts)}</span>
                </div>
            </div>
        </div>
    );
};
