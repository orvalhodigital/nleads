import { supabase, handleSupabaseResponse } from '../lib/supabaseClient';
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
        role: data.role || 'empresa',
        parent_id: data.parent_id || undefined,
        plan: (data.plan === 'pro' && data.trial_ends_at && new Date() > new Date(data.trial_ends_at)) ? 'trial' : data.plan,
        planStatus: ((data.plan === 'trial' || data.plan === 'pro') && data.trial_ends_at && new Date() > new Date(data.trial_ends_at)) ? 'expired' : data.plan_status,
        trialEndsAt: data.trial_ends_at,
        created_at: data.created_at,
        webhook_url: data.webhook_url,
        whatsapp_webhook_url: data.whatsapp_webhook_url,
        avatar_url: user?.user_metadata?.avatar_url || data.avatar_url || '',
        company_name: data.company_name || '',
        company_logo: user?.user_metadata?.company_logo || data.company_logo || '',
        phone: data.phone || '',
        use_company_number: data.use_company_number || false,
        monthly_sales_goal: data.monthly_sales_goal,
        monthly_leads_goal: data.monthly_leads_goal,
        monthly_visits_goal: data.monthly_visits_goal,
        monthly_revenue_goal: data.monthly_revenue_goal,
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
        website_background_color: data.website_background_color || '',
        website_bg_color2: data.website_bg_color2 || '',
        website_bg_gradient: data.website_bg_gradient || false,
        website_hero_button_text: data.website_hero_button_text || '',
        website_about_text: data.website_about_text || '',
        website_typography: data.website_typography || 'inter',
        website_card_style: data.website_card_style || 'rounded',
        website_hero_images: data.website_hero_images || [],
        website_video_url: data.website_video_url || '',
        website_privacy_policy: data.website_privacy_policy || '',
        website_terms_of_use: data.website_terms_of_use || '',
        website_business_hours: data.website_business_hours || '',
        website_instagram: data.website_instagram || '',
        website_facebook: data.website_facebook || '',
        website_youtube: data.website_youtube || '',
        website_tiktok: data.website_tiktok || '',
        website_show_sold: data.website_show_sold ?? false,
        website_show_filters: data.website_show_filters ?? true,
        website_diff1_active: data.website_diff1_active ?? true,
        website_diff1_title: data.website_diff1_title || '',
        website_diff1_sub: data.website_diff1_sub || '',
        website_diff1_icon: data.website_diff1_icon || '',
        website_diff2_active: data.website_diff2_active ?? true,
        website_diff2_title: data.website_diff2_title || '',
        website_diff2_sub: data.website_diff2_sub || '',
        website_diff2_icon: data.website_diff2_icon || '',
        website_diff3_active: data.website_diff3_active ?? true,
        website_diff3_title: data.website_diff3_title || '',
        website_diff3_sub: data.website_diff3_sub || '',
        website_diff3_icon: data.website_diff3_icon || '',
        website_diff4_active: data.website_diff4_active ?? true,
        website_diff4_title: data.website_diff4_title || '',
        website_diff4_sub: data.website_diff4_sub || '',
        website_diff4_icon: data.website_diff4_icon || '',
        website_sections: data.website_sections || {},
        website_branding: data.website_branding || {},
        website_optimization: data.website_optimization || {},
        website_content: data.website_content || {},
        website_contact: data.website_contact || {},
        onboarding_completed: data.onboarding_completed || false,
    };
}

