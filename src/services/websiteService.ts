import { supabase, handleSupabaseResponse } from '../lib/supabaseClient';
import { Vehicle, VehicleType, TransmissionType, EngineType, LeadPhase } from '../types';

export interface BusinessHourEntry {
    day: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=domingo, 1=segunda...
    open: boolean;
    start: string; // "08:00"
    end: string;   // "18:00"
}

export interface PublicProfile {
    id: string;
    company_name: string;
    company_logo?: string;
    website_theme: 'classic' | 'glass' | 'premium' | 'modern' | 'bold' | 'luxury';
    website_primary_color: string;
    website_secondary_color: string;
    website_text_color: string;
    website_title_color: string;
    website_use_gradient: boolean;
    website_background_color: string;
    website_bg_color2: string;
    website_bg_gradient: boolean;
    website_hero_image: string;
    website_hero_text: string;
    website_hero_subtitle: string;
    website_typography?: 'inter' | 'serif' | 'oswald';
    website_card_style?: 'rounded' | 'square';
    website_whatsapp: string;
    website_cta_text: string;
    website_slug: string;
    website_city: string;
    website_google_maps: string;
    custom_domain?: string;
    business_hours: BusinessHourEntry[];
    website_about_text?: string;
    website_instagram?: string;
    website_facebook?: string;
    website_youtube?: string;
    website_hero_button_text?: string;
    website_show_sold?: boolean;
    website_show_filters?: boolean;
    website_diff1_active?: boolean;
    website_diff1_title?: string;
    website_diff1_sub?: string;
    website_diff2_active?: boolean;
    website_diff2_title?: string;
    website_diff2_sub?: string;
    website_diff3_active?: boolean;
    website_diff3_title?: string;
    website_diff3_sub?: string;
    website_diff4_active?: boolean;
    website_diff4_title?: string;
    website_diff4_sub?: string;
    website_diff1_icon?: string;
    website_diff2_icon?: string;
    website_diff3_icon?: string;
    website_diff4_icon?: string;
    website_sections?: {
        show_mission_vision_values?: boolean;
        mission?: string;
        vision?: string;
        values?: string;
        show_vehicle_categories?: boolean;
        show_maps?: boolean;
        show_contact_form?: boolean;
        show_testimonials?: boolean;
        show_announcement_bar?: boolean;
        show_social_media?: boolean;
    };
    website_branding?: {
        logo_primary?: string;
        logo_dark?: string;
        favicon?: string;
        enabled?: boolean;
        text?: string;
        color?: string;
    };
    website_optimization?: {
        meta_title?: string;
        meta_description?: string;
        google_tag_manager?: string;
        meta_pixel?: string;
        custom_scripts?: string;
    };
    website_content?: {
        hero_title?: string;
        hero_subtitle?: string;
        mission?: string;
        vision?: string;
        values?: string;
        testimonials?: Array<{
            id?: string;
            name: string;
            role: string;
            text: string;
            photo?: string;
        }>;
    };
    website_contact?: {
        whatsapp?: string;
        phone?: string;
        email?: string;
        address?: string;
        google_maps_embed?: string;
        instagram?: string;
        facebook?: string;
        tiktok?: string;
        youtube?: string;
    };
    preset_messages?: string[];
}

const mapRowToVehicle = (row: any): Vehicle => ({
    id: row.id,
    brand: row.brand,
    model: row.model,
    year: row.year,
    modelYear: row.model_year || row.year,
    plate: row.plate || '',
    price: row.price,
    type: row.type as VehicleType,
    transmission: row.transmission as TransmissionType,
    engine: row.engine as EngineType,
    mileage: row.mileage,
    color: row.color,
    isSingleOwner: row.is_single_owner,
    isServiceHistoryComplete: row.is_service_history_complete,
    isIpvaPaid: row.is_ipva_paid,
    hasWarranty: row.has_warranty,
    optionals: row.optionals || [],
    imageUrl: row.image_url || '',
    galleryImages: row.gallery_images || [],
    status: (row.status as 'available' | 'sold') || 'available',
    showOnWebsite: row.show_on_website !== false,
});

