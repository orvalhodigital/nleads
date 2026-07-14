import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Car, DollarSign, Flame, AlertTriangle, ShoppingBag, Award, Percent, Target, Timer, Calendar, TrendingUp
} from 'lucide-react';
import { Lead, Profile, Vehicle } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import {
  GlassSection, SectionHeader, KpiGlassCard, MiniStat, PhaseGlassBar
} from './DashboardUiComponents';

interface DashboardTabGeralProps {
  leads: Lead[];
  profile: Profile | null | undefined;
  attentionLeads: Lead[];
  staleVehicles: number;
  salesThisMonth: Vehicle[];
  salesCountGrowth: number;
  revenueThisMonth: number;
  salesGrowth: number;
  leadsThisMonth: Lead[];
  leadsGrowth: number;
  conversionRate: number;
  availableVehicles: Vehicle[];
  ticketMedioVendas: number;
  monthlyGrossProfit: number;
  averageDaysToSell: number;
  stockTurnover: number;
  leadsThisCalMonth: number;
  visitsThisMonthDone: number;
  visitsThisMonthTotal: number;
  visitShowRate: number;
  salesCountThisCalMonth: number;
  revenueThisCalMonth: number;
  salesPerDayNeeded: string;
  daysLeftInMonth: number;
  salesNeeded: number;
  hotLeads: number;
  activeLeads: Lead[];
  funnelData: { name: string; value: number; color: string }[];
  monthlyGoal: number;
}

export const DashboardTabGeral: React.FC<DashboardTabGeralProps> = ({
  leads,
  profile,
  attentionLeads,
  staleVehicles,
  salesThisMonth,
  salesCountGrowth,
  revenueThisMonth,
  salesGrowth,
  leadsThisMonth,
  leadsGrowth,
  conversionRate,
  availableVehicles,
  ticketMedioVendas,
  monthlyGrossProfit,
  averageDaysToSell,
  stockTurnover,
  leadsThisCalMonth,
  visitsThisMonthDone,
  visitsThisMonthTotal,
  visitShowRate,
  salesCountThisCalMonth,
  revenueThisCalMonth,
  salesPerDayNeeded,
  daysLeftInMonth,
  salesNeeded,
  hotLeads,
  activeLeads,
  funnelData,
  monthlyGoal
}) => {
  const navigate = useNavigate();

  return (
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
              <button onClick={() => navigate('/leads')} className="relative z-10 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-8 py-3.5 rounded-[20px] font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-amber-500/30 hover:-translate-y-0.5 whitespace-nowrap cursor-pointer">
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
              <button onClick={() => navigate('/inventory')} className="relative z-10 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white px-8 py-3.5 rounded-[20px] font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-rose-500/30 hover:-translate-y-0.5 whitespace-nowrap cursor-pointer">
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
          colorClass="text-brand-600 bg-brand-500/10"
          glowClass="bg-brand-400/30"
          info="Sua conversão final. Estratégia: Analise quais marcas saíram mais para comprar estoque similar."
          onClick={() => navigate('/leads?status=won')}
        />
        <KpiGlassCard
          label="Receita (Mês)"
          value={`R$ ${formatCurrency(revenueThisMonth)}`}
          trend={salesGrowth}
          icon={DollarSign}
          colorClass="text-brand-600 bg-brand-500/10"
          glowClass="bg-brand-400/30"
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
          <SectionHeader icon={Award} title="Funil do Mês" subtitle="Estoque → Leads → Visitas → Vendas" color="text-brand-500 bg-brand-500/10 border-brand-500/20" />
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
            <div className="rounded-2xl bg-brand-50/60 border border-brand-100/50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-brand-500/10 flex items-center justify-center">
                  <Users size={14} className="text-brand-500" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-brand-600">Leads</span>
              </div>
              <div>
                {profile?.monthly_leads_goal ? (
                  <>
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-3xl font-black text-brand-700">{leadsThisCalMonth}</span>
                      <span className="text-xs font-bold text-slate-400">/{profile.monthly_leads_goal}</span>
                    </div>
                    <div className="h-2 w-full bg-brand-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-brand-500 transition-all duration-700" style={{ width: `${Math.min((leadsThisCalMonth / profile.monthly_leads_goal) * 100, 100)}%` }} />
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
            <div className="rounded-2xl bg-brand-50/60 border border-brand-100/50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-brand-500/10 flex items-center justify-center">
                  <ShoppingBag size={14} className="text-brand-500" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-brand-600">Vendas</span>
              </div>
              <div className="space-y-2">
                <div>
                  {monthlyGoal > 0 ? (
                    <>
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-2xl font-black text-brand-700">{salesCountThisCalMonth}</span>
                        <span className="text-xs font-bold text-slate-400">/{monthlyGoal} unid.</span>
                      </div>
                      <div className="h-2 w-full bg-brand-100 rounded-full overflow-hidden">
                        {(() => { const pct = Math.min((salesCountThisCalMonth / monthlyGoal) * 100, 100); return <div className={`h-full rounded-full transition-all duration-700 ${pct < 30 ? 'bg-rose-400' : pct < 75 ? 'bg-amber-400' : 'bg-brand-500'}`} style={{ width: `${pct}%` }} />; })()}
                      </div>
                    </>
                  ) : (
                    <p className="text-2xl font-black text-slate-800">{salesCountThisCalMonth}<span className="text-sm font-bold text-slate-400 ml-1">vendas</span></p>
                  )}
                </div>
                {profile?.monthly_revenue_goal ? (
                  <div className="pt-1 border-t border-brand-100/50">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-xs font-bold text-slate-500">Faturamento</span>
                      <span className="text-xs font-black text-brand-700">R$ {formatCurrency(revenueThisCalMonth)}</span>
                    </div>
                    <div className="h-1.5 w-full bg-brand-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-brand-400 transition-all duration-700" style={{ width: `${Math.min((revenueThisCalMonth / profile.monthly_revenue_goal) * 100, 100)}%` }} />
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
            <SectionHeader icon={Flame} title="Radar Quente" subtitle="Leads com alta intenção" color="text-red-500 bg-red-500/10 border-red-500/20" />
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
          <SectionHeader icon={ShoppingBag} title="Vendas em Processamento" subtitle="Fluxo pós-venda" color="text-brand-500 bg-brand-500/10 border-brand-500/20" />
          <button
            onClick={() => navigate('/sales-flow')}
            className="px-4 py-2 rounded-lg bg-brand-500 text-white hover:bg-brand-600 text-xs font-bold transition-all cursor-pointer"
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
            <div className="p-4 rounded-2xl bg-brand-50 border border-brand-100">
              <p className="text-xs font-black uppercase tracking-widest text-brand-600">Em Garantia</p>
              <p className="text-2xl font-black text-brand-900 mt-2">{leads.filter(l => l.saleStatus === 'em_garantia').length}</p>
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
  );
};
