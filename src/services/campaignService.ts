import { supabase, handleSupabaseResponse } from '../lib/supabaseClient';

/**
 * Acesso à tabela `campaigns` (campanhas promocionais de plano).
 * Centraliza os `.from('campaigns')` diretos (A1).
 */
export const campaignService = {
    async list(): Promise<any[]> {
        const response = await supabase
            .from('campaigns')
            .select('*')
            .order('created_at', { ascending: false });
        if (response.error && response.error.code === '42P01') return [];
        return handleSupabaseResponse(response) || [];
    },

    // Campanhas vigentes agora (ativas e dentro da janela de datas).
    async listActive(): Promise<any[]> {
        const now = new Date().toISOString();
        const response = await supabase
            .from('campaigns')
            .select('*')
            .eq('is_active', true)
            .lte('start_date', now)
            .gte('end_date', now);
        if (response.error && response.error.code === '42P01') return [];
        return handleSupabaseResponse(response) || [];
    },

    async create(payload: Record<string, any>): Promise<void> {
        handleSupabaseResponse(await supabase.from('campaigns').insert(payload));
    },

    async update(id: string, payload: Record<string, any>): Promise<void> {
        handleSupabaseResponse(await supabase.from('campaigns').update(payload).eq('id', id));
    },

    async remove(id: string): Promise<void> {
        handleSupabaseResponse(await supabase.from('campaigns').delete().eq('id', id));
    },
};
