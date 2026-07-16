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
        <div className="bg-card rounded-[2.5rem] p-10 border border-border/80 shadow-sm space-y-8 animate-fadeUp">
            <div className="flex items-center justify-between border-b border-border/70 pb-4 gap-4">
                <div>
                    <h3 className="text-lg font-heading font-bold text-foreground">Otimização para Mecanismos de Busca (SEO)</h3>
                    <p className="text-muted-foreground text-xs font-bold uppercase tracking-wide">Indexação Google & IA</p>
                </div>
                <button
                    type="button"
                    onClick={handleGenerateAI}
                    disabled={aiGenerating}
                    className="px-5 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-primary/20 disabled:opacity-50 shrink-0"
                >
                    {aiGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    {aiGenerating ? 'Gerando...' : 'Gerar com IA'}
                </button>
            </div>

            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">SEO Headline (Título no Google)</label>
                    <input
                        type="text"
                        value={formData.seoHeadline || ''}
                        onChange={e => setFormData(prev => ({ ...prev, seoHeadline: e.target.value }))}
                        maxLength={70}
                        className="w-full p-4 bg-muted/75 border border-border/85 rounded-2xl outline-none font-semibold text-sm text-foreground focus:bg-card focus:border-primary/45 focus:ring-4 focus:ring-ring transition-all"
                        placeholder="Ex: Compre Chevrolet Onix 1.6 Flex 2022 Conservado | Nome Concessionária"
                    />
                    <span className="text-[9px] font-bold text-muted-foreground/60 block text-right">{(formData.seoHeadline || '').length}/70 caracteres recomendados</span>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Meta Descrição (Snippet de Busca)</label>
                    <textarea
                        value={formData.seoDescription || ''}
                        onChange={e => setFormData(prev => ({ ...prev, seoDescription: e.target.value }))}
                        maxLength={160}
                        className="w-full p-4 h-32 bg-muted/75 border border-border/85 rounded-2xl outline-none font-semibold text-sm text-foreground focus:bg-card focus:border-primary/45 focus:ring-4 focus:ring-ring transition-all resize-none"
                        placeholder="Ex: Oferta imperdível de Onix 2022! Câmbio automático, laudo cautelar aprovado e garantia de 90 dias. Confira as condições exclusivas de financiamento..."
                    />
                    <span className="text-[9px] font-bold text-muted-foreground/60 block text-right">{(formData.seoDescription || '').length}/160 caracteres recomendados</span>
                </div>
            </div>

            {/* Google Preview Widget */}
            <div className="p-6 bg-muted/50 rounded-2xl border border-border/70">
                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-3">Prévia no Google Search</p>
                <div className="space-y-1">
                    <p className="text-[11px] text-muted-foreground font-medium font-sans">https://sualoja.com.br/estoque/{formData.model?.toLowerCase() || 'veiculo'}</p>
                    <h4 className="text-primary font-sans hover:underline text-lg font-medium leading-snug cursor-pointer">
                        {formData.seoHeadline || `${formData.brand} ${formData.model} ${formData.year} à Venda - Loja`}
                    </h4>
                    <p className="text-foreground/70 text-xs font-sans leading-relaxed">
                        {formData.seoDescription || 'Confira os opcionais, quilometragem, fotos e preço e agende uma visita agora mesmo para simular o financiamento...'}
                    </p>
                </div>
            </div>
        </div>
    );
};
