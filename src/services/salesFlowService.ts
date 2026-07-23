import { supabase, handleSupabaseResponse } from '../lib/supabaseClient';
import { Lead, SalePhase } from '../types';
import { addDays, parseISO, format } from 'date-fns';

export const salesFlowService = {
  // Criar entry de fluxo de vendas quando lead se torna COMPLETED
  async initiateSaleFlow(leadId: string, saleDate: string = new Date().toISOString()): Promise<void> {
    const response = await supabase
      .from('leads')
      .update({
        sale_status: 'documentacao',
        sale_date: saleDate,
      })
      .eq('id', leadId);

    handleSupabaseResponse(response);
  },

  // Mover lead para próxima fase do fluxo
  async moveToNextPhase(leadId: string, nextPhase: SalePhase, deliveryDate?: string, guaranteeId?: string, guaranteeEndsAt?: string): Promise<void> {
    const response = await supabase
      .from('leads')
      .update({
        sale_status: nextPhase,
        ...(deliveryDate && { delivery_date: deliveryDate }),
        ...(guaranteeId && { guarantee_id: guaranteeId }),
        ...(guaranteeEndsAt && { guarantee_ends_at: guaranteeEndsAt }),
      })
      .eq('id', leadId);

    handleSupabaseResponse(response);
  },

  // Calcular data final de garantia
  calculateGuaranteeEndDate(saleDate: string, daysWarranty: number): string {
    const date = typeof saleDate === 'string' ? parseISO(saleDate) : saleDate;
    const endDate = addDays(date, daysWarranty);
    return endDate.toISOString();
  },

  // Buscar todos os leads em fluxo de venda (COMPLETED mas não finalizados)
  async getActiveSales(userId: string): Promise<Lead[]> {
    const response = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', userId)
      .eq('phase', 'Compradores') // COMPLETED phase
      .not('sale_status', 'is', null)
      .order('sale_date', { ascending: false });

    return (handleSupabaseResponse(response) || []) as Lead[];
  },

  // Buscar leads por fase específica
  async getLeadsByPhase(userId: string, salePhase: SalePhase): Promise<Lead[]> {
    const response = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', userId)
      .eq('sale_status', salePhase)
      .order('sale_date', { ascending: false });

    return (handleSupabaseResponse(response) || []) as Lead[];
  },

  // Buscar leads em período ativo de garantia
  async getLeadsInWarranty(userId: string): Promise<Lead[]> {
    const now = new Date().toISOString();
    const response = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', userId)
      .eq('sale_status', 'em_garantia')
      .gt('guarantee_ends_at', now)
      .order('guarantee_ends_at', { ascending: true });

    return (handleSupabaseResponse(response) || []) as Lead[];
  },

  // Buscar leads com garantia prestes a vencer
  async getLeadsExpiringWarranty(userId: string, daysWarning: number = 7): Promise<Lead[]> {
    const now = new Date();
    const warningDate = addDays(now, daysWarning);

    const response = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', userId)
      .eq('sale_status', 'em_garantia')
      .gte('guarantee_ends_at', now.toISOString())
      .lte('guarantee_ends_at', warningDate.toISOString())
      .order('guarantee_ends_at', { ascending: true });

    return (handleSupabaseResponse(response) || []) as Lead[];
  },

  // Buscar leads com garantia expirada
  async getLeadsExpiredWarranty(userId: string): Promise<Lead[]> {
    const now = new Date().toISOString();
    const response = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', userId)
      .eq('sale_status', 'em_garantia')
      .lt('guarantee_ends_at', now)
      .order('guarantee_ends_at', { ascending: true });

    return (handleSupabaseResponse(response) || []) as Lead[];
  },

  // Adicionar notas de pós-venda
  async updatePostSaleNotes(leadId: string, notes: string): Promise<void> {
    const response = await supabase
      .from('leads')
      .update({ post_sale_notes: notes })
      .eq('id', leadId);

    handleSupabaseResponse(response);
  },

  // Estatísticas do fluxo de vendas
  async getSalesFlowMetrics(userId: string) {
    const [documentacao, entrega, emGarantia, aposGarantia] = await Promise.all([
      this.getLeadsByPhase(userId, 'documentacao'),
      this.getLeadsByPhase(userId, 'entrega'),
      this.getLeadsInWarranty(userId),
      this.getLeadsByPhase(userId, 'apos_garantia'),
    ]);

    const expiringWarranty = await this.getLeadsExpiringWarranty(userId, 7);

    return {
      documentacao: documentacao.length,
      entrega: entrega.length,
      emGarantia: emGarantia.length,
      aposGarantia: aposGarantia.length,
      expiringWarranty: expiringWarranty.length,
      total: documentacao.length + entrega.length + emGarantia.length + aposGarantia.length,
    };
  },
};
