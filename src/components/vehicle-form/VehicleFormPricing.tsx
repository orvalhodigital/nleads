import React from 'react';
import { Sparkles } from 'lucide-react';
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
    return (
        <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm space-y-8 animate-fadeUp">
            <div>
                <h3 className="text-lg font-black text-slate-900">Configuração de Valores Comerciais</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wide">Cálculo de Margem & Sugestão de Preço</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Preço de Compra */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Valor Pago no Veículo (Compra)</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
                        <input
                            type="text"
                            value={formatCurrency(formData.purchasePrice || 0)}
                            onChange={e => setFormData(prev => ({ ...prev, purchasePrice: parseCurrency(e.target.value) }))}
                            className="w-full p-4 pl-12 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-semibold text-sm focus:border-violet-500"
                        />
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">Custo de Aquisição Inicial</p>
                </div>

                {/* Custos Operacionais */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Custos de Preparação (Total)</label>
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl h-[54px] flex items-center">
                        <p className="text-sm font-bold text-slate-700">R$ {formatCurrency(totalCosts)}</p>
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">Soma da aba de custos</p>
                </div>

                {/* Preço Sugerido */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Preço Sugerido de Venda</label>
                    <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl h-[54px] flex items-center justify-between">
                        <span className="text-sm font-black text-indigo-700">R$ {formatCurrency(formData.suggestedSalePrice || calculatedSuggestedPrice)}</span>
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, price: formData.suggestedSalePrice || calculatedSuggestedPrice }))}
                            className="text-[9px] font-black uppercase text-indigo-600 bg-white border border-indigo-200 px-3 py-1 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer"
                        >
                            Usar Sugestão
                        </button>
                    </div>
                    <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest px-1 flex items-center gap-1">
                        <Sparkles size={10} /> Sugerido com margem de 20%
                    </p>
                </div>
            </div>

            {/* Definição de preço final de venda */}
            <div className="pt-6 border-t border-slate-100 space-y-4">
                <div className="space-y-2" id="field-price">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Preço Final de Venda (Anunciado)</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-violet-700 font-bold text-sm">R$</span>
                        <input
                            type="text"
                            required
                            value={formatCurrency(formData.price)}
                            onChange={e => setFormData(prev => ({ ...prev, price: parseCurrency(e.target.value) }))}
                            className={getFieldClassName('price', 'w-full p-5 pl-12 bg-violet-50 text-violet-700 border border-violet-100 rounded-2xl outline-none font-black text-lg')}
                        />
                    </div>
                    {errors.price && <p className="text-[10px] font-bold text-red-500 px-1">{errors.price}</p>}
                    <p className="text-[9px] font-bold text-violet-600 uppercase tracking-widest px-1">Este valor aparecerá no seu website e propostas</p>
                </div>
            </div>
        </div>
    );
};
