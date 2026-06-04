import { useCallback } from 'react';
import { salesFlowService } from '../services/salesFlowService';
import { Lead, LeadPhase } from '../types';

/**
 * Hook que sincroniza automaticamente quando um lead passa para COMPLETED
 * Cria entry no fluxo de vendas (sale_status = 'documentacao')
 */
export function useSalesFlowSync() {
  const syncLeadToSalesFlow = useCallback(async (lead: Lead) => {
    try {
      // Se lead virou COMPLETED e ainda não tem sale_status, iniciar fluxo
      if (lead.phase === LeadPhase.COMPLETED && !lead.saleStatus) {
        await salesFlowService.initiateSaleFlow(lead.id);
      }
    } catch (error) {
      console.error('Erro ao sincronizar lead para fluxo de vendas:', error);
      // Não lança erro — permite que lead seja atualizado mesmo se sync falhar
      // (admin pode manualmente mover para fluxo depois via SalesFlowPage)
    }
  }, []);

  return { syncLeadToSalesFlow };
}
