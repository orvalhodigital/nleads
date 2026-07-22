import { supabase } from '../lib/supabaseClient';

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
        const { data, error } = await supabase
            .from('motivation_quotes')
            .select('*')
            .order('created_at', { ascending: false });
        // 42P01 = tabela ainda não existe → trata como lista vazia (sem erro),
        // preservando o comportamento original da tela.
        if (error) {
            if (error.code === '42P01') return [];
            throw error;
        }
        return (data as MotivationQuote[]) || [];
    },

    // Frases ativas (para sortear uma no dashboard do lojista).
    async getActive(): Promise<{ quote: string; author: string | null }[]> {
        const { data } = await supabase
            .from('motivation_quotes')
            .select('quote, author')
            .eq('is_active', true);
        return data || [];
    },

    async create(input: { quote: string; author: string; is_active?: boolean }): Promise<void> {
        const { error } = await supabase.from('motivation_quotes').insert([{
            quote: input.quote,
            author: input.author,
            is_active: input.is_active ?? true,
        }]);
        if (error) throw error;
    },

    async update(id: string, input: { quote: string; author: string; is_active: boolean }): Promise<void> {
        const { error } = await supabase.from('motivation_quotes').update({
            quote: input.quote,
            author: input.author,
            is_active: input.is_active,
        }).eq('id', id);
        if (error) throw error;
    },

    async setActive(id: string, isActive: boolean): Promise<void> {
        const { error } = await supabase.from('motivation_quotes')
            .update({ is_active: isActive })
            .eq('id', id);
        if (error) throw error;
    },

    async remove(id: string): Promise<void> {
        const { error } = await supabase.from('motivation_quotes').delete().eq('id', id);
        if (error) throw error;
    },
};
