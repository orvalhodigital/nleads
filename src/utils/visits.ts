import { Appointment, VisitStatus } from '../types';

/**
 * Deriva os campos legados `visit_date`/`visit_status` (nível do lead) a partir da
 * lista de agendamentos, escolhendo o de data mais recente.
 *
 * Por quê: `visit_date`/`visit_status` são um resumo de conveniência (usado por
 * contadores como "Visitas Marcadas Hoje" na Home/Dashboard) para leads que já
 * migraram para múltiplos agendamentos em `scheduling_data.appointments`. Antes,
 * cada tela que editava UM agendamento específico sobrescrevia esses campos de
 * forma incondicional com os dados daquele agendamento — inclusive quando era um
 * agendamento antigo sendo corrigido retroativamente. Isso corrompia o resumo do
 * lead (ex.: marcar uma visita passada como "faltou" apagava o status "pendente"
 * de uma visita futura já agendada). Usar sempre o agendamento de data mais
 * recente evita essa inconsistência.
 */
export function deriveRootVisitFields(appointments: Appointment[]): { visit_date?: string; visit_status?: VisitStatus } {
    if (!appointments || appointments.length === 0) return {};

    let latest: Appointment | null = null;
    for (const app of appointments) {
        if (!app.date) continue;
        const t = new Date(app.date).getTime();
        if (isNaN(t)) continue;
        if (!latest || t > new Date(latest.date).getTime()) latest = app;
    }

    if (!latest) return {};
    return { visit_date: latest.date, visit_status: latest.status };
}

/**
 * Constrói de forma segura uma string ISO de data/hora a partir de entradas do usuário.
 * Evita o lançamento de RangeError: Invalid time value se o navegador passar uma data sem fuso ou com formato incomum.
 */
export function safeIsoDate(dateStr?: string | null, timeStr?: string | null): string {
    if (!dateStr) return new Date().toISOString();
    try {
        const cleanTime = (timeStr || '00:00').trim();
        const timeParts = cleanTime.split(':');
        const hh = (timeParts[0] || '00').padStart(2, '0');
        const mm = (timeParts[1] || '00').padStart(2, '0');
        const ss = (timeParts[2] || '00').padStart(2, '0');

        let d: Date;
        const trimmedDate = dateStr.trim();

        if (trimmedDate.includes('T')) {
            d = new Date(trimmedDate);
        } else if (trimmedDate.includes('-')) {
            // YYYY-MM-DD
            d = new Date(`${trimmedDate}T${hh}:${mm}:${ss}`);
        } else if (trimmedDate.includes('/')) {
            // DD/MM/YYYY
            const parts = trimmedDate.split('/');
            if (parts.length === 3) {
                d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]), Number(hh), Number(mm), Number(ss));
            } else {
                d = new Date();
            }
        } else {
            d = new Date(trimmedDate);
        }

        if (isNaN(d.getTime())) return new Date().toISOString();
        return d.toISOString();
    } catch {
        return new Date().toISOString();
    }
}
