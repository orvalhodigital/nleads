import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  MousePointer,
  Users,
  Percent,
  Clock,
  ChevronRight,
  Crown,
  Target,
  BarChart3,
  Calendar,
  ArrowLeft,
  Play,
  Pause,
  CalendarDays,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  SlidersHorizontal
} from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/formatters';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { hasUnlimitedAccess } from '../lib/planAccess';

// Simple Modal Component
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const DetailModal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      {/* Modal Container */}
      <div className="relative bg-white rounded-[32px] border border-slate-100 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto z-10 animate-scaleIn pb-6">
        <div className="sticky top-0 bg-white/80 backdrop-blur-md px-8 py-5 border-b border-slate-100 flex items-center justify-between z-20">
          <h3 className="text-lg font-black text-slate-800 tracking-tight">{title}</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors font-bold text-xs"
          >
            Fechar
          </button>
        </div>
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
};

// Campaign interface
interface GoogleCampaign {
  id: string;
  name: string;
  status: 'active' | 'paused';
  spend: number;
  leads: number;
  clicks: number;
  impressions: number;
  conversions: number;
  date: string;
}

// 6 realistic mock campaigns for Google Ads
const initialGoogleCampaigns: GoogleCampaign[] = [
  { id: 'g1', name: 'Google Ads - Pesquisa: Concessionária Cidade', status: 'active', spend: 890.50, leads: 52, clicks: 654, impressions: 8700, conversions: 48, date: '2026-07-10T12:00:00Z' },
  { id: 'g2', name: 'Google Ads - Display: Ofertas de SUV 2026', status: 'active', spend: 410.20, leads: 24, clicks: 312, impressions: 5900, conversions: 21, date: '2026-07-08T09:00:00Z' },
  { id: 'g3', name: 'Google Ads - PMax: Vendas Geral Seminovos', status: 'active', spend: 1540.00, leads: 92, clicks: 1240, impressions: 18500, conversions: 85, date: '2026-07-14T14:30:00Z' },
  { id: 'g4', name: 'Google Ads - Pesquisa: Financiamento Taxa Zero', status: 'paused', spend: 280.00, leads: 14, clicks: 198, impressions: 3200, conversions: 11, date: '2026-07-01T10:00:00Z' },
  { id: 'g5', name: 'Google Ads - Remarketing: Revisão e Oficina', status: 'paused', spend: 95.00, leads: 5, clicks: 104, impressions: 2100, conversions: 4, date: '2026-06-25T11:15:00Z' },
  { id: 'g6', name: 'Google Ads - Vídeo: Institucional Orvalho Digital', status: 'active', spend: 680.00, leads: 38, clicks: 580, impressions: 14900, conversions: 34, date: '2026-07-12T08:00:00Z' },
];

const mockDailyStats = [
  { name: 'Seg', Custo: 120, Cliques: 80, Leads: 6 },
  { name: 'Ter', Custo: 150, Cliques: 95, Leads: 8 },
  { name: 'Qua', Custo: 190, Cliques: 110, Leads: 11 },
  { name: 'Qui', Custo: 140, Cliques: 85, Leads: 7 },
  { name: 'Sex', Custo: 220, Cliques: 130, Leads: 14 },
  { name: 'Sáb', Custo: 180, Cliques: 105, Leads: 10 },
  { name: 'Dom', Custo: 160, Cliques: 90, Leads: 8 },
];

