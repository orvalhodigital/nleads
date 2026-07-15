import { z } from 'zod';

/**
 * Validação LENIENTE dos campos essenciais de um lead.
 * Só valida nome/telefone/email — os demais campos do payload são ignorados
 * (usa-se apenas `.safeParse(...).success`; o objeto original é preservado).
 */
const emailOk = (v: unknown): boolean => {
  if (v === null || v === undefined || v === '') return true;
  return typeof v === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.trim());
};

export const leadInputSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome do lead (mínimo 2 caracteres).'),
  phone: z.string().trim().min(8, 'Informe um telefone válido (mínimo 8 dígitos).'),
  email: z.any().refine(emailOk, 'E-mail inválido.'),
});

/** Retorna a 1ª mensagem de erro, ou null se válido. */
export function validateLeadInput(data: unknown): string | null {
  const result = leadInputSchema.safeParse(data);
  return result.success ? null : (result.error.issues[0]?.message || 'Dados do lead inválidos.');
}
