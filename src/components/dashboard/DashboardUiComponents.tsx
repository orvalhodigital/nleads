import React from 'react';
import { Info } from 'lucide-react';

export const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#f97316'];

export const GlassSection: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-card/45 backdrop-blur-3xl border border-border/60 p-6 md:p-8 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300">
    {children}
  </div>
);

interface SectionHeaderProps {
  icon: React.ComponentType<any>;
  title: string;
  subtitle: string;
  color: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ icon: Icon, title, subtitle, color }) => (
  <div className="flex items-center gap-5">
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner border border-border/80 ${color}`}>
      <Icon size={24} className="opacity-90" strokeWidth={2.5} />
    </div>
    <div>
      <h2 className="text-xl font-bold text-foreground tracking-tight leading-none">{title}</h2>
      <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mt-2 opacity-80">{subtitle}</p>
    </div>
  </div>
);

interface KpiGlassCardProps {
  label: string;
  value: string | number;
  trend?: number;
  icon: React.ComponentType<any>;
  colorClass: string;
  glowClass: string;
  info?: string;
  onClick?: () => void;
}

export const KpiGlassCard: React.FC<KpiGlassCardProps> = ({
  label, value, trend, icon: Icon, colorClass, glowClass, info, onClick
}) => (
  <div
    onClick={onClick}
    className={`bg-card/60 dark:bg-card/40 backdrop-blur-3xl border border-border/80 p-6 rounded-3xl shadow-sm shadow-purple-500/5 dark:shadow-black/25 transition-all duration-300 group relative flex flex-col justify-between min-h-[160px] z-10 ${onClick ? 'cursor-pointer hover:bg-card/90 dark:hover:bg-card/60 hover:shadow-md hover:shadow-purple-500/10' : ''}`}
  >
    {/* Glow clipping container */}
    <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
      <div className={`absolute -right-6 -bottom-6 w-32 h-32 rounded-full blur-3xl transition-transform group-hover:scale-[1.5] ${glowClass}`} />
    </div>

    <div className="flex justify-between items-start relative z-20">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-inner ${colorClass}`}>
        <Icon size={20} strokeWidth={2.5} />
      </div>
      <div className="flex flex-col items-end gap-2">
        {trend !== undefined && trend !== 0 && (
          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-lg shadow-sm border border-border/30 ${trend >= 0 ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground' : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'}`}>
            {trend > 0 ? '+' : ''}{trend.toFixed(0)}%
          </span>
        )}

        {info && (
          <div className="relative group/info z-50">
            <div className="p-2 transition-colors hover:text-foreground text-muted-foreground cursor-help">
              <Info size={16} />
            </div>
            <div className="absolute right-0 top-10 w-64 p-4 rounded-2xl bg-slate-950 text-white text-xs font-medium leading-relaxed shadow-2xl opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all z-[999] border border-white/10 pointer-events-none translate-y-2 group-hover/info:translate-y-0 text-center">
              <div className="absolute -top-1.5 right-2 w-3 h-3 bg-slate-950 transform rotate-45 border-t border-l border-white/10" />
              {info}
            </div>
          </div>
        )}
      </div>
    </div>
    <div className="relative z-10 mt-auto pt-6">
      <h3 className="text-3xl lg:text-4xl font-bold text-foreground tracking-tight leading-none break-all">{value}</h3>
      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mt-2">{label}</p>
    </div>
  </div>
);

interface ActionMetricCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ComponentType<any>;
  colorClass: string;
  action?: () => void;
}

export const ActionMetricCard: React.FC<ActionMetricCardProps> = ({ title, value, subtitle, icon: Icon, colorClass, action }) => (
  <div onClick={action} className={`bg-card/60 dark:bg-card/40 border border-border/60 p-6 rounded-3xl shadow-sm flex flex-col justify-between min-h-[160px] ${action ? 'cursor-pointer hover:shadow-md transition-all duration-300' : ''}`}>
    <div className="flex items-start justify-between mb-4">
      <div className={`w-12 h-12 rounded-xl shadow-inner flex items-center justify-center ${colorClass}`}>
        <Icon size={20} strokeWidth={2.5} />
      </div>
      <p className="text-4xl font-bold text-foreground tracking-tight leading-none">{value}</p>
    </div>
    <div className="mt-auto">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{title}</p>
      <p className="text-xs font-semibold text-muted-foreground/80 truncate opacity-70">{subtitle}</p>
    </div>
  </div>
);

interface MiniStatProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ComponentType<any>;
  trend?: number;
}

export const MiniStat: React.FC<MiniStatProps> = ({ label, value, subtitle, icon: Icon, trend }) => (
  <div className="bg-card/60 dark:bg-card/40 border border-border/80 p-5 rounded-2xl shadow-sm relative overflow-hidden transition-all duration-300">
    <div className="flex items-center justify-between mb-4 relative z-10">
      <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground truncate pr-2">{label}</p>
      {Icon && <Icon size={16} className="text-muted-foreground/40 shrink-0" />}
    </div>
    <div className="flex items-center gap-3 relative z-10">
      <p className="text-2xl lg:text-3xl font-bold text-foreground leading-tight truncate">{value}</p>
      {trend !== undefined && trend !== 0 && (
        <span className={`text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-lg ${trend >= 0 ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground' : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'}`}>
          {trend > 0 ? '+' : ''}{trend.toFixed(0)}%
        </span>
      )}
    </div>
    {subtitle && <p className="text-[9px] text-muted-foreground/80 font-bold mt-2 uppercase tracking-widest truncate relative z-10">{subtitle}</p>}
  </div>
);

interface PhaseGlassBarProps {
  label: string;
  value: number;
  total: number;
  color: string;
}

export const PhaseGlassBar: React.FC<PhaseGlassBarProps> = ({ label, value, total, color }) => {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="group">
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
        <span>{label}</span>
        <span className="text-foreground">{value} <span className="text-muted-foreground/45 ml-1">({pct.toFixed(0)}%)</span></span>
      </div>
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden shadow-inner">
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
};

interface ChartCardProps {
  title: string;
  data: { name: string; value: number }[];
}

export const ChartCard: React.FC<ChartCardProps> = ({ title, data }) => (
  <div>
    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-6">{title}</h3>
    {data.length > 0 ? (
      <div className="space-y-4">
        {data.slice(0, 4).map((item, idx) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
              <span className="text-xs font-semibold text-muted-foreground truncate max-w-[120px] capitalize">{item.name}</span>
            </div>
            <span className="text-xs font-bold text-foreground bg-muted px-2 py-0.5 rounded-lg">{item.value}</span>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest">Sem dados</p>
    )}
  </div>
);

interface AgendaRowProps {
  icon: React.ComponentType<any>;
  label: string;
  value: number;
  subtitle?: string;
  colorClass: string;
}

export const AgendaRow: React.FC<AgendaRowProps> = ({ icon: Icon, label, value, subtitle, colorClass }) => (
  <div className="flex items-center justify-between p-4 rounded-2xl border border-border/85 bg-card/60 dark:bg-card/40 shadow-sm hover:shadow-md transition-all duration-300 cursor-default">
    <div className="flex items-center gap-5">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-inner border border-border/40 ${colorClass}`}>
        <Icon size={20} strokeWidth={2.5} />
      </div>
      <div>
        <h4 className="text-sm font-semibold text-foreground tracking-tight">{label}</h4>
        {subtitle && <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mt-1.5">{subtitle}</p>}
      </div>
    </div>
    <span className="text-3xl font-bold text-foreground px-2">{value}</span>
  </div>
);