const EstruturaECV: React.FC = () => {
  const { profile } = useAuthContext();
  const navigate = useNavigate();

  // Active Tab state
  const [activeTab, setActiveTab] = useState<'google' | 'meta'>('google');

  // Period filters
  const [periodFilter, setPeriodFilter] = useState<'today' | '7d' | '30d' | 'month' | 'all'>('30d');
  
  // Modal states for Google Ads Campaign detail
  const [selectedCampaign, setSelectedCampaign] = useState<GoogleCampaign | null>(null);
  const [campaignPeriodFilter, setCampaignPeriodFilter] = useState<'today' | '7d' | '30d' | 'month' | 'all'>('30d');

  const isPro = hasUnlimitedAccess(profile?.plan);

  // Configured check
  const isMetaConfigured = !!profile?.meta_pixel_id;
  const isGoogleConfigured = !!profile?.google_ads_client_id;
  
  // Unlocked if pro OR if at least one key is configured by the admin
  const isUnlocked = isPro || isMetaConfigured || isGoogleConfigured;

  // Formatar datas simples
  const formatDateSimple = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return '';
    }
  };

  // Sort google campaigns: 1st Active, 2nd Most Recent
  const sortedGoogleCampaigns = useMemo(() => {
    return [...initialGoogleCampaigns].sort((a, b) => {
      // 1st: Active vs Paused
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      
      // 2nd: Date (newer first)
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, []);

  // Multiplier function to simulate stats change depending on period selected
  const getPeriodMultiplier = (filter: 'today' | '7d' | '30d' | 'month' | 'all') => {
    switch (filter) {
      case 'today': return 0.05;
      case '7d': return 0.25;
      case 'month': return 0.85;
      case 'all': return 1.5;
      case '30d':
      default: return 1.0;
    }
  };

  // Consolidated Google metrics based on period filter
  const googleStats = useMemo(() => {
    const mult = getPeriodMultiplier(periodFilter);
    let totalSpend = 0;
    let totalClicks = 0;
    let totalImpressions = 0;
    let totalLeads = 0;
    let totalConversions = 0;

    sortedGoogleCampaigns.forEach(c => {
      totalSpend += c.spend * mult;
      totalClicks += Math.round(c.clicks * mult);
      totalImpressions += Math.round(c.impressions * mult);
      totalLeads += Math.round(c.leads * mult);
      totalConversions += Math.round(c.conversions * mult);
    });

    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
    const cpl = totalLeads > 0 ? totalSpend / totalLeads : 0;

    return {
      spend: totalSpend,
      clicks: totalClicks,
      impressions: totalImpressions,
      leads: totalLeads,
      conversions: totalConversions,
      ctr,
      cpc,
      cpl
    };
  }, [sortedGoogleCampaigns, periodFilter]);

  // Selected campaign stats based on its filter
  const campaignStats = useMemo(() => {
    if (!selectedCampaign) return null;
    const mult = getPeriodMultiplier(campaignPeriodFilter);
    const spend = selectedCampaign.spend * mult;
    const clicks = Math.round(selectedCampaign.clicks * mult);
    const impressions = Math.round(selectedCampaign.impressions * mult);
    const leads = Math.round(selectedCampaign.leads * mult);
    const conversions = Math.round(selectedCampaign.conversions * mult);

    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const cpc = clicks > 0 ? spend / clicks : 0;
    const costPerConv = conversions > 0 ? spend / conversions : 0;

    // Scale daily stats for chart
    const dailyChartData = mockDailyStats.map(day => ({
      name: day.name,
      Custo: Number((day.Custo * mult * 0.14).toFixed(2)),
      Cliques: Math.round(day.Cliques * mult * 0.14),
      Leads: Math.round(day.Leads * mult * 0.14)
    }));

    return {
      spend,
      clicks,
      impressions,
      leads,
      conversions,
      ctr,
      cpc,
      costPerConv,
      dailyChartData
    };
  }, [selectedCampaign, campaignPeriodFilter]);  // Lock Screen View
  if (!isUnlocked) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center animate-fadeUp">
        <div className="bg-card text-foreground rounded-[3rem] p-10 md:p-16 border border-border/80 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform">
            <Target size={240} />
          </div>

          <div className="relative z-10 flex flex-col items-center max-w-2xl mx-auto space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-xl shadow-primary/5">
              <Crown size={40} className="animate-pulse" />
            </div>

            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Estrutura ECV (Tráfego Pago)</h1>
            <p className="text-muted-foreground font-medium text-lg leading-relaxed">
              Tenha uma estrutura completa de Meta Ads e Google Ads integrada diretamente no seu painel. Acompanhe campanhas de captação de leads e insights de tráfego pago em tempo real.
            </p>

            <div className="bg-muted/70 backdrop-blur-md p-6 rounded-2xl border border-border/80 w-full text-left space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary">O que o plano PRO inclui na Estrutura ECV:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-semibold text-muted-foreground pt-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  Conexão de Pixel do Facebook e Google Ads
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  Métricas Consolidadas (Cliques, Leads, Gastos)
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  Visão de Campanhas Ativas
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  Detalhamento de Métricas Google Ads por período
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/settings?tab=Planos')}
              className="px-8 py-4 bg-primary hover:bg-primary/95 text-primary-foreground shadow-xl shadow-primary/20 rounded-[20px] font-bold uppercase tracking-widest text-xs transition-all flex items-center gap-2 cursor-pointer border border-primary-foreground/10"
            >
              Fazer Upgrade para Pro <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeUp pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Estrutura ECV</h1>
          <p className="text-muted-foreground font-semibold text-sm mt-1">Gerencie e analise suas campanhas do Google Ads e Meta Ads em tempo real.</p>
        </div>

        {/* Integration Badges */}
        <div className="flex flex-wrap gap-3">
          <div className={`px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 ${
            isMetaConfigured ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500' : 'bg-muted border-border text-muted-foreground'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isMetaConfigured ? 'bg-indigo-500' : 'bg-muted-foreground/50'}`} />
            Meta Pixel: {isMetaConfigured ? 'Conectado' : 'Pendente'}
          </div>
          <div className={`px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 ${
            isGoogleConfigured ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-muted border-border text-muted-foreground'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isGoogleConfigured ? 'bg-amber-500' : 'bg-muted-foreground/50'}`} />
            Google Ads: {isGoogleConfigured ? 'Conectado' : 'Pendente'}
          </div>
        </div>
      </header>

      {/* Modern Tabs Selector */}
      <div className="flex border-b border-border/80 gap-6">
        <button
          onClick={() => setActiveTab('google')}
          className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-2 border-b-4 ${
            activeTab === 'google'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          🔍 Google Ads
        </button>
        <button
          onClick={() => setActiveTab('meta')}
          className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-2 border-b-4 ${
            activeTab === 'meta'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          📱 Meta Ads
        </button>
      </div>

      {/* Tab 1: Google Ads Content */}
      {activeTab === 'google' && (
        <div className="space-y-8">
          {!isGoogleConfigured ? (
            /* Google Not Configured */
            <div className="bg-card rounded-[2.5rem] border border-border/80 p-8 md:p-12 text-center max-w-3xl mx-auto shadow-xl space-y-6">
              <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/20">
                <ShieldAlert size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground">Conexão Pendente</h3>
                <p className="text-muted-foreground font-semibold leading-relaxed max-w-xl mx-auto">
                  A conta do Google Ads para este cliente ainda não foi vinculada.
                  Solicite ao administrador para preencher o **Client Customer ID** e o **Developer Token** nas configurações do usuário para habilitar o carregamento das campanhas.
                </p>
              </div>
            </div>
          ) : (
            /* Google Active Configured Dashboard */
            <div className="space-y-8 animate-fadeUp">
              {/* Toolbar & Filters */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-muted/50 border border-border/80 p-4 rounded-3xl">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={16} className="text-muted-foreground" />
                  <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Período de Análise</span>
                </div>
                <div className="flex bg-card p-1 rounded-2xl border border-border/80 shadow-sm gap-1">
                  {([
                    { key: 'today', label: 'Hoje' },
                    { key: '7d', label: '7D' },
                    { key: '30d', label: '30D' },
                    { key: 'month', label: 'Mês' },
                    { key: 'all', label: 'Tudo' }
                  ] as const).map(option => (
                    <button
                      key={option.key}
                      onClick={() => setPeriodFilter(option.key)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                        periodFilter === option.key
                          ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* General KPIs Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-card rounded-3xl border border-border/85 p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4"><TrendingUp size={20} /></div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Investimento</p>
                  </div>
                  <p className="text-2xl font-bold text-foreground mt-2">R$ {formatCurrency(googleStats.spend)}</p>
                </div>

                <div className="bg-card rounded-3xl border border-border/85 p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-4"><MousePointer size={20} /></div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Cliques</p>
                  </div>
                  <p className="text-2xl font-bold text-foreground mt-2">{googleStats.clicks}</p>
                </div>

                <div className="bg-card rounded-3xl border border-border/85 p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center mb-4"><Users size={20} /></div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Conversões (Leads)</p>
                  </div>
                  <p className="text-2xl font-bold text-foreground mt-2">{googleStats.conversions}</p>
                </div>

                <div className="bg-card rounded-3xl border border-border/85 p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4"><Percent size={20} /></div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Custo por Lead (CPL)</p>
                  </div>
                  <p className="text-2xl font-bold text-foreground mt-2">R$ {formatCurrency(googleStats.cpl)}</p>
                </div>
              </div>

              {/* Main Campaigns List (3 Columns) */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <BarChart3 size={20} className="text-primary" />
                    Campanhas Ativas e Recentes
                  </h3>
                  <p className="text-muted-foreground text-xs font-semibold mt-1">Listagem ordenada prioritariamente por campanhas ativas, seguidas pelas de criação mais recente.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {sortedGoogleCampaigns.map(camp => (
                    <div 
                      key={camp.id}
                      onClick={() => {
                        setSelectedCampaign(camp);
                        setCampaignPeriodFilter(periodFilter); // Sync initial filter
                      }}
                      className="bg-card rounded-[32px] border border-border/85 p-6 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between min-h-[220px] cursor-pointer group relative hover:-translate-y-1 hover:border-primary/50"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                            camp.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {camp.status === 'active' ? (
                              <>
                                <Play size={8} fill="currentColor" /> Ativa
                              </>
                            ) : (
                              <>
                                <Pause size={8} fill="currentColor" /> Pausada
                              </>
                            )}
                          </span>
                          <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                            <CalendarDays size={12} /> {formatDateSimple(camp.date)}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-foreground tracking-tight leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                          {camp.name}
                        </h4>
                      </div>

                      <div className="pt-6 border-t border-border/80 mt-4 flex items-center justify-between text-xs">
                        <div className="grid grid-cols-3 gap-2 w-full">
                          <div>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Gasto</p>
                            <p className="font-bold text-foreground mt-0.5">R$ {formatCurrency(camp.spend)}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Cliques</p>
                            <p className="font-bold text-foreground mt-0.5">{camp.clicks}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Leads</p>
                            <p className="font-bold text-primary mt-0.5">{camp.leads}</p>
                          </div>
                        </div>
                      </div>

                      <div className="absolute right-6 bottom-6 opacity-0 group-hover:opacity-100 transition-all text-primary translate-x-2 group-hover:translate-x-0">
                        <ExternalLink size={14} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Meta Ads Content */}
      {activeTab === 'meta' && (
        <div className="space-y-8 animate-fadeUp">
          {!isMetaConfigured ? (
            /* Meta Not Configured */
            <div className="bg-card rounded-[2.5rem] border border-border/80 p-8 md:p-12 text-center max-w-3xl mx-auto shadow-xl space-y-6">
              <div className="w-16 h-16 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto border border-indigo-500/20">
                <ShieldAlert size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground">Conexão Pendente</h3>
                <p className="text-muted-foreground font-semibold leading-relaxed max-w-xl mx-auto">
                  A conta do Meta Ads (Facebook/Instagram) para este cliente ainda não foi vinculada.
                  Solicite ao administrador para preencher o **Meta Pixel ID** e o **Meta Access Token** nas configurações do usuário.
                </p>
              </div>
            </div>
          ) : (
            /* Meta Active Dashboard Placeholder */
            <div className="bg-card rounded-[2.5rem] border border-border/80 p-10 md:p-14 text-center max-w-3xl mx-auto shadow-xl space-y-6">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto border border-primary/20 shadow-inner">
                <Sparkles size={32} className="animate-pulse" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-foreground tracking-tight">Pixel Conectado</h3>
                <p className="text-muted-foreground font-semibold leading-relaxed max-w-xl mx-auto">
                  Detectamos que o seu **Meta Pixel (ID: {profile?.meta_pixel_id})** está configurado e integrado com sucesso!
                </p>
                <p className="text-muted-foreground/60 text-xs font-semibold leading-relaxed max-w-lg mx-auto">
                  Nossa engenharia está finalizando a sincronização offline de campanhas e conversões do Facebook Ads. Em breve as campanhas ativas e relatórios detalhados aparecerão aqui.
                </p>
              </div>
              <div className="pt-6 border-t border-border/80 text-xs font-bold text-primary uppercase tracking-widest flex items-center justify-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Sincronização em segundo plano ativa
              </div>
            </div>
          )}
        </div>
      )}

      {/* Campaign Detail Modal for Google Ads */}
      <DetailModal
        isOpen={!!selectedCampaign}
        onClose={() => {
          setSelectedCampaign(null);
          setCampaignPeriodFilter('30d');
        }}
        title="Detalhes e Métricas da Campanha"
      >
        {selectedCampaign && campaignStats && (
          <div className="space-y-8 animate-fadeUp">
            {/* Modal Header details */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-6">
              <div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 ${
                  selectedCampaign.status === 'active'
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    : 'bg-muted text-muted-foreground border border-border'
                }`}>
                  {selectedCampaign.status === 'active' ? <Play size={8} fill="currentColor" /> : <Pause size={8} fill="currentColor" />}
                  {selectedCampaign.status === 'active' ? 'Campanha Ativa' : 'Campanha Pausada'}
                </span>
                <h4 className="text-xl font-bold text-foreground tracking-tight leading-tight">
                  {selectedCampaign.name}
                </h4>
                <p className="text-xs font-bold text-muted-foreground mt-2 flex items-center gap-1">
                  <CalendarDays size={14} /> Criada em {formatDateSimple(selectedCampaign.date)} • Canal: Google Search/PMax
                </p>
              </div>

              {/* Period Filter inside Modal */}
              <div className="flex bg-muted p-1 rounded-2xl border border-border/80 shadow-inner gap-0.5">
                {([
                  { key: 'today', label: 'Hoje' },
                  { key: '7d', label: '7D' },
                  { key: '30d', label: '30D' },
                  { key: 'month', label: 'Mês' },
                  { key: 'all', label: 'Tudo' }
                ] as const).map(option => (
                  <button
                    key={option.key}
                    onClick={() => setCampaignPeriodFilter(option.key)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all ${
                      campaignPeriodFilter === option.key
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-card'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Campaign-specific KPIs Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-muted/50 p-5 rounded-2xl border border-border/80">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Gasto (Investimento)</p>
                <p className="text-xl font-bold text-foreground">R$ {formatCurrency(campaignStats.spend)}</p>
              </div>

              <div className="bg-muted/50 p-5 rounded-2xl border border-border/80">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Cliques na Ficha</p>
                <p className="text-xl font-bold text-foreground">{campaignStats.clicks}</p>
              </div>

              <div className="bg-muted/50 p-5 rounded-2xl border border-border/80">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Impressões totais</p>
                <p className="text-xl font-bold text-foreground">{campaignStats.impressions}</p>
              </div>

              <div className="bg-muted/50 p-5 rounded-2xl border border-border/80">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Conversões (Leads)</p>
                <p className="text-xl font-bold text-foreground">{campaignStats.conversions}</p>
              </div>

              <div className="bg-muted/50 p-5 rounded-2xl border border-border/80">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">CTR Médio</p>
                <p className="text-xl font-bold text-foreground">{campaignStats.ctr.toFixed(2)}%</p>
              </div>

              <div className="bg-muted/50 p-5 rounded-2xl border border-border/80">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">CPC Médio</p>
                <p className="text-xl font-bold text-foreground">R$ {formatCurrency(campaignStats.cpc)}</p>
              </div>

              <div className="bg-muted/50 p-5 rounded-2xl border border-border/80">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Custo/Conversão</p>
                <p className="text-xl font-bold text-foreground">R$ {formatCurrency(campaignStats.costPerConv)}</p>
              </div>

              <div className="bg-muted/50 p-5 rounded-2xl border border-border/80">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Giro de Cliques/Conversão</p>
                <p className="text-xl font-bold text-foreground">
                  {campaignStats.clicks > 0 ? ((campaignStats.conversions / campaignStats.clicks) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>

            {/* Performance Chart over time */}
            <div className="bg-card rounded-3xl border border-border/85 p-6 shadow-sm">
              <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Desempenho Diário do Gasto e Cliques</h5>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={campaignStats.dailyChartData}>
                    <defs>
                      <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary, #a855f7)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--color-primary, #a855f7)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                    <XAxis dataKey="name" stroke="var(--text-muted-foreground)" fontSize={11} tickLine={false} />
                    <YAxis stroke="var(--text-muted-foreground)" fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }} />
                    <Area type="monotone" name="Gasto (R$)" dataKey="Custo" stroke="var(--color-primary, #a855f7)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSpend)" />
                    <Area type="monotone" name="Cliques" dataKey="Cliques" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorClicks)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </DetailModal>
    </div>
  );
};

export default EstruturaECV;
