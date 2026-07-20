import type { LeadPreference } from '../types';

/**
 * Defaults de `LeadPreference`.
 *
 * Registros vindos do banco podem ter `preferences` incompleto ou nulo — leads
 * antigos, importações e criações automáticas (venda avulsa) não preenchem todos
 * os campos. Sem estes defaults, telas que iteram sobre os arrays quebram em
 * branco, e inputs de formulário alternam entre não-controlado e controlado.
 *
 * Uso: `{ ...leadPreferenceDefaults, ...(lead.preferences || {}) }`
 */
export const leadPreferenceDefaults: LeadPreference = {
    // arrays de carro
    tipos_veiculo: [],
    marcas: [],
    modelos: [],
    carro_transmissao: [],
    carro_motorizacao: [],

    // arrays de moto
    tipos_moto: [],
    marcas_moto: [],
    modelos_moto: [],
    moto_transmissao: [],
    moto_motorizacao: [],

    // campos legados de fallback
    transmissao: [],
    motorizacao: [],

    // escalares obrigatórios — `observacoes_adicionais` precisa ser string para
    // manter o textarea do LeadForm controlado
    observacoes_adicionais: '',
    possui_entrada: false,
    possui_troca: false,
};

/** Mescla as preferências de um lead sobre os defaults. */
export function withPreferenceDefaults(preferences?: Partial<LeadPreference> | null): LeadPreference {
    return { ...leadPreferenceDefaults, ...(preferences || {}) };
}
