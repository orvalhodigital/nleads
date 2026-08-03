import { supabase } from '../lib/supabaseClient';

/**
 * Consulta uma placa via o proxy autenticado do backend (api/consulta-placa.ts).
 * Substitui as chamadas antigas que iam direto para wdapi2.com.br com um token
 * hardcoded no frontend. Lança erro em caso de falha — quem chama decide como
 * exibir (nunca silenciar, ver DESIGN_GUIDELINES.md sobre esse padrão).
 */
export const consultaPlaca = async (plate: string): Promise<any> => {
  const cleanPlate = String(plate || '').replace(/[-\s]/g, '').toUpperCase();
  if (cleanPlate.length < 7) {
    throw new Error('Placa inválida (informe 7 caracteres).');
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  const response = await fetch('/api/consulta-placa', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ plate: cleanPlate }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || data?.mensagemRetorno || `Falha ao consultar placa (HTTP ${response.status}).`);
  }

  return data;
};