export const websiteService = {
    async getProfileBySlug(slug: string): Promise<{ profile: PublicProfile | null; reason: 'ok' | 'not_found' | 'inactive' | 'error'; errorMsg?: string }> {
        // First: check if slug exists at all (regardless of active status)
        const { data: anyData, error: anyError } = await supabase
            .from('profiles')
            .select('*')
            .eq('website_slug', slug)
            .maybeSingle();

        if (anyError) {
            console.error('[websiteService] Error fetching profile:', anyError);
            return { profile: null, reason: 'error', errorMsg: anyError.message };
        }
        if (!anyData) {
            return { profile: null, reason: 'not_found' };
        }
        if (!anyData.website_active) {
            return { profile: null, reason: 'inactive' };
        }
        return { profile: anyData as PublicProfile, reason: 'ok' };
    },

    async getVehiclesByUserId(userId: string): Promise<Vehicle[]> {
        try {
            const { data, error } = await supabase
                .from('vehicles')
                .select('*')
                .eq('user_id', userId)
                .eq('status', 'available')
                .neq('show_on_website', false)
                .order('created_at', { ascending: false });

            if (!error) {
                return (data || []).map(mapRowToVehicle);
            }

            // Fallback: coluna ainda não existe no banco — busca tudo e filtra no JS
            const { data: fallbackData } = await supabase
                .from('vehicles')
                .select('*')
                .eq('user_id', userId)
                .eq('status', 'available')
                .order('created_at', { ascending: false });

            return (fallbackData || []).map(mapRowToVehicle).filter(v => v.showOnWebsite !== false);
        } catch {
            return [];
        }
    },

    async getVehicleById(id: string, ownerId?: string): Promise<Vehicle | null> {
        let query = supabase
            .from('vehicles')
            .select('*')
            .eq('id', id);

        if (ownerId) {
            query = query.eq('user_id', ownerId);
        }

        const response = await query.single();

        const data = handleSupabaseResponse(response);
        return data ? mapRowToVehicle(data) : null;
    },

    async getVehicleBySlugPrefix(idPrefix: string, ownerId: string): Promise<Vehicle | null> {
        const response = await supabase
            .from('vehicles')
            .select('*')
            .ilike('id', `${idPrefix}%`)
            .eq('user_id', ownerId)
            .maybeSingle();

        const data = handleSupabaseResponse(response);
        return data ? mapRowToVehicle(data) : null;
    },

    async createPublicLead(userId: string, leadData: {
        name: string;
        phone: string;
        phase?: LeadPhase;
        scheduling_data?: any;
        simulation_data?: any;
        possui_troca?: boolean;
        veiculo_troca?: string;
    }): Promise<{ success: boolean; error?: string }> {
        try {
            const response = await supabase
                .from('leads')
                .insert({
                    user_id: userId,
                    name: leadData.name,
                    phone: leadData.phone,
                    source: 'Site',
                    phase: leadData.phase || LeadPhase.NEW,
                    email: '',
                    temperature: 'WARM',
                    tipos_veiculo: [],
                    marcas: [],
                    modelos: [],
                    transmissao: ['Qualquer Um(a)'],
                    motorizacao: ['Qualquer Um(a)'],
                    observacoes_adicionais: '',
                    possui_entrada: false,
                    possui_troca: leadData.possui_troca || false,
                    veiculo_troca: leadData.veiculo_troca || '',
                    presented_vehicles: [],
                    scheduling_data: leadData.scheduling_data || null,
                    simulation_data: leadData.simulation_data || null,
                });

            handleSupabaseResponse(response);
            return { success: true };
        } catch (err: any) {
            console.error('[websiteService] Exception creating public lead:', err);
            return { success: false, error: err.message };
        }
    },
};
