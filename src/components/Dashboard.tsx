import React, { useState, useEffect, useMemo } from 'react';
import PageContainer from './ui/PageContainer';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import {
  Users, Car, Target, DollarSign, Flame, Clock, AlertTriangle,
  CheckCircle2, Calendar, TrendingUp, LayoutDashboard,
  UserX, ShoppingBag, BarChart3, Percent, ArrowRight, Package,
  Repeat, Handshake, Timer, Award, PhoneCall, Info
} from 'lucide-react';
import { Lead, LeadPhase, Vehicle, Profile, LeadTemperature, Motorcycle, TransmissionType } from '../types';
import { supabase } from '../lib/supabaseClient';

import { isToday, isTomorrow, isSameDay, parseISO, startOfMonth, subMonths, isAfter, isBefore, endOfMonth, subDays, startOfDay, endOfDay, format, differenceInCalendarDays } from 'date-fns';
import { formatCurrency } from '../utils/formatters';
import { CustomDatePicker } from './ui/CustomDatePicker';

interface DashboardProps {
  leads: Lead[];
  vehicles: Vehicle[];
  motorcycles?: Motorcycle[];
  profile?: Profile | null;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#f97316'];

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
      list.push(...motorcycles.map(m => ({
        ...m,
        type: m.category as any,
        transmission: 'Manual' as TransmissionType,
        engine: m.engine as any,
        createdAt: m.saleDetails?.saleDate || undefined,
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
        const { data } = await supabase
          .from('motivation_quotes')
          .select('quote, author')
          .eq('is_active', true);
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
        rangeStart = startOfDay(parseISO(customStartDate));
        const end = endOfDay(parseISO(customEndDate));
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
    const effectiveEnd = timeRange === 'custom' ? endOfDay(parseISO(customEndDate)) : now;

    // Leads filter
    const filteredLeads = leads.filter(l => {
      const d = parseISO(l.createdAt);
      const isDateInRange = timeRange === 'all' || (isAfter(d, rangeStart) && isBefore(d, effectiveEnd));
      const isSourceMatch = filterSource === 'all' || l.source === filterSource;
      const isTempMatch = filterTemp === 'all' || l.temperature === filterTemp;
      return isDateInRange && isSourceMatch && isTempMatch;
    });

    const previousLeads = leads.filter(l => {
      const d = parseISO(l.createdAt);
      return isAfter(d, compareStart) && isBefore(d, compareEnd);
    });

    const leadsThisMonth = filteredLeads; // Alias for UI consistency
    const leadsGrowth = previousLeads.length > 0 ? ((filteredLeads.length - previousLeads.length) / previousLeads.length) * 100 : 0;

    // Vendas e Receita
    const filteredSales = unifiedVehicles.filter(v => {
      if (v.status !== 'sold' || !v.saleDetails) return false;
      const d = parseISO(v.saleDetails.saleDate);
      const isDateInRange = timeRange === 'all' || (isAfter(d, rangeStart) && isBefore(d, effectiveEnd));

      const buyerLead = leads.find(l => l.id === v.saleDetails?.buyerLeadId);
      const isSourceMatch = filterSource === 'all' || (buyerLead && buyerLead.source === filterSource);
      const isTempMatch = filterTemp === 'all' || (buyerLead && buyerLead.temperature === filterTemp);

      return isDateInRange && isSourceMatch && isTempMatch;
    });

    const previousSales = unifiedVehicles.filter(v =>
      v.status === 'sold' &&
      v.saleDetails &&
      isAfter(parseISO(v.saleDetails.saleDate), compareStart) &&
      isBefore(parseISO(v.saleDetails.saleDate), compareEnd)
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
      const costBasis = v.fipePrice ?? v.price ?? 0;
      return acc + (salePrice - refurbishmentCosts - costBasis);
    }, 0);
    const averageDaysToSell = filteredSales.length > 0
      ? filteredSales.reduce((acc, v) => {
        const createdReference = (v as any).createdAt || v.saleDetails?.saleDate;
        if (!createdReference || !v.saleDetails?.saleDate) return acc;
        return acc + Math.max(0, differenceInCalendarDays(parseISO(v.saleDetails.saleDate), parseISO(createdReference)));
      }, 0) / filteredSales.length
      : 0;

    // Funil
    const activeLeads = leads.filter(l => l.phase !== LeadPhase.COMPLETED && l.phase !== LeadPhase.DISQUALIFIED);
    const attentionLeads = activeLeads.filter(l => {
      const lastUpdate = parseISO(l.lastUpdate);
      const diff = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
      return diff > 15;
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
        l.preferences.marcas.includes(v.brand) ||
        l.preferences.modelos.includes(v.model)
      )
    ).length;

    const prontosParaFechar = activeLeads.filter(l =>
      l.phase === LeadPhase.SIMULATION || l.phase === LeadPhase.WAITING_PAYMENT
    ).length;

    const leadsEsquecidos = activeLeads.filter(l => {
      const lastUpdate = parseISO(l.lastUpdate);
      const diff = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
      return diff > 3;
    }).length;

    const leadsComEntrada = activeLeads.filter(l => l.preferences.possui_entrada && (l.preferences.valor_entrada || 0) > 0).length;
    const leadsComTroca = activeLeads.filter(l => l.preferences.possui_troca).length;

    // Sales by Brand
    const salesByBrandMap: Record<string, number> = {};
    filteredSales.forEach(v => {
      salesByBrandMap[v.brand] = (salesByBrandMap[v.brand] || 0) + 1;
    });
    const salesByBrand = Object.entries(salesByBrandMap).map(([name, value]) => ({ name, value }));

    // Interest Charts
    const brandInterestMap: Record<string, number> = {};
    leads.forEach(l => {
      l.preferences.marcas.forEach(b => brandInterestMap[b] = (brandInterestMap[b] || 0) + 1);
    });
    const brandInterest = Object.entries(brandInterestMap).map(([name, value]) => ({ name, value }));

    const typeInterestMap: Record<string, number> = {};
    leads.forEach(l => {
      l.preferences.tipos_veiculo.forEach(t => typeInterestMap[t] = (typeInterestMap[t] || 0) + 1);
    });
    const typeInterest = Object.entries(typeInterestMap).map(([name, value]) => ({ name, value }));

    const leadSourcesMap: Record<string, number> = {};
    leads.forEach(l => leadSourcesMap[l.source] = (leadSourcesMap[l.source] || 0) + 1);
    const leadSources = Object.entries(leadSourcesMap).map(([name, value]) => ({ name, value }));

    const modelInterestMap: Record<string, number> = {};
    leads.forEach(l => {
      l.preferences.modelos?.forEach(m => modelInterestMap[m] = (modelInterestMap[m] || 0) + 1);
      l.preferences.modelos_moto?.forEach(m => modelInterestMap[m] = (modelInterestMap[m] || 0) + 1);
    });
    const modelInterest = Object.entries(modelInterestMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Agenda stuff
    const appointmentsToday = leads.flatMap(l => l.scheduling_data?.appointments || []).filter(a => isToday(parseISO(a.date)));
    const visToday = appointmentsToday.length;
    const visitsDoneToday = appointmentsToday.filter(a => a.status === 'show').length;
    const followupsToday = leads.filter(l => l.follow_up_data?.nextContactDate && isToday(parseISO(l.follow_up_data.nextContactDate))).length;

    const appointmentsTomorrow = leads.flatMap(l => l.scheduling_data?.appointments || []).filter(a => isTomorrow(parseISO(a.date))).length;
    const followupsTomorrow = leads.filter(l => l.follow_up_data?.nextContactDate && isTomorrow(parseISO(l.follow_up_data.nextContactDate))).length;

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
      if (!(v as any).createdAt) return false;
      try { return differenceInCalendarDays(now, parseISO((v as any).createdAt)) > 60; } catch { return false; }
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
    <div className="relative animate-fadeUp pb-24 w-full min-h-screen text-slate-800">
      {/* ──── LIQUID GLASS BACKGROUND STYLING ──── */}
      <div className="fixed inset-0 pointer-events-none z-[0] bg-[#f8fafc]" />
      <div className="fixed inset-0 pointer-events-none z-[0] overflow-hidden mix-blend-multiply opacity-50">
        <div className="absolute -top-[10%] -left-[10%] w-[500px] h-[500px] bg-emerald-400/30 rounded-full blur-[140px] animate-pulse-slow" />
        <div className="absolute top-[20%] -right-[15%] w-[600px] h-[600px] bg-blue-400/20 rounded-full blur-[140px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-[-20%] left-[20%] w-[800px] h-[800px] bg-indigo-400/10 rounded-full blur-[160px] animate-pulse-slow" style={{ animationDelay: '4s' }} />
      </div>

      <PageContainer className="space-y-8 mt-6 relative z-10">

        {/* ═══════════════════════ HEADER / FILTROS ═══════════════════════ */}
        <div className="flex flex-wrap items-center gap-3 pb-4">
          {/* Período */}
          <div className="flex bg-white/40 backdrop-blur-xl p-1 rounded-[18px] border border-white/60 shadow-sm">
            {(['today', '7d', '15d', 'month', 'all', 'custom'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${timeRange === range ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-white/50'}`}
              >
                {range === 'today' ? 'Hoje' : range === '7d' ? '7D' : range === '15d' ? '15D' : range === 'month' ? 'Mês' : range === 'all' ? 'Tudo' : 'Personalizado'}
              </button>
            ))}
          </div>

          {timeRange === 'custom' && (
            <div className="flex items-center gap-2 bg-white/40 backdrop-blur-xl p-1.5 rounded-[18px] border border-white/60 shadow-sm animate-fadeRight">
              <CustomDatePicker value={customStartDate} onChange={setCustomStartDate} className="bg-transparent text-xs font-bold text-slate-700 outline-none pr-2" />
              <div className="w-px h-4 bg-slate-200 mx-1" />
              <CustomDatePicker value={customEndDate} onChange={setCustomEndDate} className="bg-transparent text-xs font-bold text-slate-700 outline-none" />
            </div>
          )}

          {/* Origens + Temperatura */}
          <div className="flex items-center gap-2 bg-white/40 backdrop-blur-xl p-1 rounded-[18px] border border-white/60 shadow-sm">
            <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)} className="bg-transparent text-xs font-black uppercase tracking-widest text-slate-500 px-3 py-2.5 outline-none cursor-pointer hover:bg-white/50 rounded-xl transition-all">
              <option value="all">Todas Origens</option>
              {['Site', 'WhatsApp', 'Facebook', 'Instagram', 'Indicação', 'Telefone', 'Outros'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <div className="w-px h-4 bg-slate-200" />
            <select value={filterTemp} onChange={(e) => setFilterTemp(e.target.value)} className="bg-transparent text-xs font-black uppercase tracking-widest text-slate-500 px-3 py-2.5 outline-none cursor-pointer hover:bg-white/50 rounded-xl transition-all">
              <option value="all">Temperaturas</option>
              <option value="HOT">🔥 Quentes</option>
              <option value="WARM">⚡ Mornos</option>
              <option value="COLD">❄️ Frios</option>
            </select>
          </div>

          {monthlyGoal > 0 && isGoalReached && (
            <div className="flex items-center gap-3 bg-gradient-to-br from-emerald-500 to-teal-400 text-white px-5 py-2.5 rounded-[18px] shadow-xl shadow-emerald-500/20 border border-emerald-400/50">
              <Award size={18} className="text-emerald-50" />
              <span className="text-xs font-extrabold">Meta Atingida! 🎉</span>
            </div>
          )}
        </div>

        {/* ═══════════════════════ CITAÇÃO MOTIVACIONAL ═══════════════════════ */}
        {quote.text && (
          <div className="bg-white/50 backdrop-blur-3xl border border-white/60 p-8 rounded-[40px] shadow-[0_8px_32px_rgb(0,0,0,0.03)] animate-fadeUp">
            <div className="flex items-center gap-6">
              <div className="text-6xl text-slate-300 flex-shrink-0">"</div>
              <div className="flex-1">
                <p className="text-lg font-bold text-slate-800 leading-relaxed italic">{quote.text}</p>
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest mt-4">— {quote.author}</p>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════ TABS NAV ═══════════════════════ */}
        <div className="flex bg-slate-200/50 p-1 rounded-xl border border-slate-200/30 backdrop-blur-sm w-fit">
          {([
            { key: 'geral',     label: 'Resumo',     icon: LayoutDashboard },
            { key: 'comercial', label: 'Comercial',  icon: TrendingUp },
            { key: 'estoque',   label: 'Estoque',    icon: Package },
            { key: 'agenda',    label: 'Agenda',     icon: Calendar },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all duration-200 whitespace-nowrap ${activeTab === key ? 'bg-white text-slate-900 shadow-md font-black ring-1 ring-slate-200/60' : 'text-slate-500 hover:text-slate-700 font-bold'}`}
            >
              <Icon size={14} strokeWidth={activeTab === key ? 2.5 : 2} />
              <span className="text-[11px] uppercase tracking-wide">{label}</span>
            </button>
          ))}
        </div>

        {/* ═══════════════════════ TAB: VISÃO GERAL ═══════════════════════ */}
        {activeTab === 'geral' && (
          <div className="space-y-8 animate-fadeUp">
            {(attentionLeads.length > 0 || staleVehicles > 0) && (
              <div className="flex flex-col gap-3">
                {attentionLeads.length > 0 && (
                  <div className="bg-amber-400/10 backdrop-blur-3xl border border-amber-400/30 rounded-[32px] p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_8px_30px_rgb(251,191,36,0.15)] relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-amber-400/20 rounded-full blur-[40px] pointer-events-none" />
                    <div className="flex items-center gap-5 relative z-10">
                      <div className="w-14 h-14 bg-amber-400/30 rounded-2xl flex items-center justify-center shrink-0 border border-amber-400/40 shadow-inner">
                        <AlertTriangle size={28} className="text-amber-700" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-amber-900 tracking-tight leading-tight">{attentionLeads.length} leads precisam de atenção!</h3>
                        <p className="text-xs font-semibold text-amber-800 mt-1 tracking-tight">Parados há mais de 15 dias na mesma fase do funil.</p>
                      </div>
                    </div>
                    <button onClick={() => navigate('/leads')} className="relative z-10 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-8 py-3.5 rounded-[20px] font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-amber-500/30 hover:-translate-y-0.5 whitespace-nowrap">
                      Evoluir Leads
                    </button>
                  </div>
                )}
                {staleVehicles > 0 && (
                  <div className="bg-rose-400/10 backdrop-blur-3xl border border-rose-400/30 rounded-[32px] p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_8px_30px_rgb(244,63,94,0.15)] relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-rose-400/20 rounded-full blur-[40px] pointer-events-none" />
                    <div className="flex items-center gap-5 relative z-10">
                      <div className="w-14 h-14 bg-rose-400/30 rounded-2xl flex items-center justify-center shrink-0 border border-rose-400/40 shadow-inner">
                        <Car size={28} className="text-rose-700" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-rose-900 tracking-tight leading-tight">{staleVehicles} veículos parados há 60+ dias!</h3>
                        <p className="text-xs font-semibold text-rose-800 mt-1 tracking-tight">Reduzir preço ou fazer promoção para acelerar giro.</p>
                      </div>
                    </div>
                    <button onClick={() => navigate('/inventory')} className="relative z-10 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white px-8 py-3.5 rounded-[20px] font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-rose-500/30 hover:-translate-y-0.5 whitespace-nowrap">
                      Ver Estoque
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <KpiGlassCard
                label="Vendas (Mês)"
                value={salesThisMonth.length}
                trend={salesCountGrowth}
                icon={ShoppingBag}
                colorClass="text-emerald-600 bg-emerald-500/10"
                glowClass="bg-emerald-400/30"
                info="Sua conversão final. Estratégia: Analise quais marcas saíram mais para comprar estoque similar."
                onClick={() => navigate('/leads?status=won')}
              />
              <KpiGlassCard
                label="Receita (Mês)"
                value={`R$ ${formatCurrency(revenueThisMonth)}`}
                trend={salesGrowth}
                icon={DollarSign}
                colorClass="text-teal-600 bg-teal-500/10"
                glowClass="bg-teal-400/30"
                info="Dinheiro entrando no caixa. Estratégia: Compare com o custo do estoque para entender sua margem real bruta."
                onClick={() => navigate('/reporting')}
              />
              <KpiGlassCard
                label="Leads no Mês"
                value={leadsThisMonth.length}
                trend={leadsGrowth}
                icon={Users}
                colorClass="text-indigo-600 bg-indigo-500/10"
                glowClass="bg-indigo-400/30"
                info="Volume de oportunidades criadas este mês. Estratégia: Se baixo, invista em tráfego ou mídias. Se alto com pouca venda, cheque o atendimento."
                onClick={() => navigate('/leads')}
              />
              <KpiGlassCard
                label="Taxa Conversão"
                value={`${conversionRate.toFixed(1)}%`}
                icon={Percent}
                colorClass="text-purple-600 bg-purple-500/10"
                glowClass="bg-purple-400/30"
                info="Sua eficiência comercial. Estratégia: O ideal é acima de 10%. Abaixo disso indica gargalo na negociação ou leads desqualificados."
                onClick={() => navigate('/reporting')}
              />
              <KpiGlassCard
                label="Estoque"
                value={availableVehicles.length}
                icon={Car}
                colorClass="text-blue-600 bg-blue-500/10"
                glowClass="bg-blue-400/30"
                info="Quantidade de veículos disponíveis. Estratégia: Estoque parado é dinheiro morrendo. Foque nos carros que estão há mais de 30 dias na loja."
                onClick={() => navigate('/inventory')}
              />
              <KpiGlassCard
                label="Ticket Médio"
                value={`R$ ${formatCurrency(ticketMedioVendas)}`}
                icon={Target}
                colorClass="text-rose-600 bg-rose-500/10"
                glowClass="bg-rose-400/30"
                info="Valor médio das suas vendas. Estratégia: Se quiser aumentar o faturamento sem aumentar o número de vendas, foque em produtos de maior valor."
                onClick={() => navigate('/reporting')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <MiniStat label="Volume de Vendas Mensal" value={`R$ ${formatCurrency(revenueThisMonth)}`} icon={DollarSign} />
              <MiniStat label="Lucro Bruto Estimado" value={`R$ ${formatCurrency(monthlyGrossProfit)}`} icon={TrendingUp} />
              <MiniStat label="Tempo Méd. Venda" value={`${averageDaysToSell.toFixed(1)} dias`} icon={Timer} />
              <MiniStat label="Leads Parados" value={attentionLeads.length} icon={AlertTriangle} subtitle="Sem atualização há mais de 15 dias" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
              <GlassSection>
                <SectionHeader icon={Award} title="Funil do Mês" subtitle="Estoque → Leads → Visitas → Vendas" color="text-teal-500 bg-teal-500/10 border-teal-500/20" />
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">

                    {/* — Estoque — */}
                    <div className="rounded-2xl bg-indigo-50/60 border border-indigo-100/50 p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                          <Car size={14} className="text-indigo-500" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500">Estoque</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs font-bold text-slate-500">Giro mensal</span>
                          <span className="text-sm font-black text-indigo-600">{stockTurnover.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs font-bold text-slate-500">Tempo médio de venda</span>
                          <span className={`text-sm font-black ${averageDaysToSell > 45 ? 'text-rose-500' : 'text-slate-700'}`}>{averageDaysToSell.toFixed(0)}d</span>
                        </div>
                        {staleVehicles > 0 && (
                          <div className="flex justify-between items-baseline pt-1 border-t border-indigo-100/50">
                            <span className="text-xs font-bold text-rose-400">Parados +60d</span>
                            <span className="text-sm font-black text-rose-500">{staleVehicles}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* — Leads — */}
                    <div className="rounded-2xl bg-emerald-50/60 border border-emerald-100/50 p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                          <Users size={14} className="text-emerald-500" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Leads</span>
                      </div>
                      <div>
                        {profile?.monthly_leads_goal ? (
                          <>
                            <div className="flex justify-between items-baseline mb-2">
                              <span className="text-3xl font-black text-emerald-700">{leadsThisCalMonth}</span>
                              <span className="text-xs font-bold text-slate-400">/{profile.monthly_leads_goal}</span>
                            </div>
                            <div className="h-2 w-full bg-emerald-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-emerald-500 transition-all duration-700" style={{ width: `${Math.min((leadsThisCalMonth / profile.monthly_leads_goal) * 100, 100)}%` }} />
                            </div>
                            <p className="text-[9px] font-bold text-slate-400 mt-1">{Math.round((leadsThisCalMonth / profile.monthly_leads_goal) * 100)}% da meta</p>
                          </>
                        ) : (
                          <p className="text-3xl font-black text-slate-800">{leadsThisCalMonth}<span className="text-sm font-bold text-slate-400 ml-1">leads</span></p>
                        )}
                      </div>
                    </div>

                    {/* — Visitas — */}
                    <div className="rounded-2xl bg-blue-50/60 border border-blue-100/50 p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                          <Calendar size={14} className="text-blue-500" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-blue-600">Visitas</span>
                      </div>
                      <div>
                        {profile?.monthly_visits_goal ? (
                          <>
                            <div className="flex justify-between items-baseline mb-2">
                              <span className="text-3xl font-black text-blue-700">{visitsThisMonthDone}</span>
                              <span className="text-xs font-bold text-slate-400">/{profile.monthly_visits_goal}</span>
                            </div>
                            <div className="h-2 w-full bg-blue-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-blue-500 transition-all duration-700" style={{ width: `${Math.min((visitsThisMonthDone / profile.monthly_visits_goal) * 100, 100)}%` }} />
                            </div>
                            <p className="text-[9px] font-bold text-slate-400 mt-1">{Math.round((visitsThisMonthDone / profile.monthly_visits_goal) * 100)}% da meta</p>
                          </>
                        ) : (
                          <p className="text-3xl font-black text-slate-800">{visitsThisMonthDone}<span className="text-sm font-bold text-slate-400 ml-1">realizadas</span></p>
                        )}
                        {visitsThisMonthTotal > 0 && (
                          <p className="text-[9px] font-bold text-slate-400 mt-1">{visitShowRate}% de comparecimento ({visitsThisMonthTotal} agendadas)</p>
                        )}
                      </div>
                    </div>

                    {/* — Vendas — */}
                    <div className="rounded-2xl bg-teal-50/60 border border-teal-100/50 p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-teal-500/10 flex items-center justify-center">
                          <ShoppingBag size={14} className="text-teal-500" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-teal-600">Vendas</span>
                      </div>
                      <div className="space-y-2">
                        <div>
                          {monthlyGoal > 0 ? (
                            <>
                              <div className="flex justify-between items-baseline mb-1">
                                <span className="text-2xl font-black text-teal-700">{salesCountThisCalMonth}</span>
                                <span className="text-xs font-bold text-slate-400">/{monthlyGoal} unid.</span>
                              </div>
                              <div className="h-2 w-full bg-teal-100 rounded-full overflow-hidden">
                                {(() => { const pct = Math.min((salesCountThisCalMonth / monthlyGoal) * 100, 100); return <div className={`h-full rounded-full transition-all duration-700 ${pct < 30 ? 'bg-rose-400' : pct < 75 ? 'bg-amber-400' : 'bg-teal-500'}`} style={{ width: `${pct}%` }} />; })()}
                              </div>
                            </>
                          ) : (
                            <p className="text-2xl font-black text-slate-800">{salesCountThisCalMonth}<span className="text-sm font-bold text-slate-400 ml-1">vendas</span></p>
                          )}
                        </div>
                        {profile?.monthly_revenue_goal ? (
                          <div className="pt-1 border-t border-teal-100/50">
                            <div className="flex justify-between items-baseline mb-1">
                              <span className="text-xs font-bold text-slate-500">Faturamento</span>
                              <span className="text-xs font-black text-teal-700">R$ {formatCurrency(revenueThisCalMonth)}</span>
                            </div>
                            <div className="h-1.5 w-full bg-teal-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-teal-400 transition-all duration-700" style={{ width: `${Math.min((revenueThisCalMonth / profile.monthly_revenue_goal) * 100, 100)}%` }} />
                            </div>
                            <p className="text-[9px] font-bold text-slate-400 mt-0.5">{Math.round((revenueThisCalMonth / profile.monthly_revenue_goal) * 100)}% de R$ {formatCurrency(profile.monthly_revenue_goal)}</p>
                          </div>
                        ) : (
                          <p className="text-xs font-bold text-slate-400">R$ {formatCurrency(revenueThisCalMonth)}</p>
                        )}
                        {salesNeeded > 0 && monthlyGoal > 0 && (
                          <p className="text-[9px] font-bold text-amber-500">{salesPerDayNeeded}/dia nos próximos {daysLeftInMonth}d</p>
                        )}
                      </div>
                    </div>

                </div>
              </GlassSection>

              <GlassSection>
                <div className="flex items-center justify-between mb-6">
                  <SectionHeader icon={FireIcon} title="Radar Quente" subtitle="Leads com alta intenção" color="text-red-500 bg-red-500/10 border-red-500/20" />
                </div>

                <div className="flex flex-col gap-6">
                  <div className="flex items-end justify-between px-2 pb-4">
                    <div>
                      <p className="text-5xl font-black text-slate-800 tracking-tight">{hotLeads}</p>
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400 mt-2">Leads Quentes 🎉</p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    {funnelData.filter(d => ['Visita', 'Simulação', 'Pagamento'].includes(d.name)).map((item) => (
                      <PhaseGlassBar key={item.name} label={item.name} value={item.value} total={activeLeads.length} color={item.color} />
                    ))}
                  </div>
                </div>
              </GlassSection>
            </div>

            {/* Vendas em Processamento */}
            <GlassSection>
              <div className="flex items-center justify-between mb-6">
                <SectionHeader icon={ShoppingBag} title="Vendas em Processamento" subtitle="Fluxo pós-venda" color="text-emerald-500 bg-emerald-500/10 border-emerald-500/20" />
                <button
                  onClick={() => navigate('/sales-flow')}
                  className="px-4 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 text-xs font-bold transition-all"
                >
                  Ver Kanban →
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
                    <p className="text-xs font-black uppercase tracking-widest text-blue-600">Documentação</p>
                    <p className="text-2xl font-black text-blue-900 mt-2">{leads.filter(l => l.saleStatus === 'documentacao').length}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-orange-50 border border-orange-100">
                    <p className="text-xs font-black uppercase tracking-widest text-orange-600">Entrega</p>
                    <p className="text-2xl font-black text-orange-900 mt-2">{leads.filter(l => l.saleStatus === 'entrega').length}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                    <p className="text-xs font-black uppercase tracking-widest text-emerald-600">Em Garantia</p>
                    <p className="text-2xl font-black text-emerald-900 mt-2">{leads.filter(l => l.saleStatus === 'em_garantia').length}</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Total de Vendas</p>
                  <p className="text-3xl font-black text-slate-900 mt-2">{leads.filter(l => l.saleStatus).length}</p>
                  <p className="text-xs font-bold text-slate-500 mt-2">Leads em fluxo de pós-venda</p>
                </div>
              </div>
            </GlassSection>
          </div>
        )}

        {/* ═══════════════════════ TAB: COMERCIAL ═══════════════════════ */}
        {activeTab === 'comercial' && (
          <div className="space-y-8 animate-fadeUp">
            <GlassSection>
              <SectionHeader icon={Flame} title="Ações de Alto Impacto" subtitle="Você pode vender hoje" color="text-orange-500 bg-orange-500/10 border-orange-500/20" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                <ActionMetricCard title="Matches de Carros" value={matchesProntos} subtitle="Buscam carro no estoque" icon={Car} colorClass="text-emerald-600 bg-emerald-500/10" />
                <ActionMetricCard title="A Ponto de Fechar" value={prontosParaFechar} subtitle="Simulando ou Avaliando" icon={Target} colorClass="text-sky-600 bg-sky-500/10" />
                <ActionMetricCard title="Leads Esquecidos" value={leadsEsquecidos} subtitle="Sem contato recente" icon={Clock} colorClass="text-amber-600 bg-amber-500/10" />
              </div>
            </GlassSection>

            <GlassSection>
              <SectionHeader icon={DollarSign} title="Performance Financeira" subtitle="Destaques de vendas do mês" color="text-emerald-500 bg-emerald-500/10 border-emerald-500/20" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8 pb-8 border-b border-slate-100/50">
                <div className="md:col-span-2">
                  <MiniStat label="Faturamento Total (Mês)" value={`R$ ${formatCurrency(revenueThisMonth)}`} trend={salesGrowth} />
                </div>
                <div>
                  <MiniStat label="Ticket Médio" value={`R$ ${formatCurrency(ticketMedioVendas)}`} icon={Target} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
                <MiniStat label="Com Entrada" value={leadsComEntrada} icon={Handshake} />
                <MiniStat label="Com Troca" value={leadsComTroca} icon={Repeat} />
                <MiniStat label="Tempo Méd. Venda" value={`${averageDaysToSell.toFixed(1)} dias`} icon={Timer} />
                <MiniStat label="Desqualificados" value={leads.filter(l => l.phase === LeadPhase.DISQUALIFIED).length} icon={UserX} />
              </div>

              {salesByBrand.length > 0 && (
                <div className="mt-10">
                  <p className="text-xs uppercase tracking-widest font-black text-slate-400 mb-6 flex items-center gap-2"><Award size={14} /> Vendas por Marca (Mês)</p>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={salesByBrand} layout="vertical">
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12, fontWeight: 800, fill: '#64748b' }} />
                        <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }} />
                        <Bar dataKey="value" fill="#10b981" radius={[0, 12, 12, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </GlassSection>
          </div>
        )}

        {/* ═══════════════════════ TAB: ESTOQUE ═══════════════════════ */}
        {activeTab === 'estoque' && (
          <div className="space-y-8 animate-fadeUp">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <GlassSection>
                <SectionHeader icon={Car} title="Inventário Atual" subtitle="Giro e Valor" color="text-indigo-500 bg-indigo-500/10 border-indigo-500/20" />
                <div className="grid grid-cols-2 gap-6 mt-8">
                  <MiniStat label="Veículos Disp." value={availableVehicles.length} icon={Car} />
                  <MiniStat label="Giro Mensal" value={`${stockTurnover.toFixed(1)}%`} icon={TrendingUp} />
                </div>
                <div className="mt-6 mb-6">
                  <MiniStat label="Valor Imobilizado Completo" value={`R$ ${formatCurrency(totalStockValue)}`} icon={DollarSign} />
                </div>

                <div className="mt-8 p-6 rounded-3xl bg-slate-50 border border-slate-100 flex flex-col gap-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-slate-500">Mais Caro</span>
                    <span className="font-black text-slate-900">{mostExpensive ? `R$ ${formatCurrency(mostExpensive.price)}` : 'R$ 0'}</span>
                  </div>
                  <div className="h-px bg-slate-200" />
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-slate-500">Mais Barato</span>
                    <span className="font-black text-slate-900">{cheapest ? `R$ ${formatCurrency(cheapest.price)}` : 'R$ 0'}</span>
                  </div>
                </div>
              </GlassSection>

              <GlassSection>
                <SectionHeader icon={Package} title="Distribuição do Stock" subtitle="Categorias disponíveis" color="text-rose-500 bg-rose-500/10 border-rose-500/20" />
                <div className="mt-8 space-y-5">
                  {stockByCategory.length > 0 ? stockByCategory.slice(0, 6).map((item) => (
                    <PhaseGlassBar key={item.name} label={item.name} value={item.value} total={availableVehicles.length} color="#3b82f6" />
                  )) : (
                    <div className="flex flex-col items-center justify-center text-center py-16 border border-dashed border-rose-300 bg-rose-50/50 rounded-[32px]">
                      <p className="text-6xl font-black text-rose-600 mb-4">0</p>
                      <p className="text-sm font-bold uppercase tracking-widest text-rose-500/80">veículos disponíveis para venda</p>
                    </div>
                  )}
                </div>
              </GlassSection>
            </div>

            <GlassSection>
              <SectionHeader icon={BarChart3} title="Inteligência de Mercado" subtitle="O que pesquisam na loja" color="text-purple-500 bg-purple-500/10 border-purple-500/20" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mt-10">
                <ChartCard title="Interesse por Marca" data={brandInterest} />
                <ChartCard title="Tipo de Veículo" data={typeInterest} />
                <ChartCard title="Modelo Busca" data={modelInterest} />
                <ChartCard title="Origem / Canal" data={leadSources} />
              </div>
            </GlassSection>

          </div>
        )}

        {/* ═══════════════════════ TAB: AGENDA ═══════════════════════ */}
        {activeTab === 'agenda' && (
          <div className="space-y-8 animate-fadeUp">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <GlassSection>
                <div className="flex items-center justify-between mb-8">
                  <SectionHeader icon={Calendar} title="Agenda Visitas" subtitle="Resumo do dia" color="text-rose-500 bg-rose-500/10 border-rose-500/20" />
                  <button onClick={() => navigate('/agenda')} className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 transition-all shadow-xl hover:-translate-y-1">
                    <ArrowRight size={20} />
                  </button>
                </div>
                <div className="space-y-4">
                  <AgendaRow icon={Users} label="Visitas Agendadas" value={visToday} subtitle="Total para o dia de hoje" colorClass="text-amber-600 bg-amber-50" />
                  <AgendaRow icon={CheckCircle2} label="Visitas Realizadas" value={visitsDoneToday} subtitle="Concluídas com sucesso" colorClass="text-emerald-600 bg-emerald-50 border border-emerald-100" />
                </div>
              </GlassSection>

              <GlassSection>
                <div className="flex items-center justify-between mb-8">
                  <SectionHeader icon={PhoneCall} title="Follow-Ups" subtitle="Próximos contatos" color="text-blue-500 bg-blue-500/10 border-blue-500/20" />
                </div>
                <div className="space-y-4">
                  <AgendaRow icon={PhoneCall} label="Follow-Ups p/ Hoje" value={followupsToday} subtitle="Ligue ou mande mensagem" colorClass="text-blue-600 bg-blue-50" />
                  <AgendaRow icon={PhoneCall} label="Follow-Ups p/ Amanhã" value={followupsTomorrow} subtitle="Preparar contatos para o dia seguinte" colorClass="text-blue-500 bg-blue-50/60" />
                </div>
              </GlassSection>

              <GlassSection>
                <div className="flex items-center justify-between mb-8">
                  <SectionHeader icon={Clock} title="Projeção Amanhã" subtitle="O que está por vir" color="text-slate-500 bg-slate-100 border-slate-200" />
                </div>
                <div className="flex flex-col gap-4">
                  <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Novas Visitas</p>
                      <p className="text-3xl font-black text-slate-800 mt-2">{appointmentsTomorrow}</p>
                    </div>
                    <div className="text-4xl opacity-20">📅</div>
                  </div>
                </div>
              </GlassSection>
            </div>
          </div>
        )}
      </PageContainer>
    </div>
  );
};

// ═══════════════════════ LIGUID GLASS SUBCOMPONENTS ═══════════════════════
const FireIcon = Flame;

const GlassSection = ({ children }: any) => (
  <div className="bg-white/50 backdrop-blur-3xl border border-white/60 p-8 md:p-10 rounded-[40px] shadow-[0_8px_32px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_40px_rgb(0,0,0,0.06)] transition-all">
    {children}
  </div>
);

const SectionHeader = ({ icon: Icon, title, subtitle, color }: any) => (
  <div className="flex items-center gap-5">
    <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center shadow-inner border ${color}`}>
      <Icon size={24} className="opacity-90" strokeWidth={2.5} />
    </div>
    <div>
      <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none">{title}</h2>
      <p className="text-[11px] uppercase tracking-widest font-black text-slate-400 mt-2 opacity-80">{subtitle}</p>
    </div>
  </div>
);

const KpiGlassCard = ({ label, value, trend, icon: Icon, colorClass, glowClass, info, onClick }: any) => (
  <div
    onClick={onClick}
    className={`bg-white/60 backdrop-blur-3xl border border-white/80 p-6 rounded-[32px] shadow-[0_8px_24px_rgb(0,0,0,0.03)] transition-all group relative flex flex-col justify-between min-h-[160px] z-10 ${onClick ? 'cursor-pointer hover:bg-white/80 hover:shadow-xl' : ''} hover:z-[100]`}
  >
    {/* Glow clipping container */}
    <div className="absolute inset-0 rounded-[32px] overflow-hidden pointer-events-none">
      <div className={`absolute -right-6 -bottom-6 w-32 h-32 rounded-full blur-3xl transition-transform group-hover:scale-[1.5] ${glowClass}`} />
    </div>

    <div className="flex justify-between items-start relative z-10">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${colorClass}`}>
        <Icon size={20} strokeWidth={2.5} />
      </div>
      <div className="flex flex-col items-end gap-2">
        {trend !== undefined && trend !== 0 && (
          <span className={`text-xs uppercase font-bold tracking-widest px-2.5 py-1 rounded-xl shadow-sm border border-white/40 ${trend >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
            {trend > 0 ? '+' : ''}{trend.toFixed(0)}%
          </span>
        )}

        {info && (
          <div className="relative group/info z-[100]">
            <div className="p-2 transition-colors hover:text-slate-800 text-slate-400 cursor-help">
              <Info size={16} />
            </div>
            <div className="absolute right-0 top-10 w-64 p-4 rounded-2xl bg-slate-900/95 backdrop-blur-xl text-white text-xs font-medium leading-relaxed shadow-2xl opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all z-[9999] border border-white/10 pointer-events-none translate-y-2 group-hover/info:translate-y-0 text-center">
              <div className="absolute -top-1.5 right-2 w-3 h-3 bg-slate-900 transform rotate-45 border-t border-l border-white/10" />
              {info}
            </div>
          </div>
        )}
      </div>
    </div>
    <div className="relative z-10 mt-auto pt-6">
      <h3 className="text-3xl lg:text-4xl font-bold text-slate-800 tracking-tight leading-none break-all">{value}</h3>
      <p className="text-xs uppercase font-bold text-slate-400 tracking-widest mt-2">{label}</p>
    </div>
  </div>
);

const ActionMetricCard = ({ title, value, subtitle, icon: Icon, colorClass, action }: any) => (
  <div onClick={action} className={`bg-white/60 backdrop-blur-md border border-white/60 p-6 rounded-[32px] shadow-sm flex flex-col justify-between min-h-[160px] ${action ? 'cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all' : ''}`}>
    <div className="flex items-start justify-between mb-4">
      <div className={`w-12 h-12 rounded-[20px] shadow-inner flex items-center justify-center ${colorClass}`}>
        <Icon size={20} strokeWidth={2.5} />
      </div>
      <p className="text-4xl font-black text-slate-800 tracking-tight leading-none">{value}</p>
    </div>
    <div className="mt-auto">
      <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-1">{title}</p>
      <p className="text-xs font-bold text-slate-400 truncate opacity-70">{subtitle}</p>
    </div>
  </div>
);

const MiniStat = ({ label, value, subtitle, icon: Icon, trend }: any) => (
  <div className="bg-white/60 border border-white/80 p-6 rounded-[28px] shadow-sm relative overflow-hidden">
    <div className="flex items-center justify-between mb-4 relative z-10">
      <p className="text-xs uppercase tracking-widest font-black text-slate-400 truncate pr-2">{label}</p>
      {Icon && <Icon size={16} className="text-slate-300 shrink-0" />}
    </div>
    <div className="flex items-center gap-3 relative z-10">
      <p className="text-2xl lg:text-3xl font-black text-slate-800 leading-tight truncate">{value}</p>
      {trend !== undefined && trend !== 0 && (
        <span className={`text-[9px] uppercase font-black tracking-widest px-2 py-0.5 rounded-lg ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {trend > 0 ? '+' : ''}{trend.toFixed(0)}%
        </span>
      )}
    </div>
    {subtitle && <p className="text-xs text-slate-400 font-bold mt-2 uppercase tracking-widest truncate relative z-10">{subtitle}</p>}
  </div>
);

const PhaseGlassBar = ({ label, value, total, color }: any) => {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="group">
      <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-500 mb-2">
        <span>{label}</span>
        <span className="text-slate-800">{value} <span className="text-slate-300 opacity-50 ml-1">({pct.toFixed(0)}%)</span></span>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
};

const ChartCard = ({ title, data }: { title: string, data: any[] }) => (
  <div>
    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">{title}</h3>
    {data.length > 0 ? (
      <div className="space-y-4">
        {data.slice(0, 4).map((item: any, idx: number) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
              <span className="text-xs font-black text-slate-600 truncate max-w-[120px] capitalize">{item.name}</span>
            </div>
            <span className="text-xs font-black text-slate-800 bg-slate-100/50 px-2 py-0.5 rounded-lg">{item.value}</span>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-[11px] text-slate-300 font-bold uppercase tracking-widest">Sem dados</p>
    )}
  </div>
);

const AgendaRow = ({ icon: Icon, label, value, subtitle, colorClass }: any) => (
  <div className="flex items-center justify-between p-5 rounded-[24px] border border-white/80 bg-white/60 shadow-sm hover:shadow-md transition-shadow cursor-default">
    <div className="flex items-center gap-5">
      <div className={`w-12 h-12 rounded-[18px] flex items-center justify-center shadow-inner ${colorClass}`}>
        <Icon size={20} strokeWidth={2.5} />
      </div>
      <div>
        <h4 className="text-sm font-black text-slate-800 tracking-tight">{label}</h4>
        {subtitle && <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1.5">{subtitle}</p>}
      </div>
    </div>
    <span className="text-3xl font-black text-slate-800 px-2">{value}</span>
  </div>
);

export default Dashboard;
