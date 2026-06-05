import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, Users, MessageSquare, Package, DollarSign,
  AlertCircle, BarChart3, Zap
} from 'lucide-react';

interface Metric {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all metrics in parallel
      const [
        usersRes,
        activeUsersRes,
        proUsersRes,
        leadsRes,
        qualifiedLeadsRes,
        vehiclesRes,
        vehiclesInStockRes,
        completedLeadsRes,
        ticketsRes
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('plan_status', 'active'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('plan', 'pro'),
        supabase.from('leads').select('id', { count: 'exact', head: true }),
        supabase.from('leads').select('id', { count: 'exact', head: true }).in('status', ['qualificado', 'em-contato']),
        supabase.from('vehicles').select('id', { count: 'exact', head: true }),
        supabase.from('vehicles').select('id', { count: 'exact', head: true }).is('sold_date', null),
        supabase.from('leads').select('id', { count: 'exact', head: true }).eq('phase', 'Compradores'),
        supabase.from('support_tickets').select('id', { count: 'exact', head: true }).in('status', ['open', 'in_progress'])
      ]);

      const totalUsers = usersRes.count || 0;
      const activeUsers = activeUsersRes.count || 0;
      const proUsers = proUsersRes.count || 0;
      const totalLeads = leadsRes.count || 0;
      const qualifiedLeads = qualifiedLeadsRes.count || 0;
      const totalVehicles = vehiclesRes.count || 0;
      const vehiclesInStock = vehiclesInStockRes.count || 0;
      const completedLeads = completedLeadsRes.count || 0;
      const openTickets = ticketsRes.count || 0;

      // Métricas reais (sem variações percentuais simuladas — exibimos apenas o valor atual)
      const newMetrics: Metric[] = [
        {
          label: 'Total de Usuários',
          value: totalUsers,
          icon: <Users size={24} />,
          color: 'bg-blue-500'
        },
        {
          label: 'Usuários Ativos',
          value: activeUsers,
          icon: <Zap size={24} />,
          color: 'bg-green-500'
        },
        {
          label: 'Plano PRO',
          value: proUsers,
          icon: <TrendingUp size={24} />,
          color: 'bg-purple-500'
        },
        {
          label: 'Total de Leads',
          value: totalLeads,
          icon: <MessageSquare size={24} />,
          color: 'bg-indigo-500'
        },
        {
          label: 'Leads Qualificados',
          value: qualifiedLeads,
          icon: <AlertCircle size={24} />,
          color: 'bg-amber-500'
        },
        {
          label: 'Veículos em Estoque',
          value: vehiclesInStock,
          icon: <Package size={24} />,
          color: 'bg-cyan-500'
        },
        {
          label: 'Vendas Completadas',
          value: completedLeads,
          icon: <DollarSign size={24} />,
          color: 'bg-emerald-500'
        },
        {
          label: 'Tickets Abertos',
          value: openTickets,
          icon: <AlertCircle size={24} />,
          color: 'bg-red-500'
        }
      ];

      setMetrics(newMetrics);
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError('Erro ao carregar métricas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeUp">
      <header>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Dashboard Administrativo</h1>
        <p className="text-slate-500 font-bold text-sm mt-1">Visão consolidada de toda a plataforma.</p>
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="text-red-600" size={20} />
          <p className="text-red-800 font-medium">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-24 mb-4" />
              <div className="h-8 bg-slate-100 rounded w-16" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((metric, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className={`p-3 rounded-xl text-white ${metric.color}`}>
                    {metric.icon}
                  </span>
                </div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{metric.label}</p>
                <p className="text-3xl font-black text-slate-900 mt-2">{metric.value}</p>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="text-indigo-600" size={24} />
              <h2 className="text-xl font-black text-slate-900">Ações Rápidas</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => navigate('/paineldoadm/users')}
                className="p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-left transition-colors group"
              >
                <p className="text-sm font-bold text-slate-600 group-hover:text-slate-900">Gerenciar Usuários</p>
                <p className="text-xs text-slate-400 mt-1">Ver e editar contas</p>
              </button>
              <button
                onClick={() => navigate('/paineldoadm/tickets')}
                className="p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-left transition-colors group"
              >
                <p className="text-sm font-bold text-slate-600 group-hover:text-slate-900">Tickets de Suporte</p>
                <p className="text-xs text-slate-400 mt-1">Resolver chamados</p>
              </button>
              <button
                onClick={() => navigate('/paineldoadm/plans')}
                className="p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-left transition-colors group"
              >
                <p className="text-sm font-bold text-slate-600 group-hover:text-slate-900">Planos e Campanhas</p>
                <p className="text-xs text-slate-400 mt-1">Gerenciar preços</p>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
