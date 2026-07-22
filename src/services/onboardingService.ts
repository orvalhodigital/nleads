import { supabase } from '../lib/supabaseClient';

/**
 * Acesso à tabela `onboarding_sessions` (acompanhamento de onboarding no admin).
 * Centraliza os `.from()` diretos que estavam em AdminOnboarding (A1).
 */
export const onboardingService = {
    async getSessions(): Promise<any[]> {
        const { data, error } = await supabase.from('onboarding_sessions').select('*');
        // A tabela pode não existir ainda / dar erro → trata como vazio, como a tela fazia.
        if (error) return [];
        return data || [];
    },

    /**
     * Insere (se ainda não há `sessionId`) ou atualiza (por id) a sessão e devolve
     * o id resultante. Espelha o padrão repetido de toggleStep/updateDate/updateNotes.
     * No insert não carimba `updated_at` (a linha é nova); no update sim.
     */
    async saveField(sessionId: string | null | undefined, userId: string, patch: Record<string, any>): Promise<string> {
        if (!sessionId) {
            const { data, error } = await supabase
                .from('onboarding_sessions')
                .insert({ user_id: userId, ...patch })
                .select()
                .single();
            if (error) throw error;
            return data.id;
        }
        const { error } = await supabase
            .from('onboarding_sessions')
            .update({ ...patch, updated_at: new Date().toISOString() })
            .eq('id', sessionId);
        if (error) throw error;
        return sessionId;
    },

    /** Update direto por id, sem carimbar updated_at (ex.: sugestão de review 30d). */
    async updateById(sessionId: string, patch: Record<string, any>): Promise<void> {
        const { error } = await supabase.from('onboarding_sessions').update(patch).eq('id', sessionId);
        if (error) throw error;
    },
};
