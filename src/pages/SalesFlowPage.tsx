import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Calendar, AlertTriangle, CheckCircle2, TrendingUp, Filter, Download } from 'lucide-react';
import { format } from 'date-fns';
import { Lead, LeadPhase, SalePhase } from '../types';
import PageContainer from '../components/ui/PageContainer';
import SalesKanban from '../components/SalesKanban';
import { formatCurrency } from '../utils/formatters';
import PlanLimitAlert from '../components/PlanLimitAlert';

type FilterTab = 'todas' | 'documentacao' | 'entrega' | 'em_garantia' | 'vencidas';

const SALE_PHASE_LABELS: Record<SalePhase, string> = {
  documentacao: 'Documentação',
  entrega: 'Entrega',
  em_garantia: 'Em Garantia',
  apos_garantia: 'Pós-Venda',
};

const SalesFlowPage: React.FC = () => {
  const { leads, profile, refreshLeads, loading } = useData();
  const navigate = useNavigate();

  // Hooks precisam rodar sempre na mesma ordem em todo render — os `return`
  // antecipados abaixo (loading / plano free) ficavam ANTES destes hooks,
  // então na transição loading=true -> false o React chamava um número
  // diferente de hooks entre renders e derrubava a página inteira com
  // "Rendered more hooks than during the previous render". Por isso todos os
  // hooks agora ficam antes de qualquer `return` condicional.
  const [activeTab, setActiveTab] = useState<FilterTab>('todas');

  const completedLeads = useMemo(() => {
    return leads.filter((l) => l.phase === LeadPhase.COMPLETED && l.saleStatus);
  }, [leads]);

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
      avgTimeToDeliver: Math.round(avgTimeToDeliver),
    };
  }, [completedLeads]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  const isFreePlan = !profile?.plan || profile.plan === 'free' || profile.plan === 'trial';
  if (isFreePlan) {
    return (
      <PageContainer className="pb-24">
        <div className="max-w-2xl mx-auto mt-8">
          <PlanLimitAlert
            plan={profile?.plan || 'free'}
            featureName="Fluxo de Vendas"
            email={profile?.email}
          />
        </div>
      </PageContainer>
    );
  }

  const exportCsv = () => {
    const rows = [
      ['Cliente', 'Telefone', 'Fase', 'Data da Venda', 'Data de Entrega', 'Garantia Até', 'Notas de Pós-Venda'],
      ...filteredLeads.map((l) => [
        l.name,
        l.phone || '',
        l.saleStatus ? SALE_PHASE_LABELS[l.saleStatus] : '',
        l.saleDate ? new Date(l.saleDate).toLocaleDateString('pt-BR') : '',
        l.deliveryDate ? new Date(l.deliveryDate).toLocaleDateString('pt-BR') : '',
        l.guaranteeEndsAt ? new Date(l.guaranteeEndsAt).toLocaleDateString('pt-BR') : '',
        l.postSaleNotes || '',
      ]),
    ];

    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(';'))
      .join('\n');

    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fluxo-de-vendas-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <PageContainer className="space-y-8 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <BarChart3 size={32} className="text-brand-500" />
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
                ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20 border border-brand-400/30'
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
          <button
            onClick={exportCsv}
            disabled={filteredLeads.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
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
              className="mt-4 px-6 py-2 rounded-lg bg-brand-500 text-white font-bold text-sm hover:bg-brand-600 transition-all"
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
            color="bg-brand-50"
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
    emerald: 'bg-brand-50 text-brand-600 border-brand-100',
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
