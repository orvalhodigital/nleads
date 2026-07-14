import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { Vehicle } from '../../types';

interface VehicleFormSeoProps {
    formData: Omit<Vehicle, 'id' | 'status'>;
    setFormData: React.Dispatch<React.SetStateAction<Omit<Vehicle, 'id' | 'status'>>>;
    handleGenerateAI: () => Promise<void>;
    aiGenerating: boolean;
}

export const VehicleFormSeo: React.FC<VehicleFormSeoProps> = ({
    formData,
    setFormData,
    handleGenerateAI,
    aiGenerating
}) => {
    return (
        <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm space-y-8 animate-fadeUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                    <h3 className="text-lg font-black text-slate-900">Otimização para Mecanismos de Busca (SEO)</h3>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wide">Indexação Google & IA</p>
                </div>
                <button
                    type="button"
                    onClick={handleGenerateAI}
                    disabled={aiGenerating}
                    className="px-5 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                    {aiGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    Gerar com IA
                </button>
            </div>

            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">SEO Headline (Título no Google)</label>
                    <input
                        type="text"
                        value={formData.seoHeadline || ''}
                        onChange={e => setFormData(prev => ({ ...prev, seoHeadline: e.target.value }))}
                        maxLength={70}
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-semibold text-sm focus:border-violet-500 focus:ring-4 focus:ring-violet-500/5 transition-all"
                        placeholder="Ex: Compre Chevrolet Onix 1.6 Flex 2022 Conservado | Nome Concessionária"
                    />
                    <span className="text-[9px] font-bold text-slate-300 block text-right">{(formData.seoHeadline || '').length}/70 caracteres recomendados</span>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Meta Descrição (Snippet de Busca)</label>
                    <textarea
                        value={formData.seoDescription || ''}
                        onChange={e => setFormData(prev => ({ ...prev, seoDescription: e.target.value }))}
                        maxLength={160}
                        className="w-full p-4 h-32 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-semibold text-sm focus:border-violet-500 focus:ring-4 focus:ring-violet-500/5 transition-all resize-none"
                        placeholder="Ex: Oferta imperdível de Onix 2022! Câmbio automático, laudo cautelar aprovado e garantia de 90 dias. Confira as condições exclusivas de financiamento..."
                    />
                    <span className="text-[9px] font-bold text-slate-300 block text-right">{(formData.seoDescription || '').length}/160 caracteres recomendados</span>
                </div>
            </div>

            {/* Google Preview Widget */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">Prévia no Google Search</p>
                <div className="space-y-1">
                    <p className="text-[11px] text-slate-500 font-medium font-sans">https://sualoja.com.br/estoque/{formData.model?.toLowerCase() || 'veiculo'}</p>
                    <h4 className="text-indigo-600 font-sans hover:underline text-lg font-medium leading-snug cursor-pointer">
                        {formData.seoHeadline || `${formData.brand} ${formData.model} ${formData.year} à Venda - Loja`}
                    </h4>
                    <p className="text-slate-600 text-xs font-sans leading-relaxed">
                        {formData.seoDescription || 'Confira os opcionais, quilometragem, fotos e preço e agende uma visita agora mesmo para simular o financiamento...'}
                    </p>
                </div>
            </div>
        </div>
    );
};
