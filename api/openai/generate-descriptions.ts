import { applyCors, getVerifiedUserId } from '../_lib/cors';
import { generateJson, logAiUsage } from '../_lib/aiUsage';

// Do mais barato pro mais caro — só tenta o próximo se o anterior falhar
// (erro de API ou resposta que não é um JSON válido).
const MODEL_FALLBACK_CHAIN = ['gpt-5-nano', 'gpt-5-mini', 'gpt-5'];

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed. Use POST.' });

  const userId = await getVerifiedUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

  const openaiApiKey = process.env.OPENAI_API_KEY;
  const openrouterApiKey = process.env.OPENROUTER_API_KEY;

  if (!openaiApiKey && !openrouterApiKey) {
    return res.status(500).json({ error: 'A chave da IA (OPENAI_API_KEY ou OPENROUTER_API_KEY) não está configurada no servidor.' });
  }

  try {
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
  } catch (err: any) {
    console.error('Error generating AI descriptions:', err);
    return res.status(500).json({ error: err.message });
  }
}
