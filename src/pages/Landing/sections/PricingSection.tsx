import React from 'react';
import { Check, ArrowRight } from 'lucide-react';

interface PricingSectionProps {
  onGetStarted: () => void;
}

const PricingSection: React.FC<PricingSectionProps> = ({ onGetStarted }) => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 mb-4">
            Preços Simples e Transparentes
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Escolha o plano que funciona para você. Sem surpresas, sem contratos longos.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <div className="p-8 rounded-3xl border-2 border-slate-200 hover:border-slate-300 transition-all bg-white">
            <h3 className="text-2xl font-black text-slate-900 mb-2">Plano Free</h3>
            <p className="text-slate-600 text-sm mb-6">Para quem está começando</p>

            <div className="mb-8">
              <span className="text-4xl font-black text-slate-900">R$ 0</span>
              <span className="text-slate-600 ml-2">/ mês</span>
            </div>

            <div className="space-y-4 mb-8 pb-8 border-b border-slate-200">
              {[
                'Até 10 veículos',
                'Até 50 leads',
                'Gestão de leads',
                'Inventário básico',
                'Agenda de visitas',
                'Relatórios simples',
                'Suporte por email'
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Check size={18} className="text-emerald-500 flex-shrink-0" />
                  <span className="text-slate-700 font-medium">{feature}</span>
                </div>
              ))}
            </div>

            <button
              onClick={onGetStarted}
              className="w-full py-3 bg-slate-100 text-slate-900 rounded-xl font-bold hover:bg-slate-200 transition-all"
            >
              Comece Agora
            </button>
          </div>

          {/* Pro Plan */}
          <div className="p-8 rounded-3xl border-2 border-emerald-500 shadow-2xl shadow-emerald-500/20 bg-white relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-6 py-1 rounded-full text-sm font-bold">
              MAIS POPULAR
            </div>

            <h3 className="text-2xl font-black text-slate-900 mb-2">Plano Pro</h3>
            <p className="text-slate-600 text-sm mb-6">Para vender ainda mais</p>

            <div className="mb-8">
              <span className="text-4xl font-black text-slate-900">R$ 197</span>
              <span className="text-slate-600 ml-2">/ mês</span>
            </div>

            <div className="space-y-4 mb-8 pb-8 border-b border-slate-200">
              {[
                'Veículos ilimitados',
                'Leads ilimitados',
                'Todas as features Free',
                'Website profissional',
                'Integrações avançadas',
                'Relatórios detalhados',
                'Prioridade no suporte',
                'Sem limite de usuários'
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Check size={18} className="text-emerald-500 flex-shrink-0" />
                  <span className="text-slate-700 font-medium">{feature}</span>
                </div>
              ))}
            </div>

            <button
              onClick={onGetStarted}
              className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 group"
            >
              Começar Grátis
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <p className="text-xs text-slate-500 text-center mt-4">
              💳 Sem cartão. Sem compromisso. Cancele quando quiser.
            </p>
          </div>
        </div>

        {/* FAQ Mini */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h3 className="text-xl font-black text-slate-900 mb-6 text-center">
            Dúvidas Frequentes
          </h3>

          <div className="space-y-4">
            {[
              {
                q: 'Preciso de cartão para começar grátis?',
                a: 'Não! Comece completamente grátis sem precisar adicionar nenhum método de pagamento.'
              },
              {
                q: 'Posso fazer upgrade depois?',
                a: 'Sim, a qualquer momento você pode fazer upgrade para o Plano Pro. Seu dados continuam intactos.'
              },
              {
                q: 'E se eu quiser cancelar?',
                a: 'Você pode cancelar sua assinatura a qualquer momento. Sem taxas, sem complicações.'
              }
            ].map((item, index) => (
              <div key={index} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-2">{item.q}</h4>
                <p className="text-slate-600 text-sm">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
