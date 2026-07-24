import { applyCors, getVerifiedUserId } from './_lib/cors';
import { generateJson, logAiUsage } from './_lib/aiUsage';

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

  const action = req.query?.action || req.body?.action || 'descriptions';

  try {
    // 1. Geração de Descrições
    if (action === 'generate-descriptions' || action === 'descriptions') {
      const { vehicle } = req.body || {};
      if (!vehicle) return res.status(400).json({ error: 'Missing required payload: vehicle.' });

      const opcionais = Array.isArray(vehicle.optionals) ? vehicle.optionals.join(', ') : '';
      const condicoes = [
        vehicle.isSingleOwner ? 'único dono' : '',
        vehicle.isServiceHistoryComplete ? 'revisões em dia' : '',
        vehicle.isIpvaPaid ? 'IPVA pago' : '',
        vehicle.hasWarranty ? 'com garantia' : '',
        vehicle.hasSpareKey ? 'chave reserva' : '',
        vehicle.hasOwnerManual ? 'manual do proprietário' : '',
      ].filter(Boolean).join(', ');

      const prompt = `Você é um redator especialista em anúncios de veículos seminovos no Brasil.
Escreva em português do Brasil, tom comercial, honesto e direto. NÃO invente informação
que não esteja nos dados abaixo (não invente quilometragem, opcionais nem estado de conservação).

Dados do veículo:
Marca: ${vehicle.brand || ''}
Modelo: ${vehicle.model || ''}
Ano: ${vehicle.year || ''}/${vehicle.modelYear || vehicle.year || ''}
Cor: ${vehicle.color || ''}
Quilometragem: ${vehicle.mileage ?? ''} km
Câmbio: ${vehicle.transmission || ''}
Motor: ${vehicle.engine || ''}
Combustível: ${vehicle.fuelType || ''}
Condições: ${condicoes || 'não informadas'}
Opcionais: ${opcionais || 'não informados'}

Responda APENAS com JSON válido, sem markdown, exatamente neste formato:
{
  "shortDescription": "uma frase de até 120 caracteres, chamativa, para listagem",
  "description": "descrição completa de 3 a 5 frases (400 a 700 caracteres) destacando os pontos fortes reais e terminando com um convite para agendar visita ou test drive"
}`;

      const { result: parsed, meta: aiMeta } = await generateJson(prompt, openaiApiKey, openrouterApiKey);
      await logAiUsage(userId, 'descriptions', aiMeta);
      return res.status(200).json({
        shortDescription: parsed.shortDescription || '',
        description: parsed.description || '',
      });
    }

    // 2. Geração de SEO & Preço Sugerido
    if (action === 'generate-seo' || action === 'seo') {
      const { vehicle } = req.body || {};
      if (!vehicle) return res.status(400).json({ error: 'Missing required payload: vehicle.' });

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
    }

    // 3. Insights de Matching
    if (action === 'matching-insights' || action === 'matching') {
      const { vehicle, qualifiedLeads } = req.body || {};
      if (!vehicle || !Array.isArray(qualifiedLeads)) {
        return res.status(400).json({ error: 'Missing required payload: vehicle and qualifiedLeads.' });
      }

      const prompt = `Analise o novo veículo em estoque: ${JSON.stringify(vehicle)}
E os seguintes leads qualificados: ${JSON.stringify(qualifiedLeads)}

Gere um resumo curto explicando por que esses leads combinam com esse carro e uma sugestão de mensagem personalizada para enviar a eles via WhatsApp.

Responda APENAS com JSON válido, sem markdown, exatamente neste formato:
{
  "matches": [
    { "leadId": "id do lead (string)", "reason": "por que esse lead combina com o veículo", "whatsappPitch": "mensagem pronta para enviar via WhatsApp" }
  ]
}
Se nenhum lead combinar bem, responda {"matches": []}.`;

      const { result: parsed, meta: aiMeta } = await generateJson(prompt, openaiApiKey, openrouterApiKey);
      await logAiUsage(userId, 'matching-insights', aiMeta);
      if (!Array.isArray(parsed?.matches)) {
        return res.status(200).json({ matches: [] });
      }
      return res.status(200).json(parsed);
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });

  } catch (err: any) {
    console.error('Error in OpenAI endpoint:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