function buildFallback(user: any): Profile {
    return {
        id: user.id,
        email: user.email || '',
        full_name: resolveFullName(user),
        role: 'empresa',
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

        const response = await supabase
            .from('profiles')
            .select('*')
            .eq('id', targetUserId)
            .single();

        const { data, error } = response;

        if (error && error.code !== 'PGRST116') {
            handleSupabaseResponse(response); // This will throw for actual errors
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

            const profile = buildProfile({ ...data, full_name: resolvedName, company_name: resolvedCompany }, user);

            // Vendedor herda dados da empresa-mãe em tempo de leitura
            if (profile.role === 'vendedor' && profile.parent_id) {
                const { data: adminData } = await supabase
                    .from('profiles')
                    .select('company_name, company_logo, plan, plan_status, trial_ends_at, webhook_url, whatsapp_webhook_url, preset_messages, phone')
                    .eq('id', profile.parent_id)
                    .single();

                if (adminData) {
                    profile.company_name = adminData.company_name || profile.company_name;
                    profile.company_logo = adminData.company_logo || profile.company_logo;
                    profile.plan = adminData.plan;
                    profile.planStatus = adminData.plan_status;
                    profile.trialEndsAt = adminData.trial_ends_at;

                    if (profile.use_company_number) {
                        profile.webhook_url = adminData.webhook_url;
                        profile.whatsapp_webhook_url = adminData.whatsapp_webhook_url;
                        if (adminData.preset_messages?.length > 0) {
                            profile.preset_messages = adminData.preset_messages;
                        }
                    }
                }
            }

            return profile;
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

        // Allowlist explícita — impede que campos sensíveis (role, plan, parent_id) sejam
        // enviados ao banco mesmo que cheguem acidentalmente no objeto de updates.
        const ALLOWED_FIELDS: (keyof Profile)[] = [
            'full_name', 'company_name', 'company_logo', 'phone', 'avatar_url',
            'webhook_url', 'whatsapp_webhook_url' as any, 'use_company_number' as any,
            'monthly_sales_goal', 'monthly_leads_goal', 'monthly_visits_goal', 'monthly_revenue_goal',
            'preset_messages',
            'website_active', 'website_theme', 'website_primary_color', 'website_secondary_color',
            'website_text_color', 'website_title_color', 'website_use_gradient', 'website_hero_image',
            'website_hero_text', 'website_hero_subtitle', 'website_whatsapp', 'website_cta_text',
            'website_slug', 'website_city', 'website_google_maps', 'custom_domain',
            'website_background_color', 'website_bg_color2', 'website_bg_gradient',
            'website_hero_button_text', 'website_about_text', 'website_typography', 'website_card_style',
            'website_hero_images', 'website_video_url', 'website_privacy_policy', 'website_terms_of_use',
            'website_instagram', 'website_facebook', 'website_youtube', 'website_tiktok',
            'website_business_hours', 'website_show_sold', 'website_show_filters',
            'website_sections', 'website_branding', 'website_optimization', 'website_content',
            'website_contact',
            'website_diff1_active', 'website_diff1_title', 'website_diff1_sub', 'website_diff1_icon',
            'website_diff2_active', 'website_diff2_title', 'website_diff2_sub', 'website_diff2_icon',
            'website_diff3_active', 'website_diff3_title', 'website_diff3_sub', 'website_diff3_icon',
            'website_diff4_active', 'website_diff4_title', 'website_diff4_sub', 'website_diff4_icon',
            'onboarding_completed' as any,
        ];

        const dbUpdates: Record<string, any> = {};
        for (const field of ALLOWED_FIELDS) {
            if (field in updates) {
                dbUpdates[field] = (updates as any)[field];
            }
        }

        // Map camelCase para snake_case
        if (updates.planStatus !== undefined) dbUpdates.plan_status = updates.planStatus;
        if (updates.trialEndsAt !== undefined) dbUpdates.trial_ends_at = updates.trialEndsAt;

        if (Object.keys(dbUpdates).length === 0) return;

        const response = await supabase
            .from('profiles')
            .update(dbUpdates)
            .eq('id', idToUpdate);

        handleSupabaseResponse(response);
    },

    async getTeamMembers(adminId: string): Promise<Profile[]> {
        const response = await supabase
            .from('profiles')
            .select('*')
            .eq('parent_id', adminId)
            .order('created_at', { ascending: false });

        const data = handleSupabaseResponse(response);
        return (data || []).map(row => buildProfile(row, null));
    },

    async createTeamUser(email: string, password: string, fullName: string): Promise<void> {
        const { data, error } = await supabase.functions.invoke('invite_user', {
            body: { action: 'create', email, password, full_name: fullName }
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
    },

    async updateTeamUser(targetUserId: string, fullName: string, newPassword?: string, monthlySalesGoal?: number): Promise<void> {
        const { data, error } = await supabase.functions.invoke('invite_user', {
            body: {
                action: 'update',
                target_user_id: targetUserId,
                full_name: fullName,
                ...(newPassword ? { password: newPassword } : {}),
                ...(monthlySalesGoal !== undefined ? { monthly_sales_goal: monthlySalesGoal } : {})
            }
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
    },

    async removeTeamUser(userId: string): Promise<void> {
        const { data, error } = await supabase.functions.invoke('invite_user', {
            body: { action: 'remove', target_user_id: userId }
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
    }
};
