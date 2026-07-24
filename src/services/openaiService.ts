
import { Lead, Vehicle } from "../types";
import { supabase } from "../lib/supabaseClient";

export const getMatchingInsights = async (vehicle: Vehicle, qualifiedLeads: Lead[]) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch('/api/openai?action=matching-insights', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || ''}`
      },
      body: JSON.stringify({ vehicle, qualifiedLeads }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data?.matches ? data : { matches: [] };
  } catch (error) {
    console.error("OpenAI Match Error:", error);
    return { matches: [] };
  }
};

/**
 * Gera SEO + preço sugerido via IA.
 * IMPORTANTE: esta função LANÇA erro em caso de falha. Antes ela engolia a exceção e
 * devolvia campos vazios, o que fazia a tela mostrar "gerado com sucesso" sem ter
 * gerado nada (o clique em "Gerar com IA" parecia não fazer efeito). Não voltar a
 * silenciar o erro — quem chama precisa saber que falhou.
 */
export const generateSeoDetails = async (vehicle: Partial<Vehicle>): Promise<{ seoHeadline: string; seoDescription: string; suggestedSalePrice: number }> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  let response: Response;
  try {
    response = await fetch('/api/openai?action=generate-seo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ vehicle }),
    });
  } catch (networkErr) {
    console.error('OpenAI SEO — falha de rede:', networkErr);
    throw new Error('Não foi possível contatar o serviço de IA. Verifique sua conexão.');
  }

  if (!response.ok) {
    // Repassa a mensagem real do servidor (ex.: "OpenAI API key is not configured.")
    const detail = await response.json().catch(() => ({} as any));
    const serverMsg = detail?.error;
    console.error('OpenAI SEO — erro do servidor:', response.status, serverMsg);
    if (response.status === 401) throw new Error('Sessão expirada. Faça login novamente.');
    if (response.status === 500 && /api key/i.test(serverMsg || '')) {
      throw new Error('A chave da IA (OPENAI_API_KEY) não está configurada no servidor.');
    }
    throw new Error(serverMsg || `Falha ao gerar com IA (HTTP ${response.status}).`);
  }

  const data = await response.json();
  if (!data?.seoHeadline && !data?.seoDescription) {
    throw new Error('A IA não retornou conteúdo. Tente novamente.');
  }
  return data;
};

/**
 * Gera as descrições comerciais (curta e completa) do veículo via IA.
 * Assim como `generateSeoDetails`, LANÇA erro em caso de falha — nunca silenciar.
 */
export const generateVehicleDescriptions = async (
  vehicle: Partial<Vehicle>
): Promise<{ shortDescription: string; description: string }> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  let response: Response;
  try {
    response = await fetch('/api/openai?action=generate-descriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ vehicle }),
    });
  } catch (networkErr) {
    console.error('OpenAI descrições — falha de rede:', networkErr);
    throw new Error('Não foi possível contatar o serviço de IA. Verifique sua conexão.');
  }

  if (!response.ok) {
    const detail = await response.json().catch(() => ({} as any));
    const serverMsg = detail?.error;
    console.error('OpenAI descrições — erro do servidor:', response.status, serverMsg);
    if (response.status === 401) throw new Error('Sessão expirada. Faça login novamente.');
    if (response.status === 500 && /api key/i.test(serverMsg || '')) {
      throw new Error('A chave da IA (OPENAI_API_KEY) não está configurada no servidor.');
    }
    throw new Error(serverMsg || `Falha ao gerar descrições (HTTP ${response.status}).`);
  }

  const data = await response.json();
  if (!data?.shortDescription && !data?.description) {
    throw new Error('A IA não retornou conteúdo. Tente novamente.');
  }
  return data;
};
