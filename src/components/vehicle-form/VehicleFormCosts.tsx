import React from 'react';
import { Plus, PlusCircle, Trash2, FileText, Wrench } from 'lucide-react';
import { Vehicle } from '../../types';

/** Itens frequentes — SEM valor. O preço é sempre digitado pelo lojista. */
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
        <div className="bg-card rounded-[2.5rem] p-10 border border-border/80 shadow-sm space-y-8 animate-fadeUp">
            <div>
                <h3 className="text-lg font-heading font-bold text-foreground">Custos Operacionais do Veículo</h3>
                <p className="text-muted-foreground text-xs font-bold uppercase tracking-wide">Documentação, preparação e mídia</p>
            </div>

            {/* Atalhos: preenchem só a DESCRIÇÃO — o valor é sempre digitado pelo lojista.
                (Antes cada botão lançava um preço fixo inventado, ex.: "Oficina (R$ 500)".) */}
            <div className="space-y-5">
                <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider flex items-center gap-1.5">
                        <FileText size={12} /> Custos Normais
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-muted-foreground font-medium">Documentação, transferência e taxas do processo. Clique para preencher a descrição e digite o valor.</p>
                    <div className="flex flex-wrap gap-2">
                        {CUSTOS_NORMAIS.map((label) => (
                            <button
                                type="button"
                                key={label}
                                onClick={() => setNewCostDesc(label)}
                                className={`px-4 py-2.5 border text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${newCostDesc === label
                                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-400'
                                    : 'bg-muted/60 border-border/80 text-foreground/80 hover:border-emerald-500/50 hover:bg-emerald-500/5'}`}
                            >
                                <PlusCircle size={14} className="text-emerald-600 dark:text-emerald-400" />
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider flex items-center gap-1.5">
                        <Wrench size={12} /> Custos Extras
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-muted-foreground font-medium">Anúncios, oficina e preparação — o que varia de veículo para veículo.</p>
                    <div className="flex flex-wrap gap-2">
                        {CUSTOS_EXTRAS.map((label) => (
                            <button
                                type="button"
                                key={label}
                                onClick={() => setNewCostDesc(label)}
                                className={`px-4 py-2.5 border text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${newCostDesc === label
                                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-amber-400'
                                    : 'bg-muted/60 border-border/80 text-foreground/80 hover:border-amber-500/50 hover:bg-amber-500/5'}`}
                            >
                                <PlusCircle size={14} className="text-amber-600 dark:text-amber-400" />
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Custom inputs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Descrição do Custo</label>
                    <input
                        type="text"
                        value={newCostDesc}
                        onChange={e => setNewCostDesc(e.target.value)}
                        placeholder="Ex: Troca de pastilhas"
                        className="w-full p-4 bg-muted/75 border border-border/85 rounded-2xl outline-none font-semibold text-sm text-foreground focus:bg-card focus:border-primary/45"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Valor (R$)</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">R$</span>
                        <input
                            type="text"
                            value={formatCurrency(newCostAmount)}
                            onChange={e => setNewCostAmount(parseCurrency(e.target.value))}
                            className="w-full p-4 pl-12 bg-muted/75 border border-border/85 rounded-2xl outline-none font-semibold text-sm text-foreground focus:bg-card focus:border-primary/45"
                        />
                    </div>
                </div>
                <div className="flex items-end">
                    <button
                        type="button"
                        onClick={() => addOperationalCost(newCostDesc, newCostAmount)}
                        className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-black text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <Plus size={16} /> Adicionar Custo
                    </button>
                </div>
            </div>

            {/* Costs list */}
            <div className="pt-6 border-t border-border/70 space-y-4">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Histórico de Custos Adicionados</p>

                {(!formData.operationalCosts || formData.operationalCosts.length === 0) ? (
                    <div className="p-8 text-center bg-muted/50 rounded-2xl border border-border/70">
                        <p className="text-muted-foreground font-medium text-xs uppercase tracking-wider">Nenhum custo operacional lançado para este veículo.</p>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
                        {formData.operationalCosts.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-4 bg-muted/50 border border-border/70 rounded-2xl">
                                <div>
                                    <p className="text-xs font-black text-foreground">{item.description}</p>
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{item.date}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs font-black text-foreground">R$ {formatCurrency(item.amount)}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeOperationalCost(item.id)}
                                        className="w-8 h-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 transition-colors cursor-pointer"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Total summary */}
                <div className="flex justify-between items-center p-6 bg-primary text-primary-foreground rounded-3xl mt-4">
                    <span className="text-xs font-black uppercase tracking-widest opacity-80">Total de Custos de Preparação</span>
                    <span className="text-2xl font-heading font-bold">R$ {formatCurrency(totalCosts)}</span>
                </div>
            </div>
        </div>
    );
};
