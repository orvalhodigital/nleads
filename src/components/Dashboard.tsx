import React, { useState, useEffect, useMemo } from 'react';
import PageContainer from './ui/PageContainer';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, TrendingUp, Package, Calendar, Award
} from 'lucide-react';
import { Lead, LeadPhase, Vehicle, Profile, LeadTemperature, Motorcycle, TransmissionType, VehicleType } from '../types';
import { quoteService } from '../services/quoteService';

import { isToday, isTomorrow, isSameDay, parseISO, startOfMonth, subMonths, isAfter, isBefore, endOfMonth, subDays, startOfDay, endOfDay, format, differenceInCalendarDays } from 'date-fns';
import { CustomDatePicker } from './ui/CustomDatePicker';
import { DashboardTabGeral } from './dashboard/DashboardTabGeral';
import { DashboardTabComercial } from './dashboard/DashboardTabComercial';
import { DashboardTabEstoque } from './dashboard/DashboardTabEstoque';
import { DashboardTabAgenda } from './dashboard/DashboardTabAgenda';

interface DashboardProps {
  leads: Lead[];
  vehicles: Vehicle[];
  motorcycles?: Motorcycle[];
  profile?: Profile | null;
}

const Dashboard: React.FC<DashboardProps> = ({ leads, vehicles, motorcycles = [], profile }) => {
  const navigate = useNavigate();
  const now = new Date();
  const [activeTab, setActiveTab] = useState<'geral' | 'comercial' | 'estoque' | 'agenda'>('geral');
  const [timeRange, setTimeRange] = useState<'today' | '7d' | '15d' | '30d' | 'month' | 'all' | 'custom'>('month');
  const [customStartDate, setCustomStartDate] = useState(format(startOfMonth(now), 'yyyy-MM-dd'));
  const [customEndDate, setCustomEndDate] = useState(format(now, 'yyyy-MM-dd'));
  const [filterSource, setFilterSource] = useState<string>('all');

  const unifiedVehicles = useMemo(() => {
    const list: Vehicle[] = [];
    if (profile?.enable_cars !== false) {
      list.push(...vehicles);
    }
    if (profile?.enable_motorcycles) {
      // Não sobrescrever `createdAt` aqui: motorcycleService já mapeia o valor real
      // de `created_at`. Sobrescrever com a data de venda fazia "Tempo Médio de
      // Venda" e "Veículos Parados" ficarem sempre errados/zerados para motos.
      list.push(...motorcycles.map(m => ({
        ...m,
        type: m.category as unknown as VehicleType,
        transmission: 'Manual' as TransmissionType,
        engine: m.engine,
        // Campo obrigatório de Vehicle sem equivalente em Motorcycle. Só afeta
        // a ficha do veículo, não as métricas calculadas aqui.
        isServiceHistoryComplete: false,
      })));
    }
    return list;
  }, [vehicles, motorcycles, profile]);
  const [filterTemp, setFilterTemp] = useState<string>('all');
  const [quote, setQuote] = useState<{ text: string, author: string }>({
    text: 'Aproxime-se de cada cliente com a ideia de ajudá-lo a resolver um problema.',
    author: 'Brian Tracy'
  });

  useEffect(() => {
    async function fetchQuote() {
      try {
        const data = await quoteService.getActive();
        if (data && data.length > 0) {
          const randomIndex = Math.floor(Math.random() * data.length);
          setQuote({ text: data[randomIndex].quote, author: data[randomIndex].author || 'Desconhecido' });
        }
      } catch (e) { }
    }
    fetchQuote();
  }, []);

  // ──────────────── MÉTRICAS CORE ────────────────

  const metrics = useMemo(() => {
    const safeParseISO = (dateStr: any): Date => {
      if (!dateStr) return new Date(0);
      try {
        const d = parseISO(dateStr);
        return isNaN(d.getTime()) ? new Date(0) : d;
      } catch {
        return new Date(0);
      }
    };

    let rangeStart: Date;
    let compareStart: Date;
    let compareEnd: Date;

    const today = startOfDay(now);

    switch (timeRange) {
      case 'today':
        rangeStart = today;
        compareStart = startOfDay(subDays(now, 1));
        compareEnd = endOfDay(subDays(now, 1));
        break;
      case '7d':
        rangeStart = startOfDay(subDays(now, 7));
        compareStart = startOfDay(subDays(now, 14));
        compareEnd = endOfDay(subDays(now, 7));
        break;
      case '15d':
        rangeStart = startOfDay(subDays(now, 15));
        compareStart = startOfDay(subDays(now, 30));
        compareEnd = endOfDay(subDays(now, 15));
        break;
      case '30d':
        rangeStart = startOfDay(subDays(now, 30));
        compareStart = startOfDay(subDays(now, 60));
        compareEnd = endOfDay(subDays(now, 30));
        break;
      case 'all':
        rangeStart = new Date(0);
        compareStart = new Date(0);
        compareEnd = new Date(0);
        break;
      case 'custom':
        rangeStart = startOfDay(safeParseISO(customStartDate));
        const end = endOfDay(safeParseISO(customEndDate));
        // For custom range, it's harder to define "previous period" logically, 
        // but we'll use the same duration backwards from rangeStart.
        const diffMs = end.getTime() - rangeStart.getTime();
        compareEnd = endOfDay(new Date(rangeStart.getTime() - 1));
        compareStart = startOfDay(new Date(rangeStart.getTime() - diffMs));
        break;
      case 'month':
      default:
        rangeStart = startOfMonth(now);
        compareStart = startOfMonth(subMonths(now, 1));
        compareEnd = endOfMonth(subMonths(now, 1));
        break;
    }

    // Adjusting for custom end date specifically if needed
    const effectiveEnd = timeRange === 'custom' ? endOfDay(safeParseISO(customEndDate)) : now;

    // Leads filter
    const filteredLeads = leads.filter(l => {
      const d = safeParseISO(l.createdAt);
      const isDateInRange = timeRange === 'all' || (isAfter(d, rangeStart) && isBefore(d, effectiveEnd));
      const isSourceMatch = filterSource === 'all' || l.source === filterSource;
      const isTempMatch = filterTemp === 'all' || l.temperature === filterTemp;
      return isDateInRange && isSourceMatch && isTempMatch;
    });

    const previousLeads = leads.filter(l => {
      const d = safeParseISO(l.createdAt);
      return isAfter(d, compareStart) && isBefore(d, compareEnd);
    });

    const leadsThisMonth = filteredLeads; // Alias for UI consistency
    const leadsGrowth = previousLeads.length > 0 ? ((filteredLeads.length - previousLeads.length) / previousLeads.length) * 100 : 0;

    // Vendas e Receita
    const filteredSales = unifiedVehicles.filter(v => {
      if (v.status !== 'sold' || !v.saleDetails) return false;
      const d = safeParseISO(v.saleDetails.saleDate);
      const isDateInRange = timeRange === 'all' || (isAfter(d, rangeStart) && isBefore(d, effectiveEnd));

      const buyerLead = leads.find(l => l.id === v.saleDetails?.buyerLeadId);
      const isSourceMatch = filterSource === 'all' || (buyerLead && buyerLead.source === filterSource);
      const isTempMatch = filterTemp === 'all' || (buyerLead && buyerLead.temperature === filterTemp);

      return isDateInRange && isSourceMatch && isTempMatch;
    });

    const previousSales = unifiedVehicles.filter(v =>
      v.status === 'sold' &&
      v.saleDetails &&
      isAfter(safeParseISO(v.saleDetails.saleDate), compareStart) &&
      isBefore(safeParseISO(v.saleDetails.saleDate), compareEnd)
    );

    const salesThisMonth = filteredSales;
    const revenueThisMonth = filteredSales.reduce((acc, v) => acc + (v.saleDetails?.salePrice || 0), 0);
    const revenueLastMonth = previousSales.reduce((acc, v) => acc + (v.saleDetails?.salePrice || 0), 0);

    const salesCountGrowth = previousSales.length > 0 ? ((filteredSales.length - previousSales.length) / previousSales.length) * 100 : 0;
    const salesGrowth = revenueLastMonth > 0 ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100 : 0;

    const completedLeads = leads.filter(l => l.phase === LeadPhase.COMPLETED).length;
    const conversionRate = leads.length > 0 ? (completedLeads / leads.length) * 100 : 0;
    const ticketMedioVendas = filteredSales.length > 0 ? revenueThisMonth / filteredSales.length : 0;
    const monthlyGrossProfit = filteredSales.reduce((acc, v) => {
      const salePrice = v.saleDetails?.salePrice || 0;
      const refurbishmentCosts = v.saleDetails?.refurbishmentCosts || 0;
      // Prioriza o preço de COMPRA (o que a loja realmente pagou pelo veículo).
      // Antes usava fipePrice/price (preço de referência/anúncio) como "custo",
      // o que tornava o lucro bruto uma comparação sem sentido (preço de venda
      // menos preço de anúncio, não menos o que foi efetivamente pago).
      const costBasis = v.purchasePrice || v.fipePrice || v.price || 0;
      return acc + (salePrice - refurbishmentCosts - costBasis);
    }, 0);
    const averageDaysToSell = filteredSales.length > 0
      ? filteredSales.reduce((acc, v) => {
        const createdReference = v.createdAt;
        if (!createdReference || !v.saleDetails?.saleDate) return acc;
        return acc + Math.max(0, differenceInCalendarDays(safeParseISO(v.saleDetails.saleDate), safeParseISO(createdReference)));
      }, 0) / filteredSales.length
      : 0;

    // Funil
    const activeLeads = leads.filter(l => l.phase !== LeadPhase.COMPLETED && l.phase !== LeadPhase.DISQUALIFIED);
    const attentionLeads = activeLeads.filter(l => {
      const lastUpdateStr = l.lastUpdate || l.createdAt;
      if (!lastUpdateStr) return false;
      try {
        const lastUpdate = safeParseISO(lastUpdateStr);
        const diff = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
        return diff > 15;
      } catch {
        return false;
      }
    });

    const hotLeads = activeLeads.filter(l => l.temperature === LeadTemperature.HOT).length;

    // Estoque
    const availableVehicles = unifiedVehicles.filter(v => v.status === 'available');
    const totalStockValue = availableVehicles.reduce((acc, v) => acc + v.price, 0);
    const stockTurnover = unifiedVehicles.length > 0 ? (filteredSales.length / unifiedVehicles.length) * 100 : 0;

    let mostExpensive = availableVehicles.length > 0 ? availableVehicles[0] : null;
    let cheapest = availableVehicles.length > 0 ? availableVehicles[0] : null;
    availableVehicles.forEach(v => {
      if (!mostExpensive || v.price > mostExpensive.price) mostExpensive = v;
      if (!cheapest || v.price < cheapest.price) cheapest = v;
    });

    // Funnel Data p/ Gráfico
    const funnelPhases = [
      { phase: LeadPhase.NEW, name: 'Novo', color: '#10b981' },
      { phase: LeadPhase.VISIT, name: 'Visita', color: '#3b82f6' },
      { phase: LeadPhase.SIMULATION, name: 'Simulação', color: '#f59e0b' },
      { phase: LeadPhase.FOLLOW_UP, name: 'Follow-up', color: '#8b5cf6' },
      { phase: LeadPhase.STAND_BY, name: 'Stand-By', color: '#a855f7' },
      { phase: LeadPhase.WAITING_PAYMENT, name: 'Pagamento', color: '#ec4899' },
      { phase: LeadPhase.DOCUMENTATION, name: 'Documentação', color: '#06b6d4' },
      { phase: LeadPhase.DELIVERY, name: 'Entrega', color: '#f97316' },
      { phase: LeadPhase.COMPLETED, name: 'Compradores', color: '#16a34a' },
    ];

    const funnelData = funnelPhases.map(p => ({
      name: p.name,
      value: leads.filter(l => l.phase === p.phase).length,
      color: p.color
    }));

    const stockByCategoryMap: Record<string, number> = {};
    availableVehicles.forEach(v => {
      stockByCategoryMap[v.type] = (stockByCategoryMap[v.type] || 0) + 1;
    });
    const stockByCategory = Object.entries(stockByCategoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Comercial Actions
    const matchesProntos = activeLeads.filter(l =>
      availableVehicles.some(v =>
        (l.preferences?.marcas || []).includes(v.brand) ||
        (l.preferences?.modelos || []).includes(v.model)
      )
    ).length;

    const prontosParaFechar = activeLeads.filter(l =>
      l.phase === LeadPhase.SIMULATION || l.phase === LeadPhase.WAITING_PAYMENT
    ).length;

    const leadsEsquecidos = activeLeads.filter(l => {
      const lastUpdateStr = l.lastUpdate || l.createdAt;
      if (!lastUpdateStr) return false;
      const lastUpdate = parseISO(lastUpdateStr);
      const diff = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
      return diff > 3;
    }).length;

    const leadsComEntrada = activeLeads.filter(l => l.preferences?.possui_entrada && (l.preferences?.valor_entrada || 0) > 0).length;
    const leadsComTroca = activeLeads.filter(l => l.preferences?.possui_troca).length;

    // Sales by Brand
    const salesByBrandMap: Record<string, number> = {};
    filteredSales.forEach(v => {
      salesByBrandMap[v.brand] = (salesByBrandMap[v.brand] || 0) + 1;
    });
    const salesByBrand = Object.entries(salesByBrandMap).map(([name, value]) => ({ name, value }));

    // Interest Charts
    const brandInterestMap: Record<string, number> = {};
    leads.forEach(l => {
      (l.preferences?.marcas || []).forEach(b => brandInterestMap[b] = (brandInterestMap[b] || 0) + 1);
    });
    const brandInterest = Object.entries(brandInterestMap).map(([name, value]) => ({ name, value }));

    const typeInterestMap: Record<string, number> = {};
    leads.forEach(l => {
      (l.preferences?.tipos_veiculo || []).forEach(t => typeInterestMap[t] = (typeInterestMap[t] || 0) + 1);
    });
    const typeInterest = Object.entries(typeInterestMap).map(([name, value]) => ({ name, value }));

    const leadSourcesMap: Record<string, number> = {};
    leads.forEach(l => {
      if (l.source) leadSourcesMap[l.source] = (leadSourcesMap[l.source] || 0) + 1;
    });
    const leadSources = Object.entries(leadSourcesMap).map(([name, value]) => ({ name, value }));

    const modelInterestMap: Record<string, number> = {};
    leads.forEach(l => {
      (l.preferences?.modelos || []).forEach(m => modelInterestMap[m] = (modelInterestMap[m] || 0) + 1);
      (l.preferences?.modelos_moto || []).forEach(m => modelInterestMap[m] = (modelInterestMap[m] || 0) + 1);
    });
    const modelInterest = Object.entries(modelInterestMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Agenda stuff
    const appointmentsToday = leads.flatMap(l => l.scheduling_data?.appointments || []).filter(a => isToday(safeParseISO(a.date)));
    const visToday = appointmentsToday.length;
    const visitsDoneToday = appointmentsToday.filter(a => a.status === 'show').length;
    const followupsToday = leads.filter(l => l.follow_up_data?.nextContactDate && isToday(safeParseISO(l.follow_up_data.nextContactDate))).length;

    const appointmentsTomorrow = leads.flatMap(l => l.scheduling_data?.appointments || []).filter(a => isTomorrow(safeParseISO(a.date))).length;
    const followupsTomorrow = leads.filter(l => l.follow_up_data?.nextContactDate && isTomorrow(safeParseISO(l.follow_up_data.nextContactDate))).length;

    // Goal Math
    const monthlyGoal = profile?.monthly_sales_goal || 10;
    const isGoalReached = filteredSales.length >= monthlyGoal;
    const goalProgress = Math.min((filteredSales.length / monthlyGoal) * 100, 100);
    const salesNeeded = Math.max(0, monthlyGoal - filteredSales.length);
    const endOfMonthDate = endOfMonth(now);
    const daysLeftInMonth = Math.max(1, Math.floor((endOfMonthDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const salesPerDayNeeded = (salesNeeded / daysLeftInMonth).toFixed(1);

    // Funnel Goals — always calculated against current calendar month
    const monthStart = startOfMonth(now);
    const allAppointmentsThisMonth = leads.flatMap(l => l.scheduling_data?.appointments || []).filter(a => {
      try { const d = parseISO(a.date); return isAfter(d, monthStart) || isSameDay(d, monthStart); } catch { return false; }
    });
    const visitsThisMonthTotal = allAppointmentsThisMonth.length;
    const visitsThisMonthDone = allAppointmentsThisMonth.filter(a => a.status === 'show').length;
    const visitShowRate = visitsThisMonthTotal > 0 ? Math.round((visitsThisMonthDone / visitsThisMonthTotal) * 100) : 0;

    // Leads novos no mês (sempre mês corrente, independente do filtro de período)
    const leadsThisCalMonth = leads.filter(l => {
      try { const d = parseISO(l.createdAt); return isAfter(d, monthStart) || isSameDay(d, monthStart); } catch { return false; }
    }).length;

    // Vendas no mês corrente (independente do filtro)
    const salesThisCalMonth = unifiedVehicles.filter(v => {
      if (v.status !== 'sold' || !v.saleDetails) return false;
      try { const d = parseISO(v.saleDetails.saleDate); return isAfter(d, monthStart) || isSameDay(d, monthStart); } catch { return false; }
    });
    const salesCountThisCalMonth = salesThisCalMonth.length;
    const revenueThisCalMonth = salesThisCalMonth.reduce((s, v) => s + (v.saleDetails?.salePrice || 0), 0);

    // Veículos parados há +60 dias
    const staleVehicles = availableVehicles.filter(v => {
      if (!v.createdAt) return false;
      try { return differenceInCalendarDays(now, parseISO(v.createdAt)) > 60; } catch { return false; }
    }).length;

    return {
      leadsThisMonth, leadsGrowth, salesThisMonth, salesCountGrowth, revenueThisMonth, salesGrowth,
      conversionRate, ticketMedioVendas, monthlyGrossProfit, averageDaysToSell, activeLeads, attentionLeads, hotLeads, availableVehicles,
      totalStockValue, stockTurnover, mostExpensive, cheapest, funnelData, matchesProntos,
      prontosParaFechar, leadsEsquecidos, leadsComEntrada, leadsComTroca, salesByBrand,
      brandInterest, typeInterest, leadSources, stockByCategory, monthlyGoal, isGoalReached, goalProgress,
      salesNeeded, daysLeftInMonth, salesPerDayNeeded, visToday, visitsDoneToday,
      followupsToday, appointmentsTomorrow, followupsTomorrow, modelInterest,
      leadsThisCalMonth, visitsThisMonthTotal, visitsThisMonthDone, visitShowRate,
      salesCountThisCalMonth, revenueThisCalMonth, staleVehicles
    };
  }, [leads, unifiedVehicles, profile, now, timeRange, customStartDate, customEndDate, filterSource, filterTemp]);

  const {
    leadsThisMonth, leadsGrowth, salesThisMonth, salesCountGrowth, revenueThisMonth, salesGrowth,
    conversionRate, ticketMedioVendas, monthlyGrossProfit, averageDaysToSell, activeLeads, attentionLeads, hotLeads, availableVehicles,
    totalStockValue, stockTurnover, mostExpensive, cheapest, funnelData, matchesProntos,
    prontosParaFechar, leadsEsquecidos, leadsComEntrada, leadsComTroca, salesByBrand,
    brandInterest, typeInterest, leadSources, stockByCategory, monthlyGoal, isGoalReached, goalProgress,
    salesNeeded, daysLeftInMonth, salesPerDayNeeded, visToday, visitsDoneToday,
    followupsToday, appointmentsTomorrow, followupsTomorrow, modelInterest,
    leadsThisCalMonth, visitsThisMonthTotal, visitsThisMonthDone, visitShowRate,
    salesCountThisCalMonth, revenueThisCalMonth, staleVehicles
  } = metrics;


  return (
    <div className="relative animate-fadeUp pb-24 w-full min-h-screen text-foreground">
      <PageContainer className="space-y-8 mt-6 relative z-10">

        {/* ═══════════════════════ HEADER / FILTROS ═══════════════════════ */}
        <div className="flex flex-wrap items-center gap-3 pb-4">
          {/* Período */}
          <div className="flex bg-card/45 dark:bg-slate-900/50 backdrop-blur-xl p-1 rounded-2xl border border-border/80 shadow-sm">
            {(['today', '7d', '15d', 'month', 'all', 'custom'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${timeRange === range ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/15' : 'text-muted-foreground hover:bg-card/60 dark:hover:bg-slate-800/80'}`}
              >
                {range === 'today' ? 'Hoje' : range === '7d' ? '7D' : range === '15d' ? '15D' : range === 'month' ? 'Mês' : range === 'all' ? 'Tudo' : 'Personalizado'}
              </button>
            ))}
          </div>

          {timeRange === 'custom' && (
            <div className="flex items-center gap-2 bg-card/45 dark:bg-slate-900/50 backdrop-blur-xl p-1.5 rounded-2xl border border-border/80 shadow-sm animate-fadeRight">
              <CustomDatePicker value={customStartDate} onChange={setCustomStartDate} className="bg-transparent text-xs font-bold text-foreground outline-none pr-2" />
              <div className="w-px h-4 bg-border mx-1" />
              <CustomDatePicker value={customEndDate} onChange={setCustomEndDate} className="bg-transparent text-xs font-bold text-foreground outline-none" />
            </div>
          )}

          {/* Origens + Temperatura */}
          <div className="flex items-center gap-2 bg-card/45 dark:bg-slate-900/50 backdrop-blur-xl p-1 rounded-2xl border border-border/80 shadow-sm">
            <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)} className="bg-transparent text-xs font-bold uppercase tracking-wider text-muted-foreground px-3 py-2 outline-none cursor-pointer hover:bg-card/60 dark:hover:bg-slate-800/80 rounded-xl transition-all">
              <option value="all">Todas Origens</option>
              {['Site', 'WhatsApp', 'Facebook', 'Instagram', 'Indicação', 'Telefone', 'Outros'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <div className="w-px h-4 bg-border" />
            <select value={filterTemp} onChange={(e) => setFilterTemp(e.target.value)} className="bg-transparent text-xs font-bold uppercase tracking-wider text-muted-foreground px-3 py-2 outline-none cursor-pointer hover:bg-card/60 dark:hover:bg-slate-800/80 rounded-xl transition-all">
              <option value="all">Temperaturas</option>
              <option value="HOT">🔥 Quentes</option>
              <option value="WARM">⚡ Mornos</option>
              <option value="COLD">❄️ Frios</option>
            </select>
          </div>

          {monthlyGoal > 0 && isGoalReached && (
            <div className="flex items-center gap-3 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground px-5 py-2.5 rounded-2xl shadow-md shadow-primary/10 border border-primary/20">
              <Award size={18} className="opacity-90" />
              <span className="text-xs font-bold">Meta Atingida! 🎉</span>
            </div>
          )}
        </div>

        {/* ═══════════════════════ CITAÇÃO MOTIVACIONAL ═══════════════════════ */}
        {quote.text && (
          <div className="bg-card/45 dark:bg-card/25 backdrop-blur-3xl border border-border/60 p-6 md:p-8 rounded-3xl shadow-sm animate-fadeUp">
            <div className="flex items-center gap-6">
              <div className="text-5xl text-muted-foreground/20 flex-shrink-0">"</div>
              <div className="flex-1">
                <p className="text-base font-bold text-foreground leading-relaxed italic">{quote.text}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-4">— {quote.author}</p>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════ TABS NAV ═══════════════════════ */}
        <div className="flex bg-muted/60 dark:bg-slate-900/60 p-1 rounded-2xl border border-border/80 backdrop-blur-sm w-fit">
          {([
            { key: 'geral',     label: 'Resumo',     icon: LayoutDashboard },
            { key: 'comercial', label: 'Comercial',  icon: TrendingUp },
            { key: 'estoque',   label: 'Estoque',    icon: Package },
            { key: 'agenda',    label: 'Agenda',     icon: Calendar },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl transition-all duration-300 whitespace-nowrap ${activeTab === key ? 'bg-card text-foreground shadow-sm font-bold border border-border/50' : 'text-muted-foreground hover:text-foreground font-semibold'}`}
            >
              <Icon size={14} strokeWidth={activeTab === key ? 2.5 : 2} />
              <span className="text-[10px] uppercase tracking-wider">{label}</span>
            </button>
          ))}
        </div>

        {/* ═══════════════════════ TAB CONTENTS ═══════════════════════ */}
        {activeTab === 'geral' && (
          <DashboardTabGeral
            leads={leads}
            profile={profile}
            attentionLeads={attentionLeads}
            staleVehicles={staleVehicles}
            salesThisMonth={salesThisMonth}
            salesCountGrowth={salesCountGrowth}
            revenueThisMonth={revenueThisMonth}
            salesGrowth={salesGrowth}
            leadsThisMonth={leadsThisMonth}
            leadsGrowth={leadsGrowth}
            conversionRate={conversionRate}
            availableVehicles={availableVehicles}
            ticketMedioVendas={ticketMedioVendas}
            monthlyGrossProfit={monthlyGrossProfit}
            averageDaysToSell={averageDaysToSell}
            stockTurnover={stockTurnover}
            leadsThisCalMonth={leadsThisCalMonth}
            visitsThisMonthDone={visitsThisMonthDone}
            visitsThisMonthTotal={visitsThisMonthTotal}
            visitShowRate={visitShowRate}
            salesCountThisCalMonth={salesCountThisCalMonth}
            revenueThisCalMonth={revenueThisCalMonth}
            salesPerDayNeeded={salesPerDayNeeded}
            daysLeftInMonth={daysLeftInMonth}
            salesNeeded={salesNeeded}
            hotLeads={hotLeads}
            activeLeads={activeLeads}
            funnelData={funnelData}
            monthlyGoal={monthlyGoal}
          />
        )}

        {activeTab === 'comercial' && (
          <DashboardTabComercial
            leads={leads}
            matchesProntos={matchesProntos}
            prontosParaFechar={prontosParaFechar}
            leadsEsquecidos={leadsEsquecidos}
            revenueThisMonth={revenueThisMonth}
            salesGrowth={salesGrowth}
            ticketMedioVendas={ticketMedioVendas}
            leadsComEntrada={leadsComEntrada}
            leadsComTroca={leadsComTroca}
            averageDaysToSell={averageDaysToSell}
            salesByBrand={salesByBrand}
          />
        )}

        {activeTab === 'estoque' && (
          <DashboardTabEstoque
            availableVehicles={availableVehicles}
            stockTurnover={stockTurnover}
            totalStockValue={totalStockValue}
            mostExpensive={mostExpensive}
            cheapest={cheapest}
            stockByCategory={stockByCategory}
            brandInterest={brandInterest}
            typeInterest={typeInterest}
            modelInterest={modelInterest}
            leadSources={leadSources}
          />
        )}

        {activeTab === 'agenda' && (
          <DashboardTabAgenda
            visToday={visToday}
            visitsDoneToday={visitsDoneToday}
            followupsToday={followupsToday}
            followupsTomorrow={followupsTomorrow}
            appointmentsTomorrow={appointmentsTomorrow}
          />
        )}
      </PageContainer>
    </div>
  );
};

export default Dashboard;
