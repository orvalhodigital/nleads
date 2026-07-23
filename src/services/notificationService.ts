
import { supabase, handleSupabaseResponse } from '../lib/supabaseClient';

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    read: boolean;
    created_at: string;
}

export const notificationService = {
    // Cria uma notificação para um usuário (ex.: admin enviando aviso pontual).
    async create(notification: { user_id: string; title: string; message: string }): Promise<void> {
        handleSupabaseResponse(await supabase.from('notifications').insert(notification));
    },

    async getUnread(userId?: string): Promise<Notification[]> {
        let query = supabase
            .from('notifications')
            .select('*')
            .eq('read', false)
            .order('created_at', { ascending: false });

        if (userId) {
            query = query.eq('user_id', userId);
        }

        const response = await query;
        return (handleSupabaseResponse(response) || []) as Notification[];
    },

    async getHistory(userId?: string): Promise<Notification[]> {
        let query = supabase
            .from('notifications')
            .select('*')
            .eq('read', true)
            .order('created_at', { ascending: false })
            .limit(50); // Limit history

        if (userId) {
            query = query.eq('user_id', userId);
        }

        const response = await query;
        return (handleSupabaseResponse(response) || []) as Notification[];
    },

    async markAsRead(id: string) {
        handleSupabaseResponse(await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', id));
    },

    async markAllAsRead(userId?: string) {
        let query = supabase.from('notifications').update({ read: true }).eq('read', false);
        if (userId) {
            query = query.eq('user_id', userId);
        } else {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) query = query.eq('user_id', user.id);
        }
        handleSupabaseResponse(await query);
    },

    async notifyLeadPhaseChange(leadName: string, oldPhase: string, newPhase: string, userId?: string) {
        let targetId = userId;
        if (!targetId) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) targetId = user.id;
        }
        if (!targetId) return;

        const response = await supabase
            .from('notifications')
            .insert({
                user_id: targetId,
                title: 'Mudança de Fase',
                message: `O lead "${leadName}" foi movido de "${oldPhase}" para "${newPhase}".`,
                read: false
            });
        handleSupabaseResponse(response);
    }
};
