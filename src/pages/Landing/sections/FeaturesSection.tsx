import React from 'react';
import { Users, Car, Calendar, TrendingUp, Globe, Zap } from 'lucide-react';

const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: Users,
      title: 'Gestão de Leads',
      description: 'Organize leads por fase, origem e temperatura. Saiba exatamente onde cada cliente está na jornada de compra.'
    },
    {
      icon: Car,
      title: 'Inventário Inteligente',
      description: 'Visualize todo seu estoque, marque como reservado, vendido ou em trânsito. Saiba qual carro vender primeiro.'
    },
    {
      icon: Calendar,
      title: 'Agenda de Visitas',
      description: 'Agende test drives, confirmações automáticas por WhatsApp e lembre seus clientes na hora.'
    },
    {
      icon: TrendingUp,
      title: 'Relatórios & Análise',
      description: 'Métricas em tempo real: taxa de conversão, ticket médio, estoque parado, e muito mais.'
    },
    {
      icon: Globe,
      title: 'Website Profissional',
      description: 'Seu catálogo de veículos online. Clientes veem o estoque, agrendam visitas, e você vende 24/7.'
    },
    {
      icon: Zap,
      title: 'Integrações',
      description: 'Conecte com WhatsApp, Email, Google Maps e outras ferramentas que você já usa.'
    }
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 mb-4">
            Tudo que você precisa
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Uma plataforma completa para vender mais e melhor
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="p-8 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all hover:shadow-xl hover:shadow-emerald-50 group hover:-translate-y-1"
              >
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 mb-4 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                  <Icon size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>

        {/* Bottom section */}
        <div className="mt-16 p-8 lg:p-12 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-3xl text-white">
          <div className="max-w-2xl">
            <h3 className="text-2xl lg:text-3xl font-black mb-4">
              Tudo isso no Plano Free
            </h3>
            <p className="text-lg text-emerald-50 mb-6">
              Comece a usar Otimizza 100% grátis. Sem cartão, sem surpresas, sem limite de tempo.
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm font-bold">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-white" />
                <span>Até 10 veículos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-white" />
                <span>Até 50 leads</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-white" />
                <span>Agenda + Relatórios</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-white" />
                <span>Suporte 24/7</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
