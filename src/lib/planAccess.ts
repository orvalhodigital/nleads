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
