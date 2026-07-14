import React from 'react';
import { Info } from 'lucide-react';

export const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#f97316'];

export const GlassSection: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-white/50 backdrop-blur-3xl border border-white/60 p-8 md:p-10 rounded-[40px] shadow-[0_8px_32px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_40px_rgb(0,0,0,0.06)] transition-all">
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
    <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center shadow-inner border ${color}`}>
      <Icon size={24} className="opacity-90" strokeWidth={2.5} />
    </div>
    <div>
      <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none">{title}</h2>
      <p className="text-[11px] uppercase tracking-widest font-black text-slate-400 mt-2 opacity-80">{subtitle}</p>
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
    className={`bg-white/60 backdrop-blur-3xl border border-white/80 p-6 rounded-[32px] shadow-[0_8px_24px_rgb(0,0,0,0.03)] transition-all group relative flex flex-col justify-between min-h-[160px] z-10 hover:z-50 ${onClick ? 'cursor-pointer hover:bg-white/80 hover:shadow-xl' : ''}`}
  >
    {/* Glow clipping container */}
    <div className="absolute inset-0 rounded-[32px] overflow-hidden pointer-events-none">
      <div className={`absolute -right-6 -bottom-6 w-32 h-32 rounded-full blur-3xl transition-transform group-hover:scale-[1.5] ${glowClass}`} />
    </div>

    <div className="flex justify-between items-start relative z-20">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${colorClass}`}>
        <Icon size={20} strokeWidth={2.5} />
      </div>
      <div className="flex flex-col items-end gap-2">
        {trend !== undefined && trend !== 0 && (
          <span className={`text-xs uppercase font-bold tracking-widest px-2.5 py-1 rounded-xl shadow-sm border border-white/40 ${trend >= 0 ? 'bg-brand-100 text-brand-700' : 'bg-rose-100 text-rose-700'}`}>
            {trend > 0 ? '+' : ''}{trend.toFixed(0)}%
          </span>
        )}

        {info && (
          <div className="relative group/info z-50">
            <div className="p-2 transition-colors hover:text-slate-800 text-slate-400 cursor-help">
              <Info size={16} />
            </div>
            <div className="absolute right-0 top-10 w-64 p-4 rounded-2xl bg-slate-900/95 backdrop-blur-xl text-white text-xs font-medium leading-relaxed shadow-2xl opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all z-[999] border border-white/10 pointer-events-none translate-y-2 group-hover/info:translate-y-0 text-center">
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

interface ActionMetricCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ComponentType<any>;
  colorClass: string;
  action?: () => void;
}

export const ActionMetricCard: React.FC<ActionMetricCardProps> = ({ title, value, subtitle, icon: Icon, colorClass, action }) => (
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

interface MiniStatProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ComponentType<any>;
  trend?: number;
}

export const MiniStat: React.FC<MiniStatProps> = ({ label, value, subtitle, icon: Icon, trend }) => (
  <div className="bg-white/60 border border-white/80 p-6 rounded-[28px] shadow-sm relative overflow-hidden">
    <div className="flex items-center justify-between mb-4 relative z-10">
      <p className="text-xs uppercase tracking-widest font-black text-slate-400 truncate pr-2">{label}</p>
      {Icon && <Icon size={16} className="text-slate-300 shrink-0" />}
    </div>
    <div className="flex items-center gap-3 relative z-10">
      <p className="text-2xl lg:text-3xl font-black text-slate-800 leading-tight truncate">{value}</p>
      {trend !== undefined && trend !== 0 && (
        <span className={`text-[9px] uppercase font-black tracking-widest px-2 py-0.5 rounded-lg ${trend >= 0 ? 'bg-brand-50 text-brand-600' : 'bg-rose-50 text-rose-600'}`}>
          {trend > 0 ? '+' : ''}{trend.toFixed(0)}%
        </span>
      )}
    </div>
    {subtitle && <p className="text-xs text-slate-400 font-bold mt-2 uppercase tracking-widest truncate relative z-10">{subtitle}</p>}
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

interface ChartCardProps {
  title: string;
  data: { name: string; value: number }[];
}

export const ChartCard: React.FC<ChartCardProps> = ({ title, data }) => (
  <div>
    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">{title}</h3>
    {data.length > 0 ? (
      <div className="space-y-4">
        {data.slice(0, 4).map((item, idx) => (
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

interface AgendaRowProps {
  icon: React.ComponentType<any>;
  label: string;
  value: number;
  subtitle?: string;
  colorClass: string;
}

export const AgendaRow: React.FC<AgendaRowProps> = ({ icon: Icon, label, value, subtitle, colorClass }) => (
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
