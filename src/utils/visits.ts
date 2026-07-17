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
