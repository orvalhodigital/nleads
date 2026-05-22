export interface VehicleSlugifiable {
  id: string;
  brand: string;
  model: string;
  year: number;
  modelYear?: number;
}

/**
 * Gera um slug amigável para um veículo.
 * Formato: "honda-civic-2022-550e8400"
 * Onde os últimos 8 caracteres são do UUID do veículo (sem hifens).
 */
export function toVehicleSlug(vehicle: VehicleSlugifiable): string {
  const text = `${vehicle.brand} ${vehicle.model} ${vehicle.modelYear ?? vehicle.year}`;

  const slug = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const idSuffix = vehicle.id.replace(/-/g, '').slice(0, 8);
  return `${slug}-${idSuffix}`;
}

/**
 * Extrai o prefixo do UUID a partir de um parâmetro de slug.
 * Se for um UUID legado (formato completo), retorna como está.
 * Se for um slug amigável, extrai os 8 caracteres finais (prefixo hex do UUID).
 */
export function idFromVehicleSlug(param: string): string {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (uuidPattern.test(param)) {
    return param;
  }

  const match = param.match(/-([0-9a-f]{8})$/i);
  return match ? match[1] : param;
}
