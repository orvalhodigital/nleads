import { supabase } from '../lib/supabaseClient';
import { Profile } from '../types';
import { DEFAULT_PRESET_MESSAGES } from '../utils/constants';

export const profileService = {
    async getProfile(userId?: string): Promise<Profile | null> {
        const { data: { user } } = await supabase.auth.getUser();
        const targetUserId = userId || user?.id;

        if (!targetUserId) return null;

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', targetUserId)
            .single();

        if (error && error.code !== 'PGRST116') {
            const isRLSError = error.code === '42501';
            console.error('Error fetching profile:', isRLSError ? 'RLS Permission Denied' : error);
            // Even on error, return basic auth info to allow UI to function partialy
        }

        if (data) {
            return {
                id: data.id,
                email: data.email,
                full_name: data.full_name || user?.user_metadata?.full_name || '',
                plan: data.plan || 'trial',
                planStatus: (data.trial_ends_at && new Date() > new Date(data.trial_ends_at)) ? 'expired' : data.plan_status || 'active',
                trialEndsAt: data.trial_ends_at,
                created_at: data.created_at,
                webhook_url: data.webhook_url,
                avatar_url: user?.user_metadata?.avatar_url || data.avatar_url || '',
                company_name: data.company_name || user?.user_metadata?.company_name || '',
                company_logo: user?.user_metadata?.company_logo || data.company_logo || '',
                monthly_sales_goal: data.monthly_sales_goal,
                enable_cars: user?.user_metadata?.enable_cars !== false,
                enable_motorcycles: user?.user_metadata?.enable_motorcycles || false,
                preset_messages: (data.preset_messages && data.preset_messages.length > 0) ? data.preset_messages : DEFAULT_PRESET_MESSAGES,
            };
        }

        // Fallback if no profile row exists yet - ONLY if it's the current user (auth metadata available)
        if (!userId && user) {
            return {
                id: user.id,
                email: user.email || '',
                full_name: user.user_metadata?.full_name || '',
                company_name: user.user_metadata?.company_name || '',
                plan: 'trial',
                planStatus: 'active',
                trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                enable_cars: user.user_metadata?.enable_cars !== false,
                enable_motorcycles: user.user_metadata?.enable_motorcycles || false,
                preset_messages: DEFAULT_PRESET_MESSAGES,
            };
        }

        return null;
    },

    async updateProfile(updates: Partial<Profile>, targetUserId?: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user logged in');

        const idToUpdate = targetUserId || user.id;

        const dbUpdates: any = { ...updates };

        // Map camelCase to snake_case for DB
        if (updates.planStatus !== undefined) {
            dbUpdates.plan_status = updates.planStatus;
            delete dbUpdates.planStatus;
        }
        if (updates.trialEndsAt !== undefined) {
            dbUpdates.trial_ends_at = updates.trialEndsAt;
            delete dbUpdates.trialEndsAt;
        }

        // Remove fields that should only live in auth metadata, if they somehow get here.
        delete dbUpdates.avatar_url;
        delete dbUpdates.company_logo;
        delete dbUpdates.enable_cars;
        delete dbUpdates.enable_motorcycles;

        const { error: updateError } = await supabase
            .from('profiles')
            .update(dbUpdates)
            .eq('id', idToUpdate);

        if (updateError) throw updateError;
    }
};
