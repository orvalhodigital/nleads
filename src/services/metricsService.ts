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

export interface TrendPoint { label: string; count: number; }

export interface Metrics {
    period: { fromISO: string | null; toISO: string };
    leads: {
        total: number;
        bySource: { source: string; count: number }[];
        byPhase: { phase: string; count: number }[];
        trend: TrendPoint[];
    };
    vehicles: {
        inStock: number;         // snapshot atual (não depende do período)
        entered: number;         // cadastrados no período
        sold: number;            // vendidos no período
        totalRegistered: number;
        avgTurnoverDays: number | null;
        trend: TrendPoint[];     // entradas ao longo do período
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

/**
 * Constrói a série temporal para o período [fromMs, toMs]. Escolhe a
 * granularidade: dia (períodos curtos) ou mês (períodos longos), para o gráfico
 * não virar centenas de barras.
 */
function buildTrend<T>(rows: T[], getIso: (r: T) => string | null | undefined, fromMs: number, toMs: number): TrendPoint[] {
    const DAY = 24 * 60 * 60 * 1000;
    const spanDays = Math.ceil((toMs - fromMs) / DAY);
    const monthly = spanDays > 92; // acima de ~3 meses agrupa por mês

    const buckets = new Map<string, number>();
    const keyOf = (t: number) => {
        const d = new Date(t);
        return monthly ? d.toISOString().slice(0, 7) : d.toISOString().slice(0, 10);
    };

    // Pré-popula os buckets vazios para o gráfico ter continuidade.
    if (monthly) {
        const d = new Date(fromMs); d.setUTCDate(1);
        while (d.getTime() <= toMs) { buckets.set(d.toISOString().slice(0, 7), 0); d.setUTCMonth(d.getUTCMonth() + 1); }
    } else {
        for (let t = fromMs; t <= toMs; t += DAY) buckets.set(new Date(t).toISOString().slice(0, 10), 0);
    }

    for (const r of rows) {
        const iso = getIso(r);
        if (!iso) continue;
        const t = new Date(iso).getTime();
        if (t < fromMs || t > toMs) continue;
        const k = keyOf(t);
        if (buckets.has(k)) buckets.set(k, (buckets.get(k) || 0) + 1);
    }
    return Array.from(buckets.entries()).map(([label, count]) => ({ label, count }));
}

function inPeriod(iso: string | null | undefined, fromMs: number | null, toMs: number): boolean {
    if (!iso) return false;
    const t = new Date(iso).getTime();
    if (fromMs != null && t < fromMs) return false;
    return t <= toMs;
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
    /**
     * Busca lojistas (empresas) pelo nome — no servidor, com limite. Feito para
     * escalar: com milhares de lojistas, não carrega todos; filtra por termo.
     * Termo vazio traz os primeiros N (para o dropdown já abrir com opções).
     */
    async searchLojistas(term: string, limit = 20): Promise<LojistaOption[]> {
        let q = supabase
            .from('profiles')
            .select('id, company_name, full_name')
            .eq('role', 'empresa')
            .limit(limit);

        const t = term.trim();
        if (t) {
            // Casa por nome da empresa OU nome do responsável.
            q = q.or(`company_name.ilike.%${t}%,full_name.ilike.%${t}%`);
        } else {
            q = q.order('company_name', { nullsFirst: false });
        }

        const { data, error } = await q;
        if (error) throw error;
        return (data || []).map((p: any) => ({ id: p.id, name: p.company_name || p.full_name || '(sem nome)' }));
    },

    /**
     * Métricas agregadas.
     * @param ownerId  restringe a um lojista (opcional).
     * @param fromISO  início do período; `null` = desde sempre. O fim é agora.
     *
     * As métricas de FLUXO (leads capturados, entradas de veículos, vendas,
     * consumo de IA) respeitam o período. "Em estoque" é sempre o retrato atual.
     */
    async getMetrics(ownerId?: string | null, fromISO?: string | null): Promise<Metrics> {
        const toMs = Date.now();
        const fromMs = fromISO ? new Date(fromISO).getTime() : null;

        // Filtro por lojista: leads/veículos podem ser do dono (user_id) ou da
        // equipe (admin_id). Buscamos ambos.
        const leadsQuery = supabase.from('leads').select('source, phase, created_at, sale_status, sale_date');
        // Veículos vêm todos (o "em estoque" é retrato atual); o período é
        // aplicado em memória para entradas/vendidos.
        const vehQuery = supabase.from('vehicles').select('status, created_at, sale_details');
        const aiQuery = supabase.from('ai_usage_events').select('feature, total_tokens, estimated_cost_usd, created_at');

        if (ownerId) {
            leadsQuery.or(`user_id.eq.${ownerId},admin_id.eq.${ownerId}`);
            vehQuery.or(`user_id.eq.${ownerId},admin_id.eq.${ownerId}`);
            aiQuery.eq('admin_id', ownerId);
        }
        // Filtro de data no servidor onde é direto (leads e IA).
        if (fromISO) {
            leadsQuery.gte('created_at', fromISO);
            aiQuery.gte('created_at', fromISO);
        }

        const [leadsRes, vehRes, aiRes] = await Promise.all([leadsQuery, vehQuery, aiQuery]);
        if (leadsRes.error) throw leadsRes.error;
        if (vehRes.error) throw vehRes.error;
        // ai_usage_events pode não existir ainda em ambientes antigos: não quebra.
        const aiRows = aiRes.error ? [] : (aiRes.data || []);

        const leads = leadsRes.data || []; // já filtrados por período no servidor
        const allVehicles = vehRes.data || [];

        // Veículos cadastrados NO período.
        const enteredVehicles = allVehicles.filter((v: any) => inPeriod(v.created_at, fromMs, toMs));

        // Vendidos NO período (pela data da venda).
        const soldIsoOf = (v: any) => v.sale_details?.saleDate || v.sale_details?.sale_date;
        const soldInPeriod = allVehicles.filter((v: any) => v.status === 'sold' && inPeriod(soldIsoOf(v), fromMs, toMs));

        // Giro médio: dias entre cadastro e venda, dos vendidos no período.
        const turnoverDays: number[] = [];
        for (const v of soldInPeriod) {
            const soldIso = soldIsoOf(v);
            if (v.created_at && soldIso) {
                const days = (new Date(soldIso).getTime() - new Date(v.created_at).getTime()) / (24 * 60 * 60 * 1000);
                if (days >= 0 && days < 3650) turnoverDays.push(days);
            }
        }
        const avgTurnover = turnoverDays.length
            ? Math.round(turnoverDays.reduce((a, b) => a + b, 0) / turnoverDays.length)
            : null;

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

        // Início do trend: se "desde sempre", usa o registro mais antigo (ou 90d).
        const trendFrom = fromMs ?? (
            leads.length
                ? Math.min(...leads.map((l: any) => new Date(l.created_at).getTime()).filter((n: number) => !isNaN(n)))
                : toMs - 90 * 24 * 60 * 60 * 1000
        );

        return {
            period: { fromISO: fromISO ?? null, toISO: new Date(toMs).toISOString() },
            leads: {
                total: leads.length,
                bySource: toArr(countBy(leads, (l: any) => l.source), 'source').sort((a, b) => b.count - a.count),
                byPhase: toArr(countBy(leads, (l: any) => l.phase), 'phase').sort((a, b) => b.count - a.count),
                trend: buildTrend(leads, (l: any) => l.created_at, trendFrom, toMs),
            },
            vehicles: {
                inStock: allVehicles.filter((v: any) => v.status !== 'sold').length,
                entered: enteredVehicles.length,
                sold: soldInPeriod.length,
                totalRegistered: allVehicles.length,
                avgTurnoverDays: avgTurnover,
                trend: buildTrend(enteredVehicles, (v: any) => v.created_at, trendFrom, toMs),
            },
            sales: {
                count: salesLeads.length,
                totalValue: 0,
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
