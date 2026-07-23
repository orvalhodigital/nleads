import { supabase, handleSupabaseResponse } from '../lib/supabaseClient';

/**
 * Gestão de notificações no Painel Admin: regras, modelos, histórico de
 * transmissões e o disparo em massa. Centraliza os `.from()` diretos que
 * estavam em AdminNotifications (A1). A lógica de negócio (substituição de
 * variáveis, montagem de destinatários) permanece na tela; aqui é só acesso a dados.
 */
export const notificationAdminService = {
    // --- notification_rules ---
    async listRules(): Promise<any[]> {
        const response = await supabase
            .from('notification_rules')
            .select('*')
            .order('created_at', { ascending: false });
        if (response.error && response.error.code === '42P01') return [];
        return handleSupabaseResponse(response) || [];
    },

    async createRule(payload: Record<string, any>): Promise<void> {
        handleSupabaseResponse(await supabase.from('notification_rules').insert(payload));
    },

    async updateRule(id: string, payload: Record<string, any>): Promise<void> {
        handleSupabaseResponse(await supabase.from('notification_rules').update(payload).eq('id', id));
    },

    async deleteRule(id: string): Promise<void> {
        handleSupabaseResponse(await supabase.from('notification_rules').delete().eq('id', id));
    },

    async seedRules(rules: Record<string, any>[]): Promise<void> {
        handleSupabaseResponse(await supabase.from('notification_rules').insert(rules));
    },

    // --- notification_templates ---
    async listTemplates(): Promise<any[]> {
        const response = await supabase
            .from('notification_templates')
            .select('*')
            .order('created_at', { ascending: false });
        if (response.error && response.error.code === '42P01') return [];
        return handleSupabaseResponse(response) || [];
    },

    async seedTemplates(templates: Record<string, any>[]): Promise<void> {
        handleSupabaseResponse(await supabase.from('notification_templates').insert(templates));
    },

    // --- broadcast_history ---
    async listBroadcasts(): Promise<any[]> {
        const response = await supabase
            .from('broadcast_history')
            .select('*')
            .order('created_at', { ascending: false });
        if (response.error && response.error.code === '42P01') return [];
        return handleSupabaseResponse(response) || [];
    },

    async deleteBroadcast(id: string): Promise<void> {
        handleSupabaseResponse(await supabase.from('broadcast_history').delete().eq('id', id));
    },

    /** Registra a transmissão no histórico, carimbando o admin autenticado. */
    async logBroadcast(record: { title: string; message: string; target_filter: string; sent_count: number }): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        handleSupabaseResponse(await supabase.from('broadcast_history').insert({
            admin_id: user?.id,
            ...record,
        }));
    },

    /** Insere as notificações da transmissão (fan-out). */
    async sendNotifications(rows: { user_id: string; title: string; message: string }[]): Promise<void> {
        handleSupabaseResponse(await supabase.from('notifications').insert(rows));
    },
};
