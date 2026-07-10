import React from 'react';
import { useData } from '../contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import { 
  Target, 
  TrendingUp, 
  MousePointer, 
  DollarSign, 
  Users, 
  Percent, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Crown,
  ChevronRight
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockDailyStats = [
  { name: 'Seg', Cliques: 45, Leads: 8, Custo: 120 },
  { name: 'Ter', Cliques: 52, Leads: 11, Custo: 140 },
  { name: 'Qua', Cliques: 49, Leads: 9, Custo: 130 },
  { name: 'Qui', Cliques: 63, Leads: 15, Custo: 160 },
  { name: 'Sex', Cliques: 58, Leads: 12, Custo: 150 },
  { name: 'Sáb', Cliques: 72, Leads: 18, Custo: 190 },
  { name: 'Dom', Cliques: 65, Leads: 14, Custo: 170 },
];

const mockCampaigns = [
  { id: 'c1', name: 'Meta Ads - Captação de Leads Geral', platform: 'Meta', status: 'active', spend: 850.50, leads: 57, ctr: '2.4%' },
  { id: 'c2', name: 'Google Ads - Pesquisa: Concessionária Cidade', platform: 'Google', status: 'active', spend: 420.20, leads: 31, ctr: '6.8%' },
  { id: 'c3', name: 'Meta Ads - Retargeting de Visitantes do Site', platform: 'Meta', status: 'active', spend: 310.00, leads: 22, ctr: '4.1%' }
];

const EstruturaECV: React.FC = () => {
  const { profile } = useData();
  const navigate = useNavigate();

  const isPro = profile?.plan === 'pro';

  // Check if at least one connection is configured by the admin
  const isMetaConfigured = !!profile?.meta_pixel_id;
  const isGoogleConfigured = !!profile?.google_ads_client_id;
  const isAnyConfigured = isMetaConfigured || isGoogleConfigured;

  // Lock Screen for Free Users
  if (!isPro) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center animate-fadeUp">
        <div className="bg-slate-900 rounded-[3rem] p-10 md:p-16 text-white shadow-2xl relative overflow-hidden group border-b-8 border-slate-950">
          <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform">
            <Target size={240} />
          </div>

          <div className="relative z-10 flex flex-col items-center max-w-2xl mx-auto space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-violet-500/10 text-violet-500 flex items-center justify-center border border-violet-500/20 shadow-xl shadow-violet-500/5">
              <Crown size={40} className="animate-pulse" />
            </div>

            <h1 className="text-3xl md:text-4xl font-black tracking-tight">Estrutura ECV (Tráfego Pago)</h1>
            <p className="text-slate-400 font-medium text-lg leading-relaxed">
              Tenha uma estrutura completa de Meta Ads e Google Ads integrada diretamente no seu painel. Acompanhe campanhas de captação de leads e insights de tráfego pago em tempo real.
            </p>

            <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 w-full text-left space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-violet-400">O que o plano PRO inclui na Estrutura ECV:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-semibold text-slate-300 pt-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-violet-400" />
                  Conexão de Pixel do Facebook e Google Ads
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-violet-400" />
                  Métricas Consolidadas (Cliques, Leads, Gastos)
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-violet-400" />
                  Visão de Campanhas Ativas
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-violet-400" />
                  Gestão Estruturada de Tráfego
                </div>
              </div>
            </div>

            <button 
              onClick={() => navigate('/settings?tab=Planos')}
              className="mt-4 px-8 py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-bold uppercase tracking-wider text-sm transition-all shadow-xl shadow-violet-600/20 active:scale-95 cursor-pointer flex items-center gap-2"
            >
              Fazer Upgrade para Pro <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeUp">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Estrutura ECV</h1>
          <p className="text-slate-500 font-bold text-sm mt-1">Sua infraestrutura de Tráfego Pago e captação de leads.</p>
        </div>

        {/* Integration Badges */}
        <div className="flex flex-wrap gap-3">
          <div className={`px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 ${
            isMetaConfigured ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-400'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isMetaConfigured ? 'bg-indigo-600' : 'bg-slate-300'}`} />
            Meta Pixel: {isMetaConfigured ? 'Conectado' : 'Pendente'}
          </div>
          <div className={`px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 ${
            isGoogleConfigured ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-400'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isGoogleConfigured ? 'bg-amber-500' : 'bg-slate-300'}`} />
            Google Ads: {isGoogleConfigured ? 'Conectado' : 'Pendente'}
          </div>
        </div>
      </header>

      {!isAnyConfigured ? (
        // Waiting Configuration View
        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 md:p-12 text-center max-w-3xl mx-auto shadow-xl shadow-slate-200/50 space-y-6">
          <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto border border-amber-100">
            <Clock size={32} />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-slate-900">Configuração em Andamento</h3>
            <p className="text-slate-500 font-medium leading-relaxed max-w-xl mx-auto">
              Nossa equipe de tráfego pago está preparando a sua estrutura personalizada do Meta Ads e Google Ads. 
              Assim que o administrador preencher os dados de conexão do seu Pixel e Conta de Anúncios no painel do administrador, 
              suas campanhas ativas e relatórios aparecerão aqui automaticamente.
            </p>
          </div>
          <div className="pt-4 border-t border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-widest">
            Tempo médio de setup: 24 a 48 horas úteis
          </div>
        </div>
      ) : (
        // Configured Dashboard View
        <div className="space-y-8">
          {/* Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 flex items-center gap-4 shadow-sm">
              <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl"><TrendingUp size={24} /></div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Investimento Total</p>
                <p className="text-xl font-black text-slate-900">R$ 1.580,70</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-6 flex items-center gap-4 shadow-sm">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><MousePointer size={24} /></div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cliques</p>
                <p className="text-xl font-black text-slate-900">404</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-6 flex items-center gap-4 shadow-sm">
              <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl"><Users size={24} /></div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Leads Gerados</p>
                <p className="text-xl font-black text-slate-900">110</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-6 flex items-center gap-4 shadow-sm">
              <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl"><Percent size={24} /></div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Custo por Lead</p>
                <p className="text-xl font-black text-slate-900">R$ 14,37</p>
              </div>
            </div>
          </div>

          {/* Graph Section */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-xl shadow-slate-200/50">
            <h3 className="text-lg font-black text-slate-900 mb-6">Desempenho da Fila de Leads (Últimos 7 dias)</h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockDailyStats}>
                  <defs>
                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="Leads" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorLeads)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Active Campaigns Table */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
            <div className="p-8 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">Campanhas Ativas</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                    <th className="px-8 py-5">Campanha</th>
                    <th className="px-8 py-5">Plataforma</th>
                    <th className="px-8 py-5">Valor Investido</th>
                    <th className="px-8 py-5">Leads Gerados</th>
                    <th className="px-8 py-5">CTR</th>
                    <th className="px-8 py-5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {mockCampaigns.map((camp) => (
                    <tr key={camp.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-6 font-black text-slate-900 text-sm">{camp.name}</td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight ${
                          camp.platform === 'Meta' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {camp.platform} Ads
                        </span>
                      </td>
                      <td className="px-8 py-6 font-bold text-slate-600 text-sm">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(camp.spend)}
                      </td>
                      <td className="px-8 py-6 font-black text-slate-900 text-sm">{camp.leads}</td>
                      <td className="px-8 py-6 font-bold text-slate-500 text-sm">{camp.ctr}</td>
                      <td className="px-8 py-6">
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-tight">
                          Ativa
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EstruturaECV;
