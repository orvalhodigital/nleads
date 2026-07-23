import { supabase, handleSupabaseResponse } from '../lib/supabaseClient';

export interface MotivationQuote {
    id: string;
    quote: string;
    author: string | null;
    is_active: boolean;
    created_at: string;
}

/**
 * Acesso à tabela `motivation_quotes` (frases motivacionais do admin).
 * Centraliza o que estava espalhado em AdminQuotes como `.from()` direto (A1).
 */
export const quoteService = {
    async list(): Promise<MotivationQuote[]> {
        const response = await supabase
            .from('motivation_quotes')
            .select('*')
            .order('created_at', { ascending: false });
        if (response.error && response.error.code === '42P01') return [];
        return (handleSupabaseResponse(response) as MotivationQuote[]) || [];
    },

    // Frases ativas (para sortear uma no dashboard do lojista).
    async getActive(): Promise<{ quote: string; author: string | null }[]> {
        const response = await supabase
            .from('motivation_quotes')
            .select('quote, author')
            .eq('is_active', true);
        return handleSupabaseResponse(response) || [];
    },

    async create(input: { quote: string; author: string; is_active?: boolean }): Promise<void> {
        handleSupabaseResponse(await supabase.from('motivation_quotes').insert([{
            quote: input.quote,
            author: input.author,
            is_active: input.is_active ?? true,
        }]));
    },

    async update(id: string, input: { quote: string; author: string; is_active: boolean }): Promise<void> {
        handleSupabaseResponse(await supabase.from('motivation_quotes').update({
            quote: input.quote,
            author: input.author,
            is_active: input.is_active,
        }).eq('id', id));
    },

    async setActive(id: string, isActive: boolean): Promise<void> {
        handleSupabaseResponse(await supabase.from('motivation_quotes')
            .update({ is_active: isActive })
            .eq('id', id));
    },

    async remove(id: string): Promise<void> {
        handleSupabaseResponse(await supabase.from('motivation_quotes').delete().eq('id', id));
    },
};
