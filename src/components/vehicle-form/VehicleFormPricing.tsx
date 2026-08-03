import React from 'react';
import { Sparkles, TrendingUp, DollarSign } from 'lucide-react';
import { Vehicle } from '../../types';

interface VehicleFormPricingProps {
    formData: Omit<Vehicle, 'id' | 'status'>;
    setFormData: React.Dispatch<React.SetStateAction<Omit<Vehicle, 'id' | 'status'>>>;
    formatCurrency: (val: number) => string;
    parseCurrency: (val: string) => number;
    totalCosts: number;
    calculatedSuggestedPrice: number;
    errors: Record<string, string>;
    getFieldClassName: (field: string, base: string) => string;
}

export const VehicleFormPricing: React.FC<VehicleFormPricingProps> = ({
    formData,
    setFormData,
    formatCurrency,
    parseCurrency,
    totalCosts,
    calculatedSuggestedPrice,
    errors,
    getFieldClassName
}) => {
    const fipePrice = formData.fipePrice || 0;
    const purchasePrice = formData.purchasePrice || 0;
    const totalInvestment = purchasePrice + totalCosts;
    const finalPrice = formData.price || 0;
    const estimatedProfit = finalPrice > 0 ? finalPrice - totalInvestment : 0;
    const marginPercent = totalInvestment > 0 && finalPrice > 0 ? ((estimatedProfit / totalInvestment) * 100).toFixed(1) : '0';

    return (
        <div className="bg-card rounded-[2.5rem] p-6 sm:p-10 border border-border/80 shadow-sm space-y-8 animate-fadeUp">
            <div>
                <h3 className="text-lg font-heading font-bold text-foreground">Configuração de Valores Comerciais</h3>
                <p className="text-muted-foreground text-xs font-bold uppercase tracking-wide">
                    Tabela FIPE, Cálculo de Margem & Precificação Final
                </p>
            </div>

            {/* Grid principal de 4 pilares financeiros */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Valor Tabela FIPE (Somente Leitura) */}
                <div className="space-y-2 p-5 bg-sky-500/5 border border-sky-500/20 rounded-3xl">
                    <label className="text-[10px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-widest flex items-center gap-1.5">
                        <DollarSign size={12} /> Tabela FIPE (Referência)
                    </label>
                    <div className="p-3.5 bg-card border border-sky-500/30 rounded-2xl h-[50px] flex items-center">
                        <p className="text-sm font-black text-foreground">
                            {fipePrice > 0 ? `R$ ${formatCurrency(fipePrice)}` : 'Não consultada'}
                        </p>
                    </div>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                        Valor oficial do veículo
                    </p>
                </div>

                {/* 2. Preço de Compra */}
                <div className="space-y-2 p-5 bg-muted/40 border border-border/80 rounded-3xl">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        Valor Pago no Veículo (Compra)
                    </label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">R$</span>
                        <input
                            type="text"
                            value={formatCurrency(formData.purchasePrice || 0)}
                            onChange={e => setFormData(prev => ({ ...prev, purchasePrice: parseCurrency(e.target.value) }))}
                            placeholder="0,00"
                            className="w-full p-3.5 pl-11 bg-card border border-border/80 rounded-2xl outline-none font-black text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                        Custo de Aquisição Inicial
                    </p>
                </div>

                {/* 3. Custos Operacionais */}
                <div className="space-y-2 p-5 bg-muted/40 border border-border/80 rounded-3xl">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        Custos de Preparação (Total)
                    </label>
                    <div className="p-3.5 bg-card border border-border/80 rounded-2xl h-[50px] flex items-center">
                        <p className="text-sm font-black text-foreground">R$ {formatCurrency(totalCosts)}</p>
                    </div>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                        Soma da aba de custos
                    </p>
                </div>

                {/* 4. Preço Sugerido */}
                <div className="space-y-2 p-5 bg-primary/5 border border-primary/20 rounded-3xl">
                    <label className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1">
                        <Sparkles size={12} /> Preço Sugerido
                    </label>
                    <div className="p-2.5 bg-card border border-primary/30 rounded-2xl h-[50px] flex items-center justify-between gap-2">
                        <span className="text-xs font-black text-primary truncate">
                            R$ {formatCurrency(formData.suggestedSalePrice || calculatedSuggestedPrice)}
                        </span>
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, price: formData.suggestedSalePrice || calculatedSuggestedPrice }))}
                            className="text-[9px] font-black uppercase text-primary-foreground bg-primary px-2.5 py-1.5 rounded-xl hover:bg-primary/90 transition-colors cursor-pointer shrink-0"
                        >
                            Usar Sugestão
                        </button>
                    </div>
                    <p className="text-[9px] font-bold text-primary/80 uppercase tracking-widest px-1">
                        Margem recomendada de 20%
                    </p>
                </div>
            </div>

            {/* Preço final de venda anunciado + Resumo de Lucratividade */}
            <div className="pt-6 border-t border-border/70 space-y-6">
                <div className="space-y-2" id="field-price">
                    <div className="flex items-center justify-between">
                        <label className="text-[11px] font-black text-foreground uppercase tracking-widest px-1">
                            Preço Final de Venda (Anunciado)*
                        </label>
                        {fipePrice > 0 && finalPrice > 0 && (
                            <span className={`text-[10px] font-extrabold uppercase px-3 py-1 rounded-full ${
                                finalPrice <= fipePrice
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            }`}>
                                {finalPrice <= fipePrice
                                    ? `${(((fipePrice - finalPrice) / fipePrice) * 100).toFixed(1)}% abaixo da FIPE`
                                    : `${(((finalPrice - fipePrice) / fipePrice) * 100).toFixed(1)}% acima da FIPE`
                                }
                            </span>
                        )}
                    </div>

                    <div className="relative">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-primary font-black text-xl">R$</span>
                        <input
                            type="text"
                            required
                            value={formatCurrency(formData.price)}
                            onChange={e => setFormData(prev => ({ ...prev, price: parseCurrency(e.target.value) }))}
                            placeholder="0,00"
                            className={getFieldClassName('price', 'w-full p-5 pl-14 bg-primary/5 text-primary border border-primary/30 rounded-3xl outline-none font-black text-2xl focus:border-primary focus:ring-4 focus:ring-primary/10')}
                        />
                    </div>
                    {errors.price && <p className="text-xs font-bold text-rose-500 px-1">{errors.price}</p>}
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                        Este valor é o que será publicado no seu site e propostas comerciais
                    </p>
                </div>

                {/* Destaque de Lucro Estimado */}
                {finalPrice > 0 && (
                    <div className="p-6 bg-muted/40 border border-border/80 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Lucro Líquido Estimado da Operação</p>
                                <p className="text-xl font-black text-foreground">
                                    R$ {formatCurrency(estimatedProfit)}
                                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 ml-2">
                                        ({marginPercent}% de margem)
                                    </span>
                                </p>
                            </div>
                        </div>

                        <div className="text-right text-xs text-muted-foreground font-medium border-t sm:border-t-0 sm:border-l border-border/80 pt-3 sm:pt-0 sm:pl-6">
                            <p>Investimento total: <strong className="text-foreground">R$ {formatCurrency(totalInvestment)}</strong></p>
                            <p>Tabela FIPE: <strong className="text-foreground">R$ {formatCurrency(fipePrice)}</strong></p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
