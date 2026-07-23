import { applyCors, getVerifiedUserId } from '../_lib/cors';
import { generateJson, logAiUsage } from '../_lib/aiUsage';

// Do mais barato pro mais caro — só tenta o próximo se o anterior falhar
// (erro de API ou resposta que não é um JSON válido).
const MODEL_FALLBACK_CHAIN = ['gpt-5-nano', 'gpt-5-mini', 'gpt-5'];

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const userId = await getVerifiedUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const openaiApiKey = process.env.OPENAI_API_KEY;
  const openrouterApiKey = process.env.OPENROUTER_API_KEY;

  if (!openaiApiKey && !openrouterApiKey) {
    return res.status(500).json({ error: 'A chave da IA (OPENAI_API_KEY ou OPENROUTER_API_KEY) não está configurada no servidor.' });
  }

  try {
    const { vehicle } = req.body || {};

    if (!vehicle) {
      return res.status(400).json({ error: 'Missing required payload: vehicle.' });
    }

    const prompt = `Você é um assistente de vendas de veículos. Com base nos dados deste veículo:
Marca: ${vehicle.brand}
Modelo: ${vehicle.model}
Ano: ${vehicle.year}/${vehicle.modelYear || vehicle.year}
Combustível: ${vehicle.fuelType || ''}
Cor: ${vehicle.color || ''}
Preço de Compra: R$ ${vehicle.purchasePrice || 0}
Custos Operacionais: R$ ${JSON.stringify(vehicle.operationalCosts || [])}

Gere uma resposta em JSON com o seguinte formato exato (sem formatação extra ou markdown):
{
  "seoHeadline": "Headline de 40 a 60 caracteres otimizada para SEO",
  "seoDescription": "Meta descrição de 120 a 160 caracteres contendo chamada para ação comercial",
  "suggestedSalePrice": preco_sugerido_calculado_em_numero
}

Regra para o cálculo de preço de venda sugerido:
Soma o Preço de Compra + Todos os Custos Operacionais + Margem de Lucro recomendada (geralmente entre 15% e 25% sobre o custo total de aquisição).`;

    const { result: parsed, meta: aiMeta } = await generateJson(prompt, openaiApiKey, openrouterApiKey);
    await logAiUsage(userId, 'seo', aiMeta);
    return res.status(200).json(parsed);
  } catch (err: any) {
    console.error('Error generating AI SEO:', err);
    return res.status(500).json({ error: err.message });
  }
}
