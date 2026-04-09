import { supabase } from '../lib/supabaseClient';
import { Vehicle, VehicleType, TransmissionType, EngineType } from '../types';

export interface PublicProfile {
    id: string;
    company_name: string;
    company_logo?: string;
    website_theme: 'classic' | 'glass' | 'premium';
    website_primary_color: string;
    website_hero_text: string;
    website_whatsapp: string;
    website_cta_text: string;
    website_slug: string;
    custom_domain?: string;
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
});

export const websiteService = {
    async getProfileBySlug(slug: string): Promise<PublicProfile | null> {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, company_name, company_logo, website_theme, website_primary_color, website_hero_text, website_whatsapp, website_cta_text, website_slug, custom_domain')
            .eq('website_slug', slug)
            .eq('website_active', true)
            .single();

        if (error || !data) return null;
        return data as PublicProfile;
    },

    async getVehiclesByUserId(userId: string): Promise<Vehicle[]> {
        const { data, error } = await supabase
            .from('vehicles')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'available')
            .order('created_at', { ascending: false });

        if (error || !data) return [];
        return data.map(mapRowToVehicle);
    },

    async getVehicleById(id: string): Promise<Vehicle | null> {
        const { data, error } = await supabase
            .from('vehicles')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return null;
        return mapRowToVehicle(data);
    },
};
