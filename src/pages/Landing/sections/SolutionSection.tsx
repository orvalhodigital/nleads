import React from 'react';
import { CheckCircle2, Lightbulb } from 'lucide-react';

const SolutionSection: React.FC = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-emerald-50 to-white">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Text */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Lightbulb size={24} className="text-emerald-600" />
              </div>
              <span className="text-sm font-bold text-emerald-700 uppercase tracking-wide">A Solução</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-6 leading-tight">
              Um sistema que
              <br />
              <span className="text-emerald-600">funciona como você</span>
            </h2>

            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              Otimizza é uma plataforma completa de gestão de vendas de veículos. Organiza leads, estoque, agenda e vendas em um único lugar. Seu time vende mais, você dorme tranquilo.
            </p>

            <ul className="space-y-4 mb-8">
              {[
                'Dashboard com visão 360° do seu negócio',
                'Leads sempre organizados e categorizados',
                'Agenda de visitas integrada',
                'Histórico completo de cada cliente',
                'Relatórios e métricas em tempo real',
                'Integrações com WhatsApp e Email'
              ].map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700 font-medium">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200">
              <p className="text-sm font-bold text-emerald-700 uppercase tracking-wide mb-2">Resultado Real</p>
              <p className="text-2xl font-black text-emerald-600">+45% de vendas</p>
              <p className="text-sm text-emerald-700 mt-1">em média, nos primeiros 3 meses</p>
            </div>
          </div>

          {/* Right side - Visual */}
          <div className="relative">
            <div className="bg-gradient-to-br from-slate-100 to-slate-50 rounded-3xl p-8 border border-slate-200 shadow-2xl">
              <div className="space-y-4">
                {/* Card 1 - Leads */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase">Leads Este Mês</p>
                      <p className="text-2xl font-black text-slate-900">127</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-xl">👥</span>
                    </div>
                  </div>
                  <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 w-3/4 rounded-full" />
                  </div>
                </div>

                {/* Card 2 - Vendas */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase">Vendas Confirmadas</p>
                      <p className="text-2xl font-black text-slate-900">R$ 89.500</p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <span className="text-xl">💰</span>
                    </div>
                  </div>
                  <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-4/5 rounded-full" />
                  </div>
                </div>

                {/* Card 3 - Agenda */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase">Agendadas Hoje</p>
                      <p className="text-2xl font-black text-slate-900">5</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-xl">📅</span>
                    </div>
                  </div>
                  <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 w-2/3 rounded-full" />
                  </div>
                </div>
              </div>

              {/* Badge */}
              <div className="mt-6 pt-6 border-t border-slate-200">
                <p className="text-xs text-slate-600 text-center">
                  ✓ Dashboard em tempo real
                </p>
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -bottom-4 -right-4 bg-emerald-500 text-white px-4 py-2 rounded-full shadow-lg font-bold text-sm">
              Sempre atualizado
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
