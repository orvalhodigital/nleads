import { supabase } from '../lib/supabaseClient';
import { GuaranteeConfig } from '../types';

export const guaranteeService = {
  // Buscar todas as configs de garantia ativas de um usuário
  async getGuaranteeConfigs(userId: string): Promise<GuaranteeConfig[]> {
    const { data, error } = await supabase
      .from('guarantee_configs')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('type', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Buscar uma config específica
  async getGuaranteeConfig(id: string): Promise<GuaranteeConfig | null> {
    const { data, error } = await supabase
      .from('guarantee_configs')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data || null;
  },

  // Criar nova config de garantia
  async createGuaranteeConfig(userId: string, config: Omit<GuaranteeConfig, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<GuaranteeConfig> {
    const { data, error } = await supabase
      .from('guarantee_configs')
      .insert([
        {
          user_id: userId,
          type: config.type,
          name: config.name,
          days_warranty: config.days_warranty,
          description: config.description || null,
          conditions: config.conditions || null,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Atualizar config existente
  async updateGuaranteeConfig(id: string, updates: Partial<GuaranteeConfig>): Promise<GuaranteeConfig> {
    const { data, error } = await supabase
      .from('guarantee_configs')
      .update({
        ...(updates.name && { name: updates.name }),
        ...(updates.days_warranty && { days_warranty: updates.days_warranty }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.conditions !== undefined && { conditions: updates.conditions }),
        ...(updates.is_active !== undefined && { is_active: updates.is_active }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Deletar config (soft delete — apenas desativar)
  async deleteGuaranteeConfig(id: string): Promise<void> {
    const { error } = await supabase
      .from('guarantee_configs')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  },

  // Helper: obter configs pré-definidas (termos legais)
  getPredefinedConfigs(): Partial<GuaranteeConfig>[] {
    return [
      {
        type: '7dias',
        name: '7 Dias - Direito de Arrependimento',
        days_warranty: 7,
        description: 'Período legal para devolução sem justificativa (Lei nº 8.078/1990).',
        conditions: {
          refundPolicy: 'Reembolso integral',
          returnDays: 7,
          notes: 'Veículo deve estar em bom estado de conservação',
        },
      },
      {
        type: '90dias',
        name: '90 Dias - Garantia Legal',
        days_warranty: 90,
        description: 'Garantia de 90 dias contra vícios e defeitos ocultos (garantia legal).',
        conditions: {
          refundPolicy: 'Reparo ou substituição do veículo',
          returnDays: 90,
          notes: 'Cobre defeitos não aparentes no momento da compra',
        },
      },
      {
        type: '180dias',
        name: '180 Dias - Garantia Estendida',
        days_warranty: 180,
        description: 'Cobertura estendida de 180 dias para máxima tranquilidade.',
        conditions: {
          refundPolicy: 'Reparo coberto pela loja',
          returnDays: 180,
          notes: 'Manutenção preventiva a critério da loja',
        },
      },
      {
        type: '1ano',
        name: '1 Ano - Garantia Premium',
        days_warranty: 365,
        description: 'Cobertura completa por 1 ano com assistência técnica prioritária.',
        conditions: {
          refundPolicy: 'Reparo e manutenção menores cobertos',
          returnDays: 365,
          notes: 'Suporte direto com gerente da loja',
        },
      },
    ];
  },
};
