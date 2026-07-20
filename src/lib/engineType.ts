import type { EngineType } from '../types';

/**
 * Valores válidos de `EngineType`, na mesma ordem da união em `types.ts`.
 * Mantenha os dois em sincronia — o teste de exaustividade abaixo quebra o
 * build se a união ganhar um valor que não estiver aqui.
 */
export const CAR_ENGINES = [
    '1.0', '1.3', '1.4', '1.5', '1.6', '1.8', '2.0', '2.0+', 'Elétrico', 'Híbrido',
] as const;

export const MOTO_ENGINES = [
    '110cc', '125cc', '150cc', '160cc', '190cc', '250cc', '300cc',
    '400cc', '600cc', '750cc', '1000cc', '1200cc+',
] as const;

export const ANY_ENGINE = 'Qualquer Um(a)' as const;

export const ENGINE_TYPES: readonly EngineType[] = [
    ...CAR_ENGINES,
    ...MOTO_ENGINES,
    ANY_ENGINE,
];

// Falha em tempo de compilação se ENGINE_TYPES deixar de cobrir a união EngineType.
const _exhaustive: EngineType = ANY_ENGINE;
void _exhaustive;

/** Diz se um valor arbitrário é um `EngineType` conhecido. */
export function isEngineType(value: unknown): value is EngineType {
    return typeof value === 'string' && (ENGINE_TYPES as readonly string[]).includes(value);
}

/**
 * Converte um valor vindo de fonte não confiável (API de placa, planilha
 * importada, `<select>` do DOM) em `EngineType`.
 *
 * Valores desconhecidos caem no `fallback` em vez de serem forçados com `as`,
 * que esconderia o dado inválido até quebrar em outro lugar.
 */
export function toEngineType(value: unknown, fallback: EngineType = ANY_ENGINE): EngineType {
    return isEngineType(value) ? value : fallback;
}
