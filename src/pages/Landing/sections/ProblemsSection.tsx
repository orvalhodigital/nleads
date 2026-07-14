import React from 'react';
import { AlertCircle, BarChart3, Users, Zap } from 'lucide-react';

const ProblemsSection: React.FC = () => {
  const problems = [
    {
      icon: AlertCircle,
      title: 'Leads Desorganizados',
      description: 'Planilhas espalhadas, contatos perdidos e acompanhamento inconsistente. Você perde oportunidades todos os dias.',
      pain: '50-70% dos leads são esquecidos'
    },
    {
      icon: BarChart3,
      title: 'Estoque Confuso',
      description: 'Sem visibilidade do que tem em estoque, qual carro vender primeiro, e quanto tempo cada veículo fica parado.',
      pain: '40% do faturamento parado em estoque'
    },
    {
      icon: Users,
      title: 'Equipe Desalinhada',
      description: 'Vendedores não sabem onde está cada lead, sem histórico de contatos, sem saber quem está cuidando de cada cliente.',
      pain: 'Conflitos internos e vendas perdidas'
    },
    {
      icon: Zap,
      title: 'Perda de Tempo',
      description: 'Administração pesada: agendar, confirmar, reportar, registrar. Menos tempo vendendo, mais tempo digitando.',
      pain: '10-15 horas/semana perdidas'
    }
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 mb-4">
            Você enfrenta esses problemas?
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            A maioria das concessionárias perde entre 30-50% de suas vendas potenciais por falta de organização
          </p>
        </div>

        {/* Problems Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {problems.map((problem, index) => {
            const Icon = problem.icon;
            return (
              <div
                key={index}
                className="p-8 rounded-2xl border border-slate-200 hover:border-brand-300 transition-all hover:shadow-xl hover:shadow-brand-50 group"
              >
                <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center text-red-600 mb-4 group-hover:bg-red-100 transition-colors">
                  <Icon size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{problem.title}</h3>
                <p className="text-slate-600 mb-4 leading-relaxed">{problem.description}</p>
                <div className="bg-red-50 px-4 py-2 rounded-lg border border-red-100 inline-block">
                  <p className="text-sm font-bold text-red-700">⚠️ {problem.pain}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 p-8 bg-gradient-to-r from-red-50 to-orange-50 rounded-3xl border border-red-100 text-center">
          <h3 className="text-2xl font-bold text-slate-900 mb-2">
            Isso soa familiar?
          </h3>
          <p className="text-slate-600 mb-4">
            Você não está sozinho. Mas existe uma solução.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ProblemsSection;
