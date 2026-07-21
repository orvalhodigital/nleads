/**
 * Fonte única de verdade sobre o que cada plano libera.
 *
 * Antes desta lib, ~20 pontos do código repetiam `plan !== 'free' && plan !== 'trial'`.
 * Quando o "Plano Básico" (pago, R$47) ganhou o slug próprio `basico`, todos
 * esses pontos precisariam ser lembrados um a um. Centralizar aqui evita isso.
 *
 * Modelo de negócio (2026-07-20):
 * - trial   → limitado, tempo determinado (7 dias)
 * - basico  → PAGO, mas limitado: até 10 veículos, 50 leads
 * - pro     → Plano Ilimitado: tudo sem limite
 * - estrutura-ecv / estrutura-ecv-plus → ilimitado no sistema + serviço de
 *   tráfego pago (Meta Ads). O limite de "veículos anunciados" é do serviço,
 *   não do CRM — não é controlado aqui.
 *
 * `free` é mantido como sinônimo de limitado por compatibilidade: registros
 * antigos e trials expirados ainda usam esse valor.
 */

/** Planos com limite de 10 veículos e 50 leads. */
export const LIMITED_PLANS = ['free', 'trial', 'basico'] as const;

/**
 * Planos PAGOS. Distinto de "limitado": o Básico é pago **e** limitado.
 * `trial` e `free` não são pagos — são o período de teste e o pós-teste sem
 * contratação. Usado pelo paywall (ver `needsToChoosePlan`).
 */
export const PAID_PLANS = ['basico', 'pro', 'estrutura-ecv', 'estrutura-ecv-plus'] as const;

/** True se o plano é limitado (ou ausente). Cobre trial, básico e legado. */
export function isLimitedPlan(plan?: string | null): boolean {
    return !plan || (LIMITED_PLANS as readonly string[]).includes(plan);
}

/** True se o plano libera o sistema sem limites (Ilimitado, ECV, ECV Plus). */
export function hasUnlimitedAccess(plan?: string | null): boolean {
    return !isLimitedPlan(plan);
}

/** True se o plano é um dos planos pagos (independente de limite). */
export function hasPaidPlan(plan?: string | null): boolean {
    return !!plan && (PAID_PLANS as readonly string[]).includes(plan);
}

/**
 * Decide se o lojista precisa contratar um plano para continuar usando o sistema.
 *
 * Regra de negócio (2026-07-20): o cliente tem 7 dias de teste gratuito; depois
 * precisa escolher e contratar um plano. Bloqueia quando NÃO há plano pago e o
 * período de teste já terminou.
 *
 * Quem NÃO é bloqueado: qualquer plano pago (basico/pro/ecv/ecv-plus), e o trial
 * dentro dos 7 dias (`trialEndsAt` no futuro). Um cancelamento vira `plan='free'`
 * com o trial já vencido, então cai no bloqueio — correto.
 */
export function needsToChoosePlan(args: { plan?: string | null; trialEndsAt?: string | null }): boolean {
    if (hasPaidPlan(args.plan)) return false;
    if (!args.trialEndsAt) return false; // sem data de expiração conhecida: não bloqueia
    return new Date() > new Date(args.trialEndsAt);
}

// Graça do fluxo de assinatura paga (regra do dono, 2026-07-20):
//   vencimento + 1 dia   → webhook do Asaas marca plan_status='overdue' + overdue_since
//   graça de 3 dias      → ainda funciona, com banner no topo e botão de renovar
//   após a graça         → bloqueio (só a tela de Configurações fica acessível)
const GRACE_DAYS = 3;

export type AccessState =
    | 'full'              // acesso normal
    | 'overdue_grace'     // atrasado, mas ainda funciona (mostra banner)
    | 'overdue_blocked'   // atrasado além da graça — bloqueia tudo menos Configurações
    | 'must_choose_plan'; // trial vencido sem plano, ou assinatura cancelada

function daysSince(fromISO: string, toMs: number): number {
    return (toMs - new Date(fromISO).getTime()) / (24 * 60 * 60 * 1000);
}

/**
 * Estado de acesso do lojista.
 *
 * O atraso é dirigido pelo STATUS que o webhook do Asaas grava (não por uma
 * data, que em contas ajustadas à mão pode estar desatualizada e bloquear quem
 * está em dia):
 *   - planStatus 'active'   → acesso total (mesmo com vencimento passado)
 *   - planStatus 'overdue'  → graça de 3 dias a partir de `overdueSince`, depois bloqueia
 *   - planStatus 'canceled' → precisa contratar de novo (o webhook já põe plan='free')
 *
 * Para trial/free (sem plano pago), o gate é o fim do teste de 7 dias.
 */
export function getAccessState(args: {
    plan?: string | null;
    planStatus?: string | null;
    trialEndsAt?: string | null;
    overdueSince?: string | null;
}): AccessState {
    if (args.planStatus === 'canceled') return 'must_choose_plan';

    if (hasPaidPlan(args.plan)) {
        if (args.planStatus !== 'overdue') return 'full';
        // Atrasado: 3 dias de graça a partir de quando foi marcado.
        if (!args.overdueSince) return 'overdue_grace'; // marcado agora, sem timestamp ainda
        return daysSince(args.overdueSince, Date.now()) <= GRACE_DAYS ? 'overdue_grace' : 'overdue_blocked';
    }

    // Não é plano pago (trial/free): trial vencido → escolher plano.
    return needsToChoosePlan(args) ? 'must_choose_plan' : 'full';
}
