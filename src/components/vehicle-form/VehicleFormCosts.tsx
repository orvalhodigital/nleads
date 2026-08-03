import React from 'react';
import { Plus, Trash2, FileText, Wrench, Check } from 'lucide-react';
import { Vehicle } from '../../types';

const CUSTOS_NORMAIS = [
    'Documentação',
    'Transferência',
    'IPVA',
    'Licenciamento',
    'Laudo Cautelar',
    'Despachante',
];

const CUSTOS_EXTRAS = [
    'Anúncios / Tráfego Pago',
    'Oficina Mecânica',
    'Peças de Reposição',
    'Funilaria / Pintura',
    'Polimento',
    'Lavagem Detalhada',
    'Pneus',
];

interface VehicleFormCostsProps {
    formData: Omit<Vehicle, 'id' | 'status'>;
    newCostDesc: string;
    setNewCostDesc: React.Dispatch<React.SetStateAction<string>>;
    newCostAmount: number;
    setNewCostAmount: React.Dispatch<React.SetStateAction<number>>;
    addOperationalCost: (desc: string, amt: number) => void;
    removeOperationalCost: (id: string) => void;
    updateOperationalCost: (id: string, amount: number) => void;
    toggleOperationalCostTag: (label: string) => void;
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
    updateOperationalCost,
    toggleOperationalCostTag,
    formatCurrency,
    parseCurrency,
    totalCosts
}) => {
    const isTagAdded = (label: string) => {
        return (formData.operationalCosts || []).some(
            item => item.description.toLowerCase() === label.toLowerCase()
        );
    };

    return (
        <div className="bg-card rounded-[2.5rem] p-6 sm:p-10 border border-border/80 shadow-sm space-y-8 animate-fadeUp">
            <div>
                <h3 className="text-lg font-heading font-bold text-foreground">Custos Operacionais do Veículo</h3>
                <p className="text-muted-foreground text-xs font-bold uppercase tracking-wide">
                    Clique nas categorias para adicionar e informe os valores abaixo
                </p>
            </div>

            {/* Seleção rápida de categorias */}
            <div className="space-y-6">
                {/* Custos Normais */}
                <div className="space-y-3">
                    <p className="text-[11px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider flex items-center gap-1.5">
                        <FileText size={14} /> Custos Normais
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                        {CUSTOS_NORMAIS.map((label) => {
                            const active = isTagAdded(label);
                            return (
                                <button
                                    type="button"
                                    key={label}
                                    onClick={() => toggleOperationalCostTag(label)}
                                    className={`px-4 py-2.5 border text-xs font-bold rounded-2xl transition-all flex items-center gap-2 cursor-pointer active:scale-95 ${
                                        active
                                            ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm'
                                            : 'bg-muted/60 border-border/80 text-foreground/80 hover:border-emerald-500/50 hover:bg-emerald-500/5'
                                    }`}
                                >
                                    {active ? <Check size={14} className="text-emerald-600 dark:text-emerald-400 stroke-[3]" /> : <Plus size={14} className="text-muted-foreground" />}
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Custos Extras */}
                <div className="space-y-3">
                    <p className="text-[11px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider flex items-center gap-1.5">
                        <Wrench size={14} /> Custos Extras
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                        {CUSTOS_EXTRAS.map((label) => {
                            const active = isTagAdded(label);
                            return (
                                <button
                                    type="button"
                                    key={label}
                                    onClick={() => toggleOperationalCostTag(label)}
                                    className={`px-4 py-2.5 border text-xs font-bold rounded-2xl transition-all flex items-center gap-2 cursor-pointer active:scale-95 ${
                                        active
                                            ? 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300 shadow-sm'
                                            : 'bg-muted/60 border-border/80 text-foreground/80 hover:border-amber-500/50 hover:bg-amber-500/5'
                                    }`}
                                >
                                    {active ? <Check size={14} className="text-amber-600 dark:text-amber-400 stroke-[3]" /> : <Plus size={14} className="text-muted-foreground" />}
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Lista de custos lançados com edição direta */}
            <div className="pt-6 border-t border-border/70 space-y-5">
                <div className="flex items-center justify-between">
                    <p className="text-xs font-black uppercase text-foreground tracking-wider">
                        Custos Selecionados & Valores ({formData.operationalCosts?.length || 0})
                    </p>
                    {formData.operationalCosts && formData.operationalCosts.length > 0 && (
                        <p className="text-xs text-muted-foreground font-medium">Digite os valores abaixo:</p>
                    )}
                </div>

                {(!formData.operationalCosts || formData.operationalCosts.length === 0) ? (
                    <div className="p-8 text-center bg-muted/40 rounded-2xl border border-dashed border-border/80">
                        <p className="text-muted-foreground font-medium text-xs uppercase tracking-wider">
                            Nenhum custo selecionado. Clique nas categorias acima para adicionar vários de uma vez!
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto custom-scrollbar p-1">
                        {formData.operationalCosts.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between p-4 bg-muted/40 hover:bg-muted/70 border border-border/80 rounded-2xl transition-colors gap-3"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-foreground truncate">{item.description}</p>
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{item.date}</p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="relative w-32">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-xs">R$</span>
                                        <input
                                            type="text"
                                            value={item.amount > 0 ? formatCurrency(item.amount) : ''}
                                            onChange={e => updateOperationalCost(item.id, parseCurrency(e.target.value))}
                                            placeholder="0,00"
                                            className="w-full py-2 pl-9 pr-3 bg-card border border-border/80 rounded-xl text-right font-black text-xs text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeOperationalCost(item.id)}
                                        title="Remover custo"
                                        className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors cursor-pointer"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Adicionar custo personalizado que não esteja nas tags */}
            <div className="pt-4 border-t border-border/70 space-y-3">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Adicionar outro custo personalizado</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                        type="text"
                        value={newCostDesc}
                        onChange={e => setNewCostDesc(e.target.value)}
                        placeholder="Ex: Alinhamento e Balanceamento"
                        className="sm:col-span-1 p-3.5 bg-muted/65 border border-border/80 rounded-2xl outline-none font-semibold text-xs text-foreground focus:border-primary"
                    />
                    <div className="relative sm:col-span-1">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-xs">R$</span>
                        <input
                            type="text"
                            value={newCostAmount > 0 ? formatCurrency(newCostAmount) : ''}
                            onChange={e => setNewCostAmount(parseCurrency(e.target.value))}
                            placeholder="0,00"
                            className="w-full p-3.5 pl-10 bg-muted/65 border border-border/80 rounded-2xl outline-none font-semibold text-xs text-foreground focus:border-primary"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => addOperationalCost(newCostDesc, newCostAmount)}
                        className="sm:col-span-1 py-3.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-2xl font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <Plus size={16} /> Adicionar Custo
                    </button>
                </div>
            </div>

            {/* Resumo Total */}
            <div className="flex justify-between items-center p-6 bg-primary text-primary-foreground rounded-3xl mt-4 shadow-lg shadow-primary/15">
                <span className="text-xs font-black uppercase tracking-widest opacity-90">Total de Custos de Preparação</span>
                <span className="text-2xl font-heading font-bold">R$ {formatCurrency(totalCosts)}</span>
            </div>
        </div>
    );
};
