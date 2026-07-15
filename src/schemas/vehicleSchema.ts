import { z } from 'zod';

/**
 * Validação LENIENTE dos campos essenciais de um veículo/moto.
 * Valida marca/modelo (obrigatórios) e preço (se informado, precisa ser >= 0).
 * Só se usa `.safeParse(...).success`; o objeto original é preservado.
 */
const priceOk = (v: unknown): boolean => {
  if (v === null || v === undefined || v === '') return true;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0;
};

export const vehicleInputSchema = z.object({
  brand: z.string().trim().min(1, 'Informe a marca.'),
  model: z.string().trim().min(1, 'Informe o modelo.'),
  price: z.any().refine(priceOk, 'Preço inválido (deve ser um número maior ou igual a zero).'),
});

/** Retorna a 1ª mensagem de erro, ou null se válido. */
export function validateVehicleInput(data: unknown): string | null {
  const result = vehicleInputSchema.safeParse(data);
  return result.success ? null : (result.error.issues[0]?.message || 'Dados do veículo inválidos.');
}
