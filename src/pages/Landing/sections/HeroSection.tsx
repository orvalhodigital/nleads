import React from 'react';
import { ArrowRight, Zap } from 'lucide-react';

interface HeroSectionProps {
  onGetStarted: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pt-20 pb-10 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-100/20 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-100/20 rounded-full blur-3xl -z-10" />

      <div className="max-w-4xl mx-auto text-center animate-fadeUp">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full mb-8">
          <Zap size={16} className="text-emerald-600" />
          <span className="text-sm font-bold text-emerald-700">Plataforma #1 em Gestão de Vendas de Veículos</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 mb-6 leading-tight">
          Venda Mais Veículos
          <br />
          <span className="bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
            Sem Perder Clientes
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
          Organize seus leads, gerencie o estoque e feche vendas com um sistema inteligente.
          Menos administrativo. Mais vendas. Começe <span className="font-bold text-emerald-600">totalmente grátis</span>.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <button
            onClick={onGetStarted}
            className="w-full sm:w-auto px-8 py-4 bg-emerald-500 text-white rounded-2xl font-bold text-lg hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/40 active:scale-95 flex items-center justify-center gap-2"
          >
            Começar Grátis
            <ArrowRight size={20} />
          </button>
          <button
            className="w-full sm:w-auto px-8 py-4 bg-white border-2 border-slate-200 text-slate-900 rounded-2xl font-bold text-lg hover:border-slate-300 hover:bg-slate-50 transition-all"
          >
            Ver Demo
          </button>
        </div>

        {/* Trust indicators */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>✓ 100% Seguro</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>✓ Sem Cartão</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>✓ Suporte 24/7</span>
          </div>
        </div>

        {/* Hero Image */}
        <div className="mt-16 relative">
          <div className="bg-gradient-to-b from-slate-100 to-slate-50 rounded-3xl p-8 border border-slate-200 shadow-2xl">
            <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-2xl aspect-video flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">📊</div>
                <p className="text-slate-600 font-semibold">Dashboard em Tempo Real</p>
                <p className="text-sm text-slate-500 mt-2">Visualize todas suas vendas, estoque e leads em um único lugar</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
