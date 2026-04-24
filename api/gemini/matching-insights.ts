import { GoogleGenAI, Type } from '@google/genai';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Gemini API key is not configured.' });
  }

  try {
    const { vehicle, qualifiedLeads } = req.body || {};

    if (!vehicle || !Array.isArray(qualifiedLeads)) {
      return res.status(400).json({ error: 'Missing required payload: vehicle and qualifiedLeads.' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Analise o novo veículo em estoque: ${JSON.stringify(vehicle)}
      E os seguintes leads qualificados: ${JSON.stringify(qualifiedLeads)}

      Gere um resumo curto explicando por que esses leads combinam com esse carro e uma sugestão de mensagem personalizada para enviar a eles via WhatsApp.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matches: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  leadId: { type: Type.STRING },
                  reason: { type: Type.STRING },
                  whatsappPitch: { type: Type.STRING },
                },
                required: ['leadId', 'reason', 'whatsappPitch'],
              },
            },
          },
        },
      },
    });

    const jsonStr = response.text?.trim() || '{"matches":[]}';
    return res.status(200).json(JSON.parse(jsonStr));
  } catch (error: any) {
    console.error('Gemini Match API Error:', error);
    return res.status(500).json({
      error: 'Failed to generate matching insights.',
      details: error?.message || 'Unknown error',
    });
  }
}
