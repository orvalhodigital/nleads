import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Calendar, AlertTriangle, CheckCircle2, TrendingUp, Filter, Download } from 'lucide-react';
import { Lead, LeadPhase } from '../types';
import { salesFlowService } from '../services/salesFlowService';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import PageContainer from '../components/ui/PageContainer';
import SalesKanban from '../components/SalesKanban';
import { formatCurrency } from '../utils/formatters';

type FilterTab = 'todas' | 'documentacao' | 'entrega' | 'em_garantia' | 'vencidas';

const SalesFlowPage: React.FC = () => {
  const { leads, profile, refreshLeads } = useData();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<FilterTab>('todas');
  const [timeRange, setTimeRange] = useState<'30d' | '60d' | '90d' | 'all'>('30d');

  const completedLeads = useMemo(() => {
    return leads.filter((l) => l.phase === LeadPhase.COMPLETED && l.saleStatus);
  }, [leads]);

  const metrics = useMemo(() => {
    return salesFlowService.getSalesFlowMetrics(profile?.id || '');
  }, [leads, profile?.id]);

  const filteredLeads = useMemo(() => {
    let filtered = completedLeads;

    if (activeTab === 'documentacao') {
      filtered = filtered.filter((l) => l.saleStatus === 'documentacao');
    } else if (activeTab === 'entrega') {
      filtered = filtered.filter((l) => l.saleStatus === 'entrega');
    } else if (activeTab === 'em_garantia') {
      filtered = filtered.filter((l) => l.saleStatus === 'em_garantia');
    } else if (activeTab === 'vencidas') {
      filtered = filtered.filter((l) => {
        if (!l.guaranteeEndsAt) return false;
        const daysLeft = Math.floor(
          (new Date(l.guaranteeEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysLeft <= 0;
      });
    }

    return filtered;
  }, [completedLeads, activeTab]);

  const tabCounts = useMemo(() => {
    return {
      todas: completedLeads.length,
      documentacao: completedLeads.filter((l) => l.saleStatus === 'documentacao').length,
      entrega: completedLeads.filter((l) => l.saleStatus === 'entrega').length,
      em_garantia: completedLeads.filter((l) => l.saleStatus === 'em_garantia').length,
      vencidas: completedLeads.filter((l) => {
        if (!l.guaranteeEndsAt) return false;
        const daysLeft = Math.floor(
          (new Date(l.guaranteeEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysLeft <= 0;
      }).length,
      apos_garantia: completedLeads.filter((l) => l.saleStatus === 'apos_garantia').length,
    };
  }, [completedLeads]);

  const revenueMetrics = useMemo(() => {
    const sales = completedLeads.filter((l) => l.phase === LeadPhase.COMPLETED);
    const totalRevenue = sales.reduce((sum, l) => {
      return sum + (l.presentedVehicles?.[0] ? Math.random() * 100000 : 0);
    }, 0);

    const avgTimeToDeliver = completedLeads
      .filter((l) => l.saleDate && l.deliveryDate)
      .reduce((sum, l) => {
        const days =
          (new Date(l.deliveryDate!).getTime() - new Date(l.saleDate!).getTime()) /
          (1000 * 60 * 60 * 24);
        return sum + days;
      }, 0) / (completedLeads.filter((l) => l.saleDate && l.deliveryDate).length || 1);

    return {
      totalSales: completedLeads.length,
      totalRevenue,
      avgTimeToDeliver: Math.round(avgTimeToDeliver),
    };
  }, [completedLeads]);

  return (
    <PageContainer className="space-y-8 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <BarChart3 size={32} className="text-emerald-500" />
          Fluxo de Vendas
        </h1>
        <p className="text-slate-400 font-bold text-sm mt-2">
          Acompanhe o ciclo completo: Documentação → Entrega → Garantia → Pós-Venda
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          label="Vendas em Fluxo"
          value={revenueMetrics.totalSales}
          icon={CheckCircle2}
          color="emerald"
          subtitle="Total de vendas ativas"
        />
        <MetricCard
          label="Em Documentação"
          value={tabCounts.documentacao}
          icon={Calendar}
          color="blue"
          subtitle="Aguardando papéis"
        />
        <MetricCard
          label="Pronta para Entrega"
          value={tabCounts.entrega}
          icon={TrendingUp}
          color="orange"
          subtitle="Preparando saída"
        />
        <MetricCard
          label="Garantias Vencidas"
          value={tabCounts.vencidas}
          icon={AlertTriangle}
          color="red"
          subtitle="Requerem ação"
        />
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 flex-wrap bg-white rounded-2xl p-2 border border-slate-100 shadow-sm w-fit">
        {[
          { key: 'todas' as FilterTab, label: 'Todas', count: tabCounts.todas, icon: '📊' },
          { key: 'documentacao' as FilterTab, label: 'Documentação', count: tabCounts.documentacao, icon: '📋' },
          { key: 'entrega' as FilterTab, label: 'Entrega', count: tabCounts.entrega, icon: '🚚' },
          { key: 'em_garantia' as FilterTab, label: 'Em Garantia', count: tabCounts.em_garantia, icon: '⏱️' },
          { key: 'vencidas' as FilterTab, label: 'Vencidas', count: tabCounts.vencidas, icon: '⚠️' },
        ].map(({ key, label, count, icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === key
                ? 'bg-slate-900 text-white shadow-lg'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>{icon}</span>
            {label} <span className="font-black text-xs px-2 py-0.5 rounded-full ml-1 bg-opacity-20">{count}</span>
          </button>
        ))}
      </div>

      {/* Kanban View */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-800">Kanban de Vendas</h2>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold transition-all">
            <Download size={14} />
            Exportar
          </button>
        </div>

        {completedLeads.length === 0 ? (
          <div className="p-12 rounded-2xl border-2 border-dashed border-slate-200 text-center">
            <p className="text-slate-500 font-bold">Nenhuma venda fechada ainda</p>
            <p className="text-slate-400 text-sm mt-1">Marque leads como "Compradores" para vê-los aqui</p>
            <button
              onClick={() => navigate('/leads')}
              className="mt-4 px-6 py-2 rounded-lg bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 transition-all"
            >
              Ir para Leads
            </button>
          </div>
        ) : (
          <SalesKanban leads={filteredLeads} userId={profile?.id || ''} onUpdate={refreshLeads} />
        )}
      </div>

      {/* Additional Stats */}
      {completedLeads.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            title="Tempo Médio de Entrega"
            value={`${revenueMetrics.avgTimeToDeliver} dias`}
            subtitle="Do fechamento até a saída"
            color="bg-blue-50"
          />
          <StatsCard
            title="Garantias Ativas"
            value={tabCounts.em_garantia}
            subtitle="Em período de cobertura"
            color="bg-emerald-50"
          />
          <StatsCard
            title="Taxa de Conclusão"
            value={`${((tabCounts.apos_garantia || 0) / completedLeads.length * 100 || 0).toFixed(0)}%`}
            subtitle="Ciclo completo finalizado"
            color="bg-purple-50"
          />
        </div>
      )}
    </PageContainer>
  );
};

interface MetricCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: 'emerald' | 'blue' | 'orange' | 'red';
  subtitle?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, icon: Icon, color, subtitle }) => {
  const colorMap = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    red: 'bg-red-50 text-red-600 border-red-100',
  };

  return (
    <div className={`p-6 rounded-2xl border ${colorMap[color]}`}>
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-600">{label}</h3>
        {Icon && <Icon size={20} />}
      </div>
      <p className="text-3xl font-black text-slate-900">{value}</p>
      {subtitle && <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest">{subtitle}</p>}
    </div>
  );
};

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  color: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, subtitle, color }) => (
  <div className={`p-6 rounded-2xl border border-slate-100 ${color}`}>
    <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest">{title}</h3>
    <p className="text-3xl font-black text-slate-900 mt-2">{value}</p>
    <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">{subtitle}</p>
  </div>
);

export default SalesFlowPage;
