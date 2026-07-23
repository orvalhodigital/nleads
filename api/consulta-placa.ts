import { applyCors, getVerifiedUserId } from './_lib/cors';

/**
 * Proxy seguro para a API de consulta de placas (wdapi2.com.br).
 *
 * Antes, o token da API (APIPLACAS_TOKEN) estava HARDCODED em 4 componentes do
 * frontend (VehicleForm.tsx, LeadForm.tsx, MotorcycleInventory.tsx,
 * InventoryImportModal.tsx) e a chamada era feita direto do navegador —
 * qualquer pessoa podia abrir o DevTools/inspecionar o bundle JS, copiar o
 * token e consumir a cota paga da conta sem autorização. Agora o token fica
 * só aqui (variável de ambiente do servidor) e o frontend chama este proxy
 * autenticado no lugar da API externa.
 */
export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed. Use POST.' });

  const userId = await getVerifiedUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

  const apiToken = process.env.APIPLACAS_TOKEN;
  if (!apiToken) {
    return res.status(500).json({ error: 'APIPLACAS_TOKEN não configurado no servidor.' });
  }

  try {
    const { plate } = req.body || {};
    const cleanPlate = String(plate || '').replace(/[-\s]/g, '').toUpperCase();
    if (cleanPlate.length < 7) {
      return res.status(400).json({ error: 'Placa inválida.' });
    }

    const response = await fetch(`https://wdapi2.com.br/consulta/${cleanPlate}/${apiToken}`);
    const data = await response.json();

    // Repassa o corpo cru (mesmo formato que os componentes já sabem parsear),
    // apenas trocando o status quando a API externa falhar.
    return res.status(response.ok ? 200 : response.status).json(data);
  } catch (err: any) {
    console.error('Erro ao consultar placa:', err);
    return res.status(500).json({ error: 'Erro ao consultar a placa.' });
  }
}
