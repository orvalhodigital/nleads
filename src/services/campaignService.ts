import { supabase } from '../lib/supabaseClient';

/**
 * Acesso à tabela `campaigns` (campanhas promocionais de plano).
 * Centraliza os `.from('campaigns')` diretos (A1).
 */
export const campaignService = {
    async list(): Promise<any[]> {
        const { data, error } = await supabase
            .from('campaigns')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) return [];
        return data || [];
    },

    // Campanhas vigentes agora (ativas e dentro da janela de datas).
    async listActive(): Promise<any[]> {
        const now = new Date().toISOString();
        const { data, error } = await supabase
            .from('campaigns')
            .select('*')
            .eq('is_active', true)
            .lte('start_date', now)
            .gte('end_date', now);
        if (error) return [];
        return data || [];
    },

    async create(payload: Record<string, any>): Promise<void> {
        const { error } = await supabase.from('campaigns').insert(payload);
        if (error) throw error;
    },

    async update(id: string, payload: Record<string, any>): Promise<void> {
        const { error } = await supabase.from('campaigns').update(payload).eq('id', id);
        if (error) throw error;
    },

    async remove(id: string): Promise<void> {
        const { error } = await supabase.from('campaigns').delete().eq('id', id);
        if (error) throw error;
    },
};
