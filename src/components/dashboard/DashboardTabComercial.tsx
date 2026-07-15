import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Car, Target, Clock, Flame, DollarSign, Handshake, Repeat, Timer, UserX, Award
} from 'lucide-react';
import { Lead, LeadPhase } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import {
  GlassSection, SectionHeader, ActionMetricCard, MiniStat, COLORS
} from './DashboardUiComponents';

interface DashboardTabComercialProps {
  leads: Lead[];
  matchesProntos: number;
  prontosParaFechar: number;
  leadsEsquecidos: number;
  revenueThisMonth: number;
  salesGrowth: number;
  ticketMedioVendas: number;
  leadsComEntrada: number;
  leadsComTroca: number;
  averageDaysToSell: number;
  salesByBrand: { name: string; value: number }[];
}

export const DashboardTabComercial: React.FC<DashboardTabComercialProps> = ({
  leads,
  matchesProntos,
  prontosParaFechar,
  leadsEsquecidos,
  revenueThisMonth,
  salesGrowth,
  ticketMedioVendas,
  leadsComEntrada,
  leadsComTroca,
  averageDaysToSell,
  salesByBrand
}) => {
  return (
    <div className="space-y-8 animate-fadeUp">
      <GlassSection>
        <SectionHeader icon={Flame} title="Ações de Alto Impacto" subtitle="Você pode vender hoje" color="text-orange-500 bg-orange-500/10 border-orange-500/20" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          <ActionMetricCard title="Matches de Carros" value={matchesProntos} subtitle="Buscam carro no estoque" icon={Car} colorClass="text-primary bg-primary/10" />
          <ActionMetricCard title="A Ponto de Fechar" value={prontosParaFechar} subtitle="Simulando ou Avaliando" icon={Target} colorClass="text-sky-600 bg-sky-500/10 dark:text-sky-400 dark:bg-sky-950/30" />
          <ActionMetricCard title="Leads Esquecidos" value={leadsEsquecidos} subtitle="Sem contato recente" icon={Clock} colorClass="text-amber-600 bg-amber-500/10 dark:text-amber-400 dark:bg-amber-950/30" />
        </div>
      </GlassSection>

      <GlassSection>
        <SectionHeader icon={DollarSign} title="Performance Financeira" subtitle="Destaques de vendas do mês" color="text-primary bg-primary/10 border-primary/20" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8 pb-8 border-b border-border/60">
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
            <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-6 flex items-center gap-2"><Award size={14} /> Vendas por Marca (Mês)</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesByBrand} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11, fontWeight: 700, fill: 'var(--muted-foreground)' }} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }} />
                  <Bar dataKey="value" fill="var(--primary)" radius={[0, 12, 12, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </GlassSection>
    </div>
  );
};
