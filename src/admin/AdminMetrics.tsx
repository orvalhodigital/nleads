import React, { useEffect, useState, useCallback } from 'react';
import { metricsService, Metrics, LojistaOption } from '../services/metricsService';
import { BarChart3, Users, Car, CheckCircle2, Clock, Sparkles, RefreshCw, AlertTriangle } from 'lucide-react';

const StatCard: React.FC<{ label: string; value: string; sub?: string; icon: React.ReactNode; color: string }> = ({ label, value, sub, icon, color }) => (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</span>
            <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>{icon}</span>
        </div>
        <div className="text-3xl font-black text-slate-900">{value}</div>
        {sub && <div className="text-xs font-medium text-slate-400 mt-1">{sub}</div>}
    </div>
);

const BarList: React.FC<{ title: string; rows: { label: string; count: number }[]; empty?: string }> = ({ title, rows, empty }) => {
    const max = Math.max(1, ...rows.map(r => r.count));
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-500 mb-4">{title}</h3>
            {rows.length === 0 ? (
                <p className="text-sm text-slate-400">{empty || 'Sem dados.'}</p>
            ) : (
                <div className="space-y-3">
                    {rows.map((r, i) => (
                        <div key={i}>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="font-semibold text-slate-700">{r.label}</span>
                                <span className="font-bold text-slate-900">{r.count}</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(r.count / max) * 100}%` }} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const MiniTrend: React.FC<{ title: string; data: { date: string; count: number }[] }> = ({ title, data }) => {
    const max = Math.max(1, ...data.map(d => d.count));
    const total = data.reduce((a, b) => a + b.count, 0);
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-500">{title}</h3>
                <span className="text-xs font-bold text-slate-400">{total} nos últimos 30 dias</span>
            </div>
            <div className="flex items-end gap-[3px] h-24">
                {data.map((d, i) => (
                    <div key={i} className="flex-1 bg-indigo-100 rounded-sm relative group" style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count > 0 ? '4px' : '2px' }} title={`${d.date}: ${d.count}`}>
                        <div className="absolute inset-0 bg-indigo-500 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                ))}
            </div>
        </div>
    );
};

const AdminMetrics: React.FC = () => {
    const [lojistas, setLojistas] = useState<LojistaOption[]>([]);
    const [selected, setSelected] = useState<string>(''); // '' = todos
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async (ownerId: string) => {
        setLoading(true);
        setError(null);
        try {
            const m = await metricsService.getMetrics(ownerId || null);
            setMetrics(m);
        } catch (err: any) {
            setError(err?.message || 'Erro ao carregar métricas.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        metricsService.getLojistas().then(setLojistas).catch(() => {});
    }, []);

    useEffect(() => {
        load(selected);
    }, [selected, load]);

    const fmtUsd = (n: number) => `US$ ${n.toFixed(2)}`;

    return (
        <div className="space-y-6 p-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                        <BarChart3 className="text-indigo-500" /> Métricas Globais
                    </h1>
                    <p className="text-sm text-slate-400 font-medium">Números da plataforma — leads, estoque, vendas e consumo de IA.</p>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={selected}
                        onChange={e => setSelected(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-400"
                    >
                        <option value="">Todos os lojistas</option>
                        {lojistas.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                    <button onClick={() => load(selected)} className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50" title="Atualizar">
                        <RefreshCw size={16} className={loading ? 'animate-spin text-indigo-500' : 'text-slate-500'} />
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700">
                    <AlertTriangle size={18} /> <span className="text-sm font-semibold">{error}</span>
                </div>
            )}

            {loading && !metrics ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 h-28 animate-pulse" />)}
                </div>
            ) : metrics ? (
                <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard label="Leads" value={String(metrics.leads.total)} sub="total capturados" icon={<Users size={18} className="text-white" />} color="bg-blue-500" />
                        <StatCard label="Em estoque" value={String(metrics.vehicles.inStock)} sub={`${metrics.vehicles.totalRegistered} cadastrados`} icon={<Car size={18} className="text-white" />} color="bg-emerald-500" />
                        <StatCard label="Vendidos" value={String(metrics.vehicles.sold)} sub="veículos" icon={<CheckCircle2 size={18} className="text-white" />} color="bg-violet-500" />
                        <StatCard label="Giro médio" value={metrics.vehicles.avgTurnoverDays != null ? `${metrics.vehicles.avgTurnoverDays}d` : '—'} sub="cadastro → venda" icon={<Clock size={18} className="text-white" />} color="bg-amber-500" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <MiniTrend title="Entrada de leads" data={metrics.leads.last30Days} />
                        <MiniTrend title="Entrada de veículos" data={metrics.vehicles.last30DaysEntries} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <BarList title="Leads por origem" rows={metrics.leads.bySource.map(r => ({ label: r.source, count: r.count }))} />
                        <BarList title="Leads por fase" rows={metrics.leads.byPhase.map(r => ({ label: r.phase, count: r.count }))} />
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                            <Sparkles size={16} className="text-indigo-500" /> Consumo de IA
                        </h3>
                        {metrics.ai.totalCalls === 0 ? (
                            <p className="text-sm text-slate-400">Nenhuma chamada de IA registrada ainda. O registro começa a partir do deploy desta funcionalidade.</p>
                        ) : (
                            <>
                                <div className="grid grid-cols-3 gap-4 mb-5">
                                    <div><div className="text-2xl font-black text-slate-900">{metrics.ai.totalCalls}</div><div className="text-xs text-slate-400 font-bold uppercase">Chamadas</div></div>
                                    <div><div className="text-2xl font-black text-slate-900">{metrics.ai.totalTokens.toLocaleString('pt-BR')}</div><div className="text-xs text-slate-400 font-bold uppercase">Tokens</div></div>
                                    <div><div className="text-2xl font-black text-slate-900">{fmtUsd(metrics.ai.estimatedCostUsd)}</div><div className="text-xs text-slate-400 font-bold uppercase">Custo estimado</div></div>
                                </div>
                                <BarList title="Por recurso" rows={metrics.ai.byFeature.map(r => ({ label: r.feature, count: r.count }))} />
                            </>
                        )}
                    </div>
                </>
            ) : null}
        </div>
    );
};

export default AdminMetrics;
