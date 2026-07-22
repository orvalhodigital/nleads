import { supabase } from '../lib/supabaseClient';

/**
 * Gestão de notificações no Painel Admin: regras, modelos, histórico de
 * transmissões e o disparo em massa. Centraliza os `.from()` diretos que
 * estavam em AdminNotifications (A1). A lógica de negócio (substituição de
 * variáveis, montagem de destinatários) permanece na tela; aqui é só acesso a dados.
 */
export const notificationAdminService = {
    // --- notification_rules ---
    async listRules(): Promise<any[]> {
        const { data, error } = await supabase
            .from('notification_rules')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) return [];
        return data || [];
    },

    async createRule(payload: Record<string, any>): Promise<void> {
        const { error } = await supabase.from('notification_rules').insert(payload);
        if (error) throw error;
    },

    async updateRule(id: string, payload: Record<string, any>): Promise<void> {
        const { error } = await supabase.from('notification_rules').update(payload).eq('id', id);
        if (error) throw error;
    },

    async deleteRule(id: string): Promise<void> {
        const { error } = await supabase.from('notification_rules').delete().eq('id', id);
        if (error) throw error;
    },

    async seedRules(rules: Record<string, any>[]): Promise<void> {
        const { error } = await supabase.from('notification_rules').insert(rules);
        if (error) throw error;
    },

    // --- notification_templates ---
    async listTemplates(): Promise<any[]> {
        const { data, error } = await supabase
            .from('notification_templates')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) return [];
        return data || [];
    },

    async seedTemplates(templates: Record<string, any>[]): Promise<void> {
        const { error } = await supabase.from('notification_templates').insert(templates);
        if (error) throw error;
    },

    // --- broadcast_history ---
    async listBroadcasts(): Promise<any[]> {
        const { data, error } = await supabase
            .from('broadcast_history')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) return [];
        return data || [];
    },

    async deleteBroadcast(id: string): Promise<void> {
        const { error } = await supabase.from('broadcast_history').delete().eq('id', id);
        if (error) throw error;
    },

    /** Registra a transmissão no histórico, carimbando o admin autenticado. */
    async logBroadcast(record: { title: string; message: string; target_filter: string; sent_count: number }): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase.from('broadcast_history').insert({
            admin_id: user?.id,
            ...record,
        });
        if (error) throw error;
    },

    /** Insere as notificações da transmissão (fan-out). */
    async sendNotifications(rows: { user_id: string; title: string; message: string }[]): Promise<void> {
        const { error } = await supabase.from('notifications').insert(rows);
        if (error) throw error;
    },
};
