import React from 'react';
import { ArrowRight, Zap } from 'lucide-react';

interface CTASectionProps {
  onGetStarted: () => void;
}

const CTASection: React.FC<CTASectionProps> = ({ onGetStarted }) => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-500 -z-10" />
      <div className="absolute inset-0 opacity-10 -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto text-center">
        {/* Icon */}
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-8">
          <Zap size={32} className="text-white" />
        </div>

        {/* Headline */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-6 leading-tight">
          Pare de Perder Vendas.
          <br />
          Comece Hoje.
        </h2>

        {/* Description */}
        <p className="text-lg text-white/90 max-w-2xl mx-auto mb-8">
          Milhares de concessionários já estão vendendo mais com Otimizza.
          Você pode começar agora, grátis, sem compromisso.
        </p>

        {/* CTA Button */}
        <button
          onClick={onGetStarted}
          className="inline-flex items-center gap-2 px-10 py-5 bg-white text-emerald-600 rounded-2xl font-black text-lg hover:bg-slate-50 transition-all shadow-2xl active:scale-95 mb-6"
        >
          Começar Grátis Agora
          <ArrowRight size={24} />
        </button>

        {/* Trust badges */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-white/80 text-sm font-bold">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white" />
            Sem cartão de crédito
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white" />
            Leva 2 minutos
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white" />
            Suporte 24/7
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
