
import { supabase } from '../lib/supabaseClient';

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
        const { error } = await supabase.from('notifications').insert(notification);
        if (error) throw error;
    },

    async getUnread(userId?: string): Promise<Notification[]> {
        // If userId is provided (impersonation), use it. Current user otherwise.
        // Actually, RLS handles "own" notifications. so userId param might just be for the query to be explicit
        // But for impersonation, the RLS might need to be "own OR admin".
        // Let's assume the auth context handles it or we pass the ID.
        // Given previous edits, we have "Users can see own notifications".
        // The service should probably rely on auth.uid() mostly, but if we are impersonating, we might need to handle that.
        // However, the Header is in UserApp, which might be running under impersonation.
        // If running under impersonation, `supabase.auth.user()` is still the ADMIN.
        // So RLS "auth.uid() = user_id" will fail for the impersonated user's data unless we have an admin policy.
        // We added "Admins can view all notifications" policy in admin_migration.sql (and fixed recursion later).
        // So simply querying by user_id should work if we are admin.

        // Wait, current Auth context for UserApp is:
        // 1. Regular User -> Sees own.
        // 2. Admin impersonating -> Sees "target user's" data.
        // We need to pass the target user ID if impersonating. 
        // UserApp.tsx has `impersonatedUserId`. Header.tsx inside UserApp needs access to this prop?
        // Header is rendered in UserApp. let's check UserApp.tsx again if needed.
        // For now, I'll allow an optional userId.

        let query = supabase
            .from('notifications')
            .select('*')
            .eq('read', false)
            .order('created_at', { ascending: false });

        if (userId) {
            query = query.eq('user_id', userId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
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

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },

    async markAsRead(id: string) {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', id);
        if (error) throw error;
    },

    async markAllAsRead(userId?: string) {
        let query = supabase.from('notifications').update({ read: true }).eq('read', false);
        if (userId) {
            query = query.eq('user_id', userId);
        } else {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) query = query.eq('user_id', user.id);
        }
        const { error } = await query;
        if (error) throw error;
    },

    async notifyLeadPhaseChange(leadName: string, oldPhase: string, newPhase: string, userId?: string) {
        let targetId = userId;
        if (!targetId) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) targetId = user.id;
        }
        if (!targetId) return;

        const { error } = await supabase
            .from('notifications')
            .insert({
                user_id: targetId,
                title: 'Mudança de Fase',
                message: `O lead "${leadName}" foi movido de "${oldPhase}" para "${newPhase}".`,
                read: false
            });
        if (error) console.error("Erro ao enviar notificação de fase", error);
    }
};
