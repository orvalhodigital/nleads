import { supabase } from '../lib/supabaseClient';

/**
 * Consulta uma placa via o proxy autenticado do backend (api/consulta-placa.ts).
 * Substitui as chamadas antigas que iam direto para wdapi2.com.br com um token
 * hardcoded no frontend. Lança erro em caso de falha — quem chama decide como
 * exibir (nunca silenciar, ver DESIGN_GUIDELINES.md sobre esse padrão).
 */
export const consultaPlaca = async (plate: string): Promise<any> => {
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
    body: JSON.stringify({ plate }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || `Falha ao consultar placa (HTTP ${response.status}).`);
  }
  return data;
};
