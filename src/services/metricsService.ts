import { supabase } from '../lib/supabaseClient';

/**
 * Métricas globais para o painel do admin.
 *
 * A maior parte vem de dados que já existem (leads, vehicles) — só agrega. O
 * consumo de IA vem de `ai_usage_events` (registrado a partir de 2026-07-20).
 *
 * Leitura depende das políticas de admin no RLS (`is_current_user_admin`), que
 * liberam ver dados de todos os lojistas. O filtro `ownerId` restringe a um
 * lojista específico (o `user_id`/`admin_id` do dono da loja).
 *
 * Nota de escala: hoje agrega no cliente (volume pequeno). Para muitos tenants,
 * migrar as somas para RPCs no Postgres.
 */

export interface LojistaOption {
    id: string;
    name: string;
}

export interface Metrics {
    leads: {
        total: number;
        bySource: { source: string; count: number }[];
        byPhase: { phase: string; count: number }[];
        last30Days: { date: string; count: number }[];
    };
    vehicles: {
        inStock: number;
        sold: number;
        totalRegistered: number;
        avgTurnoverDays: number | null;
        last30DaysEntries: { date: string; count: number }[];
    };
    sales: {
        count: number;
        totalValue: number;
    };
    ai: {
        totalCalls: number;
        totalTokens: number;
        estimatedCostUsd: number;
        byFeature: { feature: string; count: number; tokens: number }[];
    };
}

function dayKey(iso: string): string {
    return new Date(iso).toISOString().slice(0, 10);
}

function last30DaysBuckets<T>(rows: T[], getIso: (r: T) => string | null | undefined): { date: string; count: number }[] {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const map = new Map<string, number>();
    for (let i = 29; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        map.set(d, 0);
    }
    for (const r of rows) {
        const iso = getIso(r);
        if (!iso) continue;
        const t = new Date(iso).getTime();
        if (t < cutoff) continue;
        const k = dayKey(iso);
        if (map.has(k)) map.set(k, (map.get(k) || 0) + 1);
    }
    return Array.from(map.entries()).map(([date, count]) => ({ date, count }));
}

function countBy<T>(rows: T[], key: (r: T) => string | null | undefined): { [k: string]: number } {
    const out: { [k: string]: number } = {};
    for (const r of rows) {
        const v = key(r) || '(sem)';
        out[v] = (out[v] || 0) + 1;
    }
    return out;
}

export const metricsService = {
    /** Lista de lojistas (empresas) para o filtro. */
    async getLojistas(): Promise<LojistaOption[]> {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, company_name, full_name')
            .eq('role', 'empresa')
            .order('company_name', { nullsFirst: false });
        if (error) throw error;
        return (data || []).map((p: any) => ({ id: p.id, name: p.company_name || p.full_name || '(sem nome)' }));
    },

    /** Métricas agregadas. `ownerId` opcional restringe a um lojista. */
    async getMetrics(ownerId?: string | null): Promise<Metrics> {
        // Filtro por lojista: leads/veículos podem ser do dono (user_id) ou da
        // equipe (admin_id). Buscamos ambos.
        const leadsQuery = supabase.from('leads').select('source, phase, created_at, sale_status, sale_date');
        const vehQuery = supabase.from('vehicles').select('status, created_at, sale_details');
        const aiQuery = supabase.from('ai_usage_events').select('feature, total_tokens, estimated_cost_usd');

        if (ownerId) {
            leadsQuery.or(`user_id.eq.${ownerId},admin_id.eq.${ownerId}`);
            vehQuery.or(`user_id.eq.${ownerId},admin_id.eq.${ownerId}`);
            aiQuery.eq('admin_id', ownerId);
        }

        const [leadsRes, vehRes, aiRes] = await Promise.all([leadsQuery, vehQuery, aiQuery]);
        if (leadsRes.error) throw leadsRes.error;
        if (vehRes.error) throw vehRes.error;
        // ai_usage_events pode não existir ainda em ambientes antigos: não quebra.
        const aiRows = aiRes.error ? [] : (aiRes.data || []);

        const leads = leadsRes.data || [];
        const vehicles = vehRes.data || [];

        // Giro médio: dias entre cadastro e venda dos veículos vendidos.
        const soldVehicles = vehicles.filter((v: any) => v.status === 'sold');
        const turnoverDays: number[] = [];
        for (const v of soldVehicles) {
            const soldIso = v.sale_details?.saleDate || v.sale_details?.sale_date;
            if (v.created_at && soldIso) {
                const days = (new Date(soldIso).getTime() - new Date(v.created_at).getTime()) / (24 * 60 * 60 * 1000);
                if (days >= 0 && days < 3650) turnoverDays.push(days);
            }
        }
        const avgTurnover = turnoverDays.length
            ? Math.round(turnoverDays.reduce((a, b) => a + b, 0) / turnoverDays.length)
            : null;

        // Vendas: leads com venda registrada.
        const salesLeads = leads.filter((l: any) => l.sale_status || l.sale_date);

        const aiTokens = aiRows.reduce((a: number, r: any) => a + Number(r.total_tokens || 0), 0);
        const aiCost = aiRows.reduce((a: number, r: any) => a + Number(r.estimated_cost_usd || 0), 0);
        const aiByFeatureCount = countBy(aiRows, (r: any) => r.feature);
        const aiByFeatureTokens: { [k: string]: number } = {};
        for (const r of aiRows as any[]) {
            const f = r.feature || '(sem)';
            aiByFeatureTokens[f] = (aiByFeatureTokens[f] || 0) + Number(r.total_tokens || 0);
        }

        const toArr = (obj: { [k: string]: number }, keyName: string) =>
            Object.entries(obj).map(([k, count]) => ({ [keyName]: k, count })) as any[];

        return {
            leads: {
                total: leads.length,
                bySource: toArr(countBy(leads, (l: any) => l.source), 'source').sort((a, b) => b.count - a.count),
                byPhase: toArr(countBy(leads, (l: any) => l.phase), 'phase').sort((a, b) => b.count - a.count),
                last30Days: last30DaysBuckets(leads, (l: any) => l.created_at),
            },
            vehicles: {
                inStock: vehicles.filter((v: any) => v.status !== 'sold').length,
                sold: soldVehicles.length,
                totalRegistered: vehicles.length,
                avgTurnoverDays: avgTurnover,
                last30DaysEntries: last30DaysBuckets(vehicles, (v: any) => v.created_at),
            },
            sales: {
                count: salesLeads.length,
                totalValue: 0, // valor por venda não é padronizado; exibido a partir do funil de vendas em fase futura
            },
            ai: {
                totalCalls: aiRows.length,
                totalTokens: aiTokens,
                estimatedCostUsd: Number(aiCost.toFixed(4)),
                byFeature: Object.keys(aiByFeatureCount).map((f) => ({
                    feature: f,
                    count: aiByFeatureCount[f],
                    tokens: aiByFeatureTokens[f] || 0,
                })).sort((a, b) => b.count - a.count),
            },
        };
    },
};
