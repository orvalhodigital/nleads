// Módulo compartilhado das funções api/openai/*.
// Concentra a chamada de IA (OpenAI com fallback OpenRouter) e o registro de
// consumo em ai_usage_events. Antes, cada uma das 3 funções tinha uma cópia
// idêntica de generateJson que descartava tokens e modelo.

import { createClient } from '@supabase/supabase-js';

const OPENAI_MODEL_FALLBACK_CHAIN = ['gpt-4o-mini', 'gpt-4o'];
const OPENROUTER_MODEL_FALLBACK_CHAIN = [
  'openai/gpt-4o-mini',
  'google/gemini-2.0-flash-001',
  'meta-llama/llama-3.1-8b-instruct',
];

export interface AiMeta {
  provider: 'openai' | 'openrouter';
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AiResult {
  result: any;
  meta: AiMeta;
}

const COST_PER_1K_USD: Record<string, number> = {
  'gpt-4o-mini': 0.00015,
  'gpt-4o': 0.0025,
  'openai/gpt-4o-mini': 0.00015,
  'google/gemini-2.0-flash-001': 0.0001,
  'meta-llama/llama-3.1-8b-instruct': 0.0001,
};

export function estimateCostUsd(model: string, totalTokens: number): number {
  const rate = COST_PER_1K_USD[model] ?? 0.0006; // default conservador
  return Number(((totalTokens / 1000) * rate).toFixed(6));
}

function extractUsage(data: any): { prompt: number; completion: number; total: number } {
  const u = data?.usage || {};
  const prompt = Number(u.prompt_tokens ?? 0);
  const completion = Number(u.completion_tokens ?? 0);
  const total = Number(u.total_tokens ?? prompt + completion);
  return { prompt, completion, total };
}

/**
 * Chama a IA e devolve o JSON parseado + metadados de consumo (provider, modelo,
 * tokens). Tenta OpenAI (do modelo mais barato ao mais caro) e cai para
 * OpenRouter se a OpenAI falhar ou não estiver configurada.
 */
export async function generateJson(
  prompt: string,
  openaiApiKey?: string,
  openrouterApiKey?: string,
): Promise<AiResult> {
  let lastError: any = null;

  if (openaiApiKey) {
    for (const model of OPENAI_MODEL_FALLBACK_CHAIN) {
      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${openaiApiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } }),
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) { lastError = new Error(`OpenAI (${model}) HTTP ${res.status} — ${await res.text()}`); continue; }
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) { lastError = new Error(`OpenAI (${model}) resposta vazia.`); continue; }
        const usage = extractUsage(data);
        return {
          result: JSON.parse(content),
          meta: { provider: 'openai', model, promptTokens: usage.prompt, completionTokens: usage.completion, totalTokens: usage.total },
        };
      } catch (err: any) { lastError = err; continue; }
    }
  }

  if (openrouterApiKey) {
    for (const model of OPENROUTER_MODEL_FALLBACK_CHAIN) {
      try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${openrouterApiKey}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://orvalhodigital.com.br' },
          body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } }),
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) { lastError = new Error(`OpenRouter (${model}) HTTP ${res.status} — ${await res.text()}`); continue; }
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) { lastError = new Error(`OpenRouter (${model}) resposta vazia.`); continue; }
        const usage = extractUsage(data);
        return {
          result: JSON.parse(content),
          meta: { provider: 'openrouter', model, promptTokens: usage.prompt, completionTokens: usage.completion, totalTokens: usage.total },
        };
      } catch (err: any) { lastError = err; continue; }
    }
  }

  throw lastError || new Error('Nenhum provedor de IA configurado.');
}

/**
 * Registra o consumo em ai_usage_events. Best-effort: falha aqui NUNCA quebra a
 * resposta ao usuário (o recurso de IA é o que importa; o log é secundário).
 * Usa service_role, então ignora RLS.
 */
export async function logAiUsage(
  userId: string | null,
  feature: string,
  meta: AiMeta,
): Promise<void> {
  try {
    const url = process.env.VITE_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey || !userId) return;

    const admin = createClient(url, serviceKey);
    // Resolve o dono da loja para agregação por lojista.
    const { data: prof } = await admin
      .from('profiles')
      .select('role, parent_id')
      .eq('id', userId)
      .single();
    const adminId = prof?.role === 'vendedor' ? prof?.parent_id ?? userId : userId;

    await admin.from('ai_usage_events').insert({
      user_id: userId,
      admin_id: adminId,
      feature,
      provider: meta.provider,
      model: meta.model,
      prompt_tokens: meta.promptTokens,
      completion_tokens: meta.completionTokens,
      total_tokens: meta.totalTokens,
      estimated_cost_usd: estimateCostUsd(meta.model, meta.totalTokens),
    });
  } catch (err) {
    console.error('[aiUsage] falha ao registrar consumo (ignorado):', err);
  }
}
