import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useNavigate } from 'react-router-dom';
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
    TrendingDown,
    Zap,
    Download,
    CalendarRange,
    User,
    Percent,
    Clock3
} from 'lucide-react';

import { format, isWithinInterval, startOfDay, endOfDay, subMonths, parseISO, subDays, startOfYear, differenceInCalendarDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CustomDatePicker } from '../components/ui/CustomDatePicker';

import { formatCurrency } from '../utils/formatters';
import { Motorcycle } from '../types';
import PageContainer from '../components/ui/PageContainer';

type SaleDashboardItem = {
    vehicle: any;
    buyerLead: any;
    salePrice: number;
    saleDate: string;
    buyerName: string;
    profit: number;
    costBasis: number;
    refurbishmentCosts: number;
    margin: number;
    daysToSell: number | null;
    transactionLabel: string;
};

type QuickRange = '7d' | '30d' | 'year' | 'custom';

const SalesClosedPage: React.FC = () => {
    const { leads, vehicles, motorcycles } = useData();
    const navigate = useNavigate();

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [quickRange, setQuickRange] = useState<QuickRange>('30d');
    const [dateRange, setDateRange] = useState({
        start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
        end: format(new Date(), 'yyyy-MM-dd')
    });

    const soldAssets = useMemo(() => {
        const normalizedMotorcycles = motorcycles.map((m: Motorcycle) => ({
            ...m,
            type: m.category,
            transmission: 'Manual',
            createdAt: m.saleDetails?.saleDate || null,
            assetKind: 'motorcycle' as const,
        }));

        return [...vehicles.map(v => ({ ...v, assetKind: 'vehicle' as const })), ...normalizedMotorcycles];
    }, [vehicles, motorcycles]);

    const applyQuickRange = (range: QuickRange) => {
        const now = new Date();
        setQuickRange(range);

        if (range === '7d') {
            setDateRange({ start: format(subDays(now, 7), 'yyyy-MM-dd'), end: format(now, 'yyyy-MM-dd') });
        } else if (range === '30d') {
            setDateRange({ start: format(subDays(now, 30), 'yyyy-MM-dd'), end: format(now, 'yyyy-MM-dd') });
        } else if (range === 'year') {
            setDateRange({ start: format(startOfYear(now), 'yyyy-MM-dd'), end: format(now, 'yyyy-MM-dd') });
        }
    };

    const salesData = useMemo<SaleDashboardItem[]>(() => {
        const soldVehicles = soldAssets.filter(v => v.status === 'sold' && v.saleDetails);

        let filtered = soldVehicles
            .map(vehicle => {
                const buyerLead = vehicle.saleDetails?.buyerLeadId
                    ? leads.find(l => l.id === vehicle.saleDetails!.buyerLeadId)
                    : null;
                const refurbishmentCosts = vehicle.saleDetails?.refurbishmentCosts ?? 0;
                const costBasis = vehicle.fipePrice ?? vehicle.price ?? 0;
                const profit = vehicle.saleDetails!.salePrice - (costBasis + refurbishmentCosts);
                const margin = vehicle.saleDetails!.salePrice > 0 ? (profit / vehicle.saleDetails!.salePrice) * 100 : 0;
                const createdReference = vehicle.createdAt || vehicle.saleDetails?.saleDate;
                const daysToSell = createdReference ? Math.max(0, differenceInCalendarDays(parseISO(vehicle.saleDetails!.saleDate), parseISO(createdReference))) : null;

                return {
                    vehicle,
                    buyerLead,
                    salePrice: vehicle.saleDetails!.salePrice,
                    saleDate: vehicle.saleDetails!.saleDate,
                    buyerName: buyerLead?.name || vehicle.saleDetails!.buyerName,
                    profit,
                    costBasis,
                    refurbishmentCosts,
                    margin,
                    daysToSell,
                    transactionLabel: `${vehicle.brand} ${vehicle.model}`
                };
            });

        // Apply filters
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(s =>
                s.buyerName.toLowerCase().includes(query) ||
                s.vehicle.brand.toLowerCase().includes(query) ||
                s.vehicle.model.toLowerCase().includes(query)
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

    const executiveMetrics = useMemo(() => {
        const totalRevenue = salesData.reduce((sum, s) => sum + s.salePrice, 0);
        const totalProfit = salesData.reduce((sum, s) => sum + s.profit, 0);
        const totalCost = salesData.reduce((sum, s) => sum + s.costBasis, 0);
        const totalRefurbishment = salesData.reduce((sum, s) => sum + s.refurbishmentCosts, 0);
        const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
        const avgTicket = salesData.length > 0 ? totalRevenue / salesData.length : 0;
        const avgDaysToSell = salesData.filter(s => s.daysToSell !== null).length > 0
            ? salesData.filter(s => s.daysToSell !== null).reduce((sum, s) => sum + (s.daysToSell || 0), 0) / salesData.filter(s => s.daysToSell !== null).length
            : 0;

        return { totalRevenue, totalProfit, totalCost, totalRefurbishment, profitMargin, avgTicket, avgDaysToSell };
    }, [salesData]);

    const { totalRevenue, totalProfit, totalCost, totalRefurbishment, profitMargin, avgTicket, avgDaysToSell } = executiveMetrics;

    // Monthly sales
    const now = new Date();
    const currentMonthSales = salesData.filter(s => {
        const d = new Date(s.saleDate);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const monthlyRevenue = currentMonthSales.reduce((sum, s) => sum + s.salePrice, 0);

    const trendData = useMemo(() => {
        return Array.from({ length: 6 }, (_, index) => {
            const date = subMonths(new Date(), 5 - index);
            const monthSales = salesData.filter(s => {
                const saleDate = new Date(s.saleDate);
                return saleDate.getMonth() === date.getMonth() && saleDate.getFullYear() === date.getFullYear();
            });

            return {
                label: format(date, 'MMM', { locale: ptBR }),
                value: monthSales.length
            };
        });
    }, [salesData]);

    const maxTrendValue = Math.max(...trendData.map(item => item.value), 1);

    const trendPath = trendData.map((point, index) => {
        const x = trendData.length === 1 ? 0 : (index / (trendData.length - 1)) * 100;
        const y = 100 - (point.value / maxTrendValue) * 100;
        return `${index === 0 ? 'M' : 'L'} ${x},${y}`;
    }).join(' ');

    const exportCsv = () => {
        const rows = [
            ['Data', 'Veículo', 'Comprador', 'Preço Venda', 'Custo', 'Preparação', 'Lucro'],
            ...salesData.map(sale => [
                new Date(sale.saleDate).toLocaleDateString('pt-BR'),
                `${sale.vehicle.brand} ${sale.vehicle.model}`,
                sale.buyerName,
                sale.salePrice.toFixed(2).replace('.', ','),
                sale.cost.toFixed(2).replace('.', ','),
                sale.refurbishmentCosts.toFixed(2).replace('.', ','),
                sale.profit.toFixed(2).replace('.', ',')
            ])
        ];

        const csv = rows
            .map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(';'))
            .join('\n');

        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `vendas-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <PageContainer className="flex flex-col space-y-8 animate-fadeIn pb-10">
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
                <button
                    onClick={exportCsv}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
                >
                    <Download size={16} />
                    Exportar CSV
                </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                {[
                    { key: '7d', label: '7 dias' },
                    { key: '30d', label: '30 dias' },
                    { key: 'year', label: 'Ano' },
                    { key: 'custom', label: 'Personalizado' },
                ].map(option => (
                    <button
                        key={option.key}
                        onClick={() => applyQuickRange(option.key as QuickRange)}
                        className={`rounded-2xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${quickRange === option.key ? 'bg-slate-900 text-white shadow-lg' : 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                            <ShoppingBag size={18} className="text-emerald-500" />
                        </div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Vendas no Período</span>
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
                <div className={`rounded-2xl border p-5 shadow-sm ${profitMargin < 5 ? 'border-rose-200 bg-rose-50/70' : 'border-slate-100 bg-white'}`}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${profitMargin < 5 ? 'bg-rose-100' : 'bg-violet-50'}`}>
                            {profitMargin < 5 ? <TrendingDown size={18} className="text-rose-500" /> : <TrendingUp size={18} className="text-violet-500" />}
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${profitMargin < 5 ? 'text-rose-400' : 'text-slate-400'}`}>Margem de Lucro</span>
                    </div>
                    <p className={`text-2xl font-black ${profitMargin < 5 ? 'text-rose-600' : totalProfit < 0 ? 'text-rose-500' : 'text-emerald-600'}`}>R$ {formatCurrency(totalProfit)}</p>
                    <p className={`mt-1 text-[10px] font-bold ${profitMargin < 5 ? 'text-rose-500' : 'text-slate-400'}`}>Margem: {profitMargin.toFixed(1)}%</p>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                    <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-500"><CalendarRange size={18} /></div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Tempo Médio de Venda</span>
                    </div>
                    <p className="text-2xl font-black text-slate-900">{avgDaysToSell.toFixed(1)} dias</p>
                </div>
                <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                    <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-500"><Percent size={18} /></div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Custo Base Vendido</span>
                    </div>
                    <p className="text-2xl font-black text-slate-900">R$ {formatCurrency(totalCost)}</p>
                </div>
                <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                    <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-500"><Clock3 size={18} /></div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Preparação</span>
                    </div>
                    <p className="text-2xl font-black text-slate-900">R$ {formatCurrency(totalRefurbishment)}</p>
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)]">
                <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                    <div className="mb-5 flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">Tendência de Vendas</h2>
                            <p className="mt-1 text-xs font-medium text-slate-400">Volume de vendas nos últimos 6 meses</p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                            6 meses
                        </span>
                    </div>

                    <div className="rounded-[28px] border border-slate-100 bg-slate-50/70 p-4">
                        <div className="h-56 w-full">
                            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible">
                                {[25, 50, 75].map(line => (
                                    <line key={line} x1="0" x2="100" y1={line} y2={line} stroke="rgba(148,163,184,0.2)" strokeDasharray="2 3" />
                                ))}
                                <path d={trendPath} fill="none" stroke="rgb(16 185 129)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
                                {trendData.map((point, index) => {
                                    const x = trendData.length === 1 ? 0 : (index / (trendData.length - 1)) * 100;
                                    const y = 100 - (point.value / maxTrendValue) * 100;
                                    return <circle key={point.label} cx={x} cy={y} r="2.6" fill="white" stroke="rgb(16 185 129)" strokeWidth="2" vectorEffect="non-scaling-stroke" />;
                                })}
                            </svg>
                        </div>

                        <div className="mt-4 grid grid-cols-6 gap-2">
                            {trendData.map(point => (
                                <div key={point.label} className="text-center">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{point.label}</p>
                                    <p className="mt-1 text-sm font-black text-slate-900">{point.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">Resumo Financeiro</h2>
                    <div className="mt-5 space-y-4">
                        <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Custo Total do Estoque Vendido</p>
                            <p className="mt-2 text-2xl font-black text-slate-900">R$ {formatCurrency(totalCost)}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Receita no Mês Atual</p>
                            <p className="mt-2 text-2xl font-black text-slate-900">R$ {formatCurrency(monthlyRevenue)}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Lucro Médio por Venda</p>
                            <p className={`mt-2 text-2xl font-black ${totalProfit >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>R$ {formatCurrency(salesData.length ? totalProfit / salesData.length : 0)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-wrap gap-6 items-end">
                <div className="flex-1 min-w-[300px] space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Buscar Venda</label>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input
                            type="text"
                            placeholder="Nome do cliente ou veículo..."
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

            {/* Sales Table */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <Award size={16} className="text-emerald-500" />
                        Relatório Executivo ({salesData.length})
                    </h2>
                </div>

                {salesData.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50/70">
                                <tr>
                                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Ativo</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Comprador</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Data</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Venda</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Custo Base</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Preparação</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Lucro</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Margem</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Giro</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 bg-white">
                                {salesData.map(sale => (
                                    <tr key={sale.vehicle.id} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="h-14 w-20 overflow-hidden rounded-xl bg-slate-100 shrink-0">
                                                    {sale.vehicle.imageUrl ? (
                                                        <img src={sale.vehicle.imageUrl} alt="" className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center text-slate-300"><Car size={22} /></div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black uppercase tracking-tight text-slate-900">{sale.transactionLabel}</p>
                                                    <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">{sale.vehicle.type} • {sale.vehicle.year}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                type="button"
                                                onClick={() => sale.buyerLead && navigate(`/leads/${sale.buyerLead.id}`)}
                                                className={`flex items-center gap-3 text-left ${sale.buyerLead ? 'cursor-pointer' : 'cursor-default'}`}
                                            >
                                                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-slate-900 text-xs font-black text-white">
                                                    {sale.buyerLead?.foto_url ? <img src={sale.buyerLead.foto_url} alt="" className="h-full w-full object-cover" /> : <User size={14} />}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-700">{sale.buyerName}</p>
                                                    <p className="text-[10px] font-medium text-slate-400">{sale.buyerLead?.phone || 'Comprador não vinculado'}</p>
                                                </div>
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold text-slate-600">{new Date(sale.saleDate).toLocaleDateString('pt-BR')}</td>
                                        <td className="px-6 py-4 text-right text-sm font-black text-blue-600">R$ {formatCurrency(sale.salePrice)}</td>
                                        <td className="px-6 py-4 text-right text-xs font-bold text-slate-600">R$ {formatCurrency(sale.costBasis)}</td>
                                        <td className="px-6 py-4 text-right text-xs font-bold text-amber-600">R$ {formatCurrency(sale.refurbishmentCosts)}</td>
                                        <td className={`px-6 py-4 text-right text-sm font-black ${sale.profit >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>R$ {formatCurrency(sale.profit)}</td>
                                        <td className={`px-6 py-4 text-right text-xs font-black ${sale.margin >= 5 ? 'text-emerald-600' : 'text-rose-500'}`}>{sale.margin.toFixed(1)}%</td>
                                        <td className="px-6 py-4 text-right text-xs font-bold text-slate-600">{sale.daysToSell === null ? '-' : `${sale.daysToSell}d`}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="py-20 flex flex-col items-center text-center opacity-30 select-none">
                        <Car size={48} strokeWidth={1} />
                        <h3 className="text-sm font-black uppercase tracking-tight mt-2">Nenhuma venda registrada</h3>
                        <p className="text-xs font-medium mt-1">Registre vendas a partir do estoque de veículos</p>
                    </div>
                )}
            </div>
        </PageContainer>
    );
};

export default SalesClosedPage;
