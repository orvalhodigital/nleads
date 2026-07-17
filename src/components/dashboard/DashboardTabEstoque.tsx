import React from 'react';
import {
  Car, TrendingUp, DollarSign, Package, BarChart3
} from 'lucide-react';
import { Vehicle } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import {
  GlassSection, SectionHeader, MiniStat, PhaseGlassBar, ChartCard
} from './DashboardUiComponents';

interface DashboardTabEstoqueProps {
  availableVehicles: Vehicle[];
  stockTurnover: number;
  totalStockValue: number;
  mostExpensive: Vehicle | null;
  cheapest: Vehicle | null;
  stockByCategory: { name: string; value: number }[];
  brandInterest: { name: string; value: number }[];
  typeInterest: { name: string; value: number }[];
  modelInterest: { name: string; value: number }[];
  leadSources: { name: string; value: number }[];
}

export const DashboardTabEstoque: React.FC<DashboardTabEstoqueProps> = ({
  availableVehicles,
  stockTurnover,
  totalStockValue,
  mostExpensive,
  cheapest,
  stockByCategory,
  brandInterest,
  typeInterest,
  modelInterest,
  leadSources
}) => {
  return (
    <div className="space-y-8 animate-fadeUp">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <GlassSection>
          <SectionHeader icon={Car} title="Inventário Atual" subtitle="Giro e Valor" color="text-primary bg-primary/10 border-primary/20" />
          <div className="grid grid-cols-2 gap-6 mt-8">
            <MiniStat label="Veículos Disp." value={availableVehicles.length} icon={Car} />
            <MiniStat label="Giro Mensal" value={`${stockTurnover.toFixed(1)}%`} icon={TrendingUp} />
          </div>
          <div className="mt-6 mb-6">
            <MiniStat label="Valor Imobilizado Completo" value={`R$ ${formatCurrency(totalStockValue)}`} icon={DollarSign} />
          </div>

          <div className="mt-8 p-6 rounded-3xl bg-card/60 dark:bg-card/30 border border-border/80 flex flex-col gap-4">
            <div className="flex justify-between items-center text-sm">
              <span className="font-semibold text-muted-foreground">Mais Caro</span>
              <span className="font-bold text-foreground">{mostExpensive ? `R$ ${formatCurrency(mostExpensive.price)}` : 'R$ 0'}</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between items-center text-sm">
              <span className="font-semibold text-muted-foreground">Mais Barato</span>
              <span className="font-bold text-foreground">{cheapest ? `R$ ${formatCurrency(cheapest.price)}` : 'R$ 0'}</span>
            </div>
          </div>
        </GlassSection>

        <GlassSection>
          <SectionHeader icon={Package} title="Distribuição do Stock" subtitle="Categorias disponíveis" color="text-rose-500 bg-rose-500/10 border-rose-500/20 dark:text-rose-400 dark:bg-rose-950/30" />
          <div className="mt-8 space-y-5">
            {stockByCategory.length > 0 ? stockByCategory.slice(0, 6).map((item) => (
              <PhaseGlassBar key={item.name} label={item.name} value={item.value} total={availableVehicles.length} color="var(--primary)" />
            )) : (
              <div className="flex flex-col items-center justify-center text-center py-16 border border-dashed border-rose-500/20 bg-rose-500/5 rounded-3xl">
                <p className="text-6xl font-bold text-rose-600 dark:text-rose-400 mb-4">0</p>
                <p className="text-sm font-semibold uppercase tracking-widest text-rose-500 dark:text-rose-400">veículos disponíveis para venda</p>
              </div>
            )}
          </div>
        </GlassSection>
      </div>

      <GlassSection>
        <SectionHeader icon={BarChart3} title="Inteligência de Mercado" subtitle="O que pesquisam na loja" color="text-primary bg-primary/10 border-primary/20" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mt-10">
          <ChartCard title="Interesse por Marca" data={brandInterest} />
          <ChartCard title="Tipo de Veículo" data={typeInterest} />
          <ChartCard title="Modelo Busca" data={modelInterest} />
          <ChartCard title="Origem / Canal" data={leadSources} />
        </div>
      </GlassSection>
    </div>
  );
};
