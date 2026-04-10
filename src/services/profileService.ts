import { supabase } from '../lib/supabaseClient';
import { Profile } from '../types';
import { DEFAULT_PRESET_MESSAGES } from '../utils/constants';

// Supabase stores email/password signup names in full_name, but Google OAuth stores in name
function resolveFullName(user: any, dbFullName?: string): string {
    return dbFullName
        || user?.user_metadata?.full_name
        || user?.user_metadata?.name  // Google OAuth field
        || '';
}

function buildProfile(data: any, user: any): Profile {
    return {
        id: data.id,
        email: data.email,
        full_name: data.full_name || '',
        plan: (data.plan === 'pro' && data.trial_ends_at && new Date() > new Date(data.trial_ends_at)) ? 'trial' : data.plan,
        planStatus: ((data.plan === 'trial' || data.plan === 'pro') && data.trial_ends_at && new Date() > new Date(data.trial_ends_at)) ? 'expired' : data.plan_status,
        trialEndsAt: data.trial_ends_at,
        created_at: data.created_at,
        webhook_url: data.webhook_url,
        avatar_url: user?.user_metadata?.avatar_url || data.avatar_url || '',
        company_name: data.company_name || '',
        company_logo: user?.user_metadata?.company_logo || data.company_logo || '',
        monthly_sales_goal: data.monthly_sales_goal,
        enable_cars: user?.user_metadata?.enable_cars !== false,
        enable_motorcycles: user?.user_metadata?.enable_motorcycles || false,
        preset_messages: (data.preset_messages && data.preset_messages.length > 0) ? data.preset_messages : DEFAULT_PRESET_MESSAGES,
        // Website settings
        website_active: data.website_active || false,
        website_theme: data.website_theme || 'classic',
        website_primary_color: data.website_primary_color || '#10b981',
        website_secondary_color: data.website_secondary_color || '#0891b2',
        website_text_color: data.website_text_color || '#374151',
        website_title_color: data.website_title_color || '#111827',
        website_use_gradient: data.website_use_gradient || false,
        website_hero_image: data.website_hero_image || '',
        website_hero_text: data.website_hero_text || '',
        website_hero_subtitle: data.website_hero_subtitle || '',
        website_whatsapp: data.website_whatsapp || '',
        website_cta_text: data.website_cta_text || 'Tenho Interesse',
        website_slug: data.website_slug || '',
        website_city: data.website_city || '',
        website_google_maps: data.website_google_maps || '',
        custom_domain: data.custom_domain || '',
    };
}

function buildFallback(user: any): Profile {
    return {
        id: user.id,
        email: user.email || '',
        full_name: resolveFullName(user),
        company_name: user.user_metadata?.company_name || '',
        plan: 'trial',
        planStatus: 'active',
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        enable_cars: user.user_metadata?.enable_cars !== false,
        enable_motorcycles: user.user_metadata?.enable_motorcycles || false,
        preset_messages: DEFAULT_PRESET_MESSAGES,
    };
}

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
        }

        // No profile row yet — create one and re-fetch so the DB row is source of truth
        if (error?.code === 'PGRST116' && !userId && user) {
            const resolvedName = resolveFullName(user);
            await supabase.from('profiles').upsert({
                id: user.id,
                email: user.email || '',
                full_name: resolvedName,
                company_name: user.user_metadata?.company_name || '',
                plan: 'trial',
                plan_status: 'active',
                trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            }, { onConflict: 'id' });

            // Re-fetch after creation
            const { data: fresh } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (fresh) {
                return buildProfile(fresh, user);
            }
            // If re-fetch failed, return from metadata directly
            return buildFallback(user);
        }

        if (data) {
            // Profile row exists but name/company missing — patch silently from auth metadata
            const resolvedName = resolveFullName(user, data.full_name);
            const resolvedCompany = data.company_name || user?.user_metadata?.company_name || '';
            if ((!data.full_name || !data.company_name) && user) {
                supabase.from('profiles').update({
                    full_name: resolvedName,
                    company_name: resolvedCompany,
                }).eq('id', data.id).then(() => {});
            }
            return buildProfile({ ...data, full_name: resolvedName, company_name: resolvedCompany }, user);
        }

        if (!userId && user) {
            return buildFallback(user);
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
        delete dbUpdates.enable_cars;
        delete dbUpdates.enable_motorcycles;

        const { error: updateError } = await supabase
            .from('profiles')
            .update(dbUpdates)
            .eq('id', idToUpdate);

        if (updateError) throw updateError;
    }
};
