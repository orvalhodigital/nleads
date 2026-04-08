import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import { LeadPhase } from '../types';
import {
    CheckCircle2,
    Car,
    DollarSign,
    TrendingUp,
    ChevronRight,
    Award,
    ShoppingBag,
    Search,
    X,
    Zap,
} from 'lucide-react';

import { format, isWithinInterval, startOfDay, endOfDay, subMonths, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CustomDatePicker } from '../components/ui/CustomDatePicker';

import { formatCurrency } from '../utils/formatters';

const SalesClosedPage: React.FC = () => {
    const { leads, vehicles } = useData();
    const navigate = useNavigate();

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState({
        start: format(subMonths(new Date(), 3), 'yyyy-MM-dd'),
        end: format(new Date(), 'yyyy-MM-dd')
    });

    const salesData = useMemo(() => {
        const soldItems = [
            ...vehicles.filter(v => v.status === 'sold' && v.saleDetails).map(v => ({ ...v, item_type: 'vehicle' as const }))
        ];

        let filtered = soldItems
            .map(item => {
                const buyerLead = item.saleDetails?.buyerLeadId
                    ? leads.find(l => l.id === item.saleDetails!.buyerLeadId)
                    : null;

                return {
                    item,
                    buyerLead,
                    salePrice: item.saleDetails!.salePrice,
                    saleDate: item.saleDetails!.saleDate,
                    buyerName: item.saleDetails!.buyerName,
                    profit: item.saleDetails!.salePrice - item.price,
                    cost: item.price,
                    itemType: item.item_type
                };
            });

        // Apply filters
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(s =>
                s.buyerName.toLowerCase().includes(query) ||
                s.item.brand.toLowerCase().includes(query) ||
                s.item.model.toLowerCase().includes(query)
            );
        }

        if (dateRange.start && dateRange.end) {
            const start = startOfDay(parseISO(dateRange.start));
            const end = endOfDay(parseISO(dateRange.end));
            filtered = filtered.filter(s => {
                const saleDate = new Date(s.saleDate);
                return isWithinInterval(saleDate, { start, end });
            });
        }

        return filtered.sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());
    }, [vehicles, leads, searchQuery, dateRange]);


    const totalRevenue = salesData.reduce((sum, s) => sum + s.salePrice, 0);
    const totalProfit = salesData.reduce((sum, s) => sum + s.profit, 0);
    const totalCost = salesData.reduce((sum, s) => sum + s.cost, 0);
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const avgTicket = salesData.length > 0 ? totalRevenue / salesData.length : 0;

    // Monthly sales
    const now = new Date();
    const currentMonthSales = salesData.filter(s => {
        const d = new Date(s.saleDate);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const monthlyRevenue = currentMonthSales.reduce((sum, s) => sum + s.salePrice, 0);

    return (
        <div className="flex flex-col space-y-8 animate-fadeIn pb-10">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <CheckCircle2 className="text-emerald-500" size={32} />
                        Vendas Realizadas
                    </h1>
                    <p className="text-slate-400 font-medium mt-1 text-sm">
                        Histórico completo de veículos vendidos e compradores
                    </p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                            <ShoppingBag size={18} className="text-emerald-500" />
                        </div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            Veículos Vendidos
                        </span>
                    </div>
                    <p className="text-3xl font-black text-slate-900">{salesData.length}</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                            <DollarSign size={18} className="text-blue-500" />
                        </div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Receita no Período</span>
                    </div>
                    <p className="text-2xl font-black text-slate-900">R$ {formatCurrency(totalRevenue)}</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                            <TrendingUp size={18} className="text-violet-500" />
                        </div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Lucro Estimado</span>
                    </div>
                    <p className={`text-2xl font-black ${totalProfit < 0 ? 'text-rose-500' : 'text-emerald-600'}`}>R$ {formatCurrency(totalProfit)}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1">Margem: {profitMargin.toFixed(1)}%{totalProfit < 0 ? ' ⚠️' : ''}</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                            <Zap size={18} className="text-amber-500" />
                        </div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ticket Médio</span>
                    </div>
                    <p className="text-2xl font-black text-slate-900">R$ {formatCurrency(avgTicket)}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1">Nesta Seleção</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-wrap gap-6 items-end">
                <div className="flex-1 min-w-[300px] space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Buscar Venda</label>
                    <div className="relative">
                        <Search className="absolute left-4 top-0 bottom-0 my-auto text-slate-300" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por cliente ou veículo..."
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-50 rounded-2xl text-sm font-bold focus:bg-white focus:border-emerald-500 transition-all outline-none"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Data Inicial</label>
                    <CustomDatePicker
                        value={dateRange.start}
                        onChange={val => setDateRange(prev => ({ ...prev, start: val }))}
                        className="min-w-[160px] px-4 py-4 bg-slate-50 border border-slate-50 rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500/5 transition-all outline-none flex items-center justify-between"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Data Final</label>
                    <CustomDatePicker
                        value={dateRange.end}
                        onChange={val => setDateRange(prev => ({ ...prev, end: val }))}
                        className="min-w-[160px] px-4 py-4 bg-slate-50 border border-slate-50 rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500/5 transition-all outline-none flex items-center justify-between"
                    />
                </div>

                <button
                    onClick={() => {
                        setSearchQuery('');
                        setDateRange({
                            start: format(subMonths(new Date(), 3), 'yyyy-MM-dd'),
                            end: format(new Date(), 'yyyy-MM-dd')
                        });
                    }}
                    className="p-4 bg-slate-50 text-slate-300 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-all"
                    title="Limpar Filtros"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Sales List */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <Award size={16} className="text-emerald-500" />
                        Histórico de Vendas ({salesData.length})
                    </h2>
                </div>

                {salesData.length > 0 ? (
                    <div className="divide-y divide-slate-50">
                        {salesData.map((sale, index) => (
                            <div key={`${sale.itemType}-${sale.item.id}`} className="p-5 hover:bg-slate-50/50 transition-colors group">
                                <div className="flex items-center gap-5">
                                    {/* Item Image */}
                                    <div className="w-20 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                                        {sale.item.imageUrl ? (
                                            <img src={sale.item.imageUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                <Car size={24} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Item Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                                            {sale.item.brand} {sale.item.model}
                                        </h3>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                                {(sale.item as any).year}
                                                {(sale.item as any).modelYear ? `/${String((sale.item as any).modelYear).slice(-2)}` : ''}
                                            </span>
                                            <span className="text-[9px] font-bold text-slate-400">
                                                {(sale.item as any).type} • {(sale.item as any).transmission}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Buyer Info */}
                                    <div className="flex items-center gap-3 min-w-0 shrink-0">
                                        <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black shrink-0 overflow-hidden">
                                            {sale.buyerLead?.foto_url ? (
                                                <img src={sale.buyerLead.foto_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                sale.buyerName.charAt(0)
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-slate-700 truncate">{sale.buyerName}</p>
                                            <p className="text-[9px] font-medium text-slate-400 truncate">
                                                {sale.buyerLead?.phone || 'Comprador'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Sale Details */}
                                    <div className="text-right shrink-0">
                                        <p className="text-lg font-black text-emerald-500">
                                            R$ {formatCurrency(sale.salePrice)}
                                        </p>
                                        <p className="text-[9px] font-bold text-slate-400">
                                            {new Date(sale.saleDate).toLocaleDateString('pt-BR')}
                                        </p>
                                    </div>

                                    {/* Action */}
                                    <div
                                        onClick={() => {
                                            if (sale.buyerLead) navigate(`/leads/${sale.buyerLead.id}`);
                                        }}
                                        className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all cursor-pointer shrink-0"
                                    >
                                        <ChevronRight size={16} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-20 flex flex-col items-center text-center opacity-30 select-none">
                        <Car size={48} strokeWidth={1} />
                        <h3 className="text-sm font-black uppercase tracking-tight mt-2">Nenhuma venda registrada</h3>
                        <p className="text-xs font-medium mt-1">Registre vendas a partir do estoque de veículos</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SalesClosedPage;
