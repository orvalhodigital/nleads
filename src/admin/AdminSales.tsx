import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Lead } from '../types';
import { TrendingUp, Clock, AlertCircle, DollarSign, Users } from 'lucide-react';

interface SaleWithDetails extends Lead {
  user_name?: string;
  vehicle_brand?: string;
  vehicle_model?: string;
}

interface SalesStats {
  totalSales: number;
  avgTicket: number;
  totalRevenue: number;
  avgDaysInPhase: number;
}

export default function AdminSales() {
  const [sales, setSales] = useState<SaleWithDetails[]>([]);
  const [stats, setStats] = useState<SalesStats>({
    totalSales: 0,
    avgTicket: 0,
    totalRevenue: 0,
    avgDaysInPhase: 0
  });
  const [loading, setLoading] = useState(true);
  const [phaseFilter, setPhaseFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  const phases = [
    'all',
    'Novo Lead',
    'Visita / Test Drive',
    'Simulação',
    'Follow-up',
    'Aguardando Pagamento',
    'Documentação',
    'Entrega',
    'Compradores'
  ];

  useEffect(() => {
    fetchSalesData();
  }, []);

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Funil de leads por fase (para o pipeline visual e a tabela)
      // + Veículos efetivamente vendidos (fonte real de receita: sale_details.salePrice)
      const [leadsRes, soldRes] = await Promise.all([
        supabase
          .from('leads')
          .select(`
            *,
            profiles:user_id(full_name),
            vehicles:vehicle_id(brand, model)
          `)
          .not('phase', 'is', null)
          .order('created_at', { ascending: false }),
        supabase
          .from('vehicles')
          .select('sale_details, sold_date, created_at')
          .not('sold_date', 'is', null)
      ]);

      if (leadsRes.error) throw leadsRes.error;

      const mapped = (leadsRes.data || []).map((lead: any) => ({
        ...lead,
        user_name: lead.profiles?.full_name,
        vehicle_brand: lead.vehicles?.brand,
        vehicle_model: lead.vehicles?.model
      }));

      setSales(mapped);

      // Estatísticas de venda baseadas em veículos vendidos
      const soldList: any[] = soldRes.data || [];
      const totalRevenue = soldList.reduce((sum, v) => sum + (v.sale_details?.salePrice || 0), 0);
      const unitsSold = soldList.length;
      const avgTicket = unitsSold > 0 ? totalRevenue / unitsSold : 0;

      // Tempo médio de venda (dias entre entrada no estoque e a venda)
      const daysToSell = soldList
        .filter(v => v.created_at && v.sold_date)
        .map(v => (new Date(v.sold_date).getTime() - new Date(v.created_at).getTime()) / (1000 * 60 * 60 * 24))
        .filter(d => d >= 0);
      const avgDays = daysToSell.length > 0 ? daysToSell.reduce((a, b) => a + b, 0) / daysToSell.length : 0;

      setStats({
        totalSales: unitsSold,
        avgTicket: Math.round(avgTicket),
        totalRevenue: Math.round(totalRevenue),
        avgDaysInPhase: Math.round(avgDays)
      });
    } catch (err) {
      console.error('Error fetching sales data:', err);
      setError('Erro ao carregar dados de vendas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const filteredSales = sales.filter(sale => {
    if (phaseFilter === 'all') return true;
    return sale.phase === phaseFilter;
  });

  // Group sales by phase for visual pipeline
  const salesByPhase = phases.filter(p => p !== 'all').map(phase => ({
    phase,
    count: sales.filter(s => s.phase === phase).length,
    sales: sales.filter(s => s.phase === phase)
  }));

  return (
    <div className="space-y-8 animate-fadeUp">
      <header>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Visão de Vendas</h1>
        <p className="text-slate-500 font-bold text-sm mt-1">Pipeline consolidado e estatísticas de conversão.</p>
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="text-red-600" size={20} />
          <p className="text-red-800 font-medium">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-slate-400">Carregando dados de vendas...</div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="p-3 rounded-xl text-white bg-emerald-500">
                  <TrendingUp size={24} />
                </span>
              </div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Veículos Vendidos</p>
              <p className="text-3xl font-black text-slate-900 mt-2">{stats.totalSales}</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="p-3 rounded-xl text-white bg-blue-500">
                  <DollarSign size={24} />
                </span>
              </div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Receita Total</p>
              <p className="text-3xl font-black text-slate-900 mt-2">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 }).format(stats.totalRevenue)}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="p-3 rounded-xl text-white bg-purple-500">
                  <Users size={24} />
                </span>
              </div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Ticket Médio</p>
              <p className="text-3xl font-black text-slate-900 mt-2">
                R$ {stats.avgTicket.toLocaleString('pt-BR')}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="p-3 rounded-xl text-white bg-orange-500">
                  <Clock size={24} />
                </span>
              </div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Tempo Médio de Venda</p>
              <p className="text-3xl font-black text-slate-900 mt-2">{stats.avgDaysInPhase}d</p>
            </div>
          </div>

          {/* Pipeline Visualization */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <h2 className="text-xl font-black text-slate-900 mb-8">Pipeline de Vendas</h2>
            <div className="flex overflow-x-auto gap-4 pb-4">
              {salesByPhase.map((item, idx) => (
                <div
                  key={idx}
                  className="flex-shrink-0 w-48 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 p-4"
                >
                  <div className="text-xs font-black uppercase text-slate-500 mb-2">{item.phase}</div>
                  <div className="text-3xl font-black text-slate-900 mb-4">{item.count}</div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {item.sales.slice(0, 3).map((sale, i) => (
                      <div key={i} className="text-[10px] text-slate-600 truncate bg-white p-2 rounded">
                        {sale.name || 'Sem nome'}
                      </div>
                    ))}
                    {item.sales.length > 3 && (
                      <div className="text-[9px] text-slate-400 italic">
                        +{item.sales.length - 3} mais...
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sales Table */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-900">Todas as Vendas</h2>
              <select
                value={phaseFilter}
                onChange={e => setPhaseFilter(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              >
                {phases.map(phase => (
                  <option key={phase} value={phase}>
                    {phase === 'all' ? 'Todas as fases' : phase}
                  </option>
                ))}
              </select>
            </div>

            {filteredSales.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
                <AlertCircle className="mx-auto text-slate-300 mb-4" size={48} />
                <p className="text-slate-400 font-bold">Nenhuma venda nesta fase.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">
                          Cliente
                        </th>
                        <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">
                          Veículo
                        </th>
                        <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">
                          Usuário
                        </th>
                        <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">
                          Fase Atual
                        </th>
                        <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">
                          Origem
                        </th>
                        <th className="px-6 py-4 text-right text-[10px] font-black uppercase text-slate-400 tracking-widest">
                          Data
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredSales.map(sale => (
                        <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{sale.name || 'Sem nome'}</div>
                            <div className="text-sm text-slate-500">{sale.email || sale.phone}</div>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-900">
                            {sale.vehicle_brand && sale.vehicle_model
                              ? `${sale.vehicle_brand} ${sale.vehicle_model}`
                              : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-900">{sale.user_name || 'N/A'}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-indigo-100 text-indigo-700">
                              {sale.phase}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-left text-sm text-slate-600 capitalize">
                            {sale.source || '—'}
                          </td>
                          <td className="px-6 py-4 text-right text-sm text-slate-400">
                            {sale.created_at ? new Date(sale.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
