import { supabase, handleSupabaseResponse } from '../lib/supabaseClient';
import { SaleDetails, Motorcycle, MotorcycleCategory, MotoStartType, MotoFuelSystem, MotoCooling, MotoBrakeType, EngineType } from '../types';

// ─── Row → App mapper ────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapRowToMotorcycle = (row: any): Motorcycle => ({
    id: row.id,
    brand: row.brand,
    model: row.model,
    year: row.year,
    modelYear: row.model_year ?? row.year,
    plate: row.plate ?? '',
    chassis: row.chassis ?? '',
    fipePrice: row.fipe_price,
    price: row.price,
    category: row.category as MotorcycleCategory,
    engine: row.engine as EngineType,
    mileage: row.mileage ?? 0,
    color: row.color ?? '',
    isSingleOwner: row.is_single_owner ?? false,
    hasWarranty: row.has_warranty ?? false,
    isIpvaPaid: row.is_ipva_paid ?? false,
    optionals: row.optionals ?? [],
    imageUrl: row.image_url ?? '',
    galleryImages: row.gallery_images ?? [],
    startType: row.start_type as MotoStartType || undefined,
    brakeType: row.brake_type as MotoBrakeType || undefined,
    fuelSystem: row.fuel_system as MotoFuelSystem || undefined,
    cooling: row.cooling as MotoCooling || undefined,
    hasSpareKey: row.has_spare_key ?? undefined,
    hasOwnerManual: row.has_owner_manual ?? undefined,
    status: (row.status as 'available' | 'sold') ?? 'available',
    saleDetails: row.sale_details ? (row.sale_details as unknown as SaleDetails) : undefined,
});

// ─── Service ─────────────────────────────────────────────────────────────────

export const motorcycleService = {
    async getAll(userId?: string): Promise<Motorcycle[]> {
        const { data: { user } } = await supabase.auth.getUser();
        const targetUserId = userId || user?.id;

        const response = await supabase
            .from('motorcycles')
            .select('*')
            .eq('user_id', targetUserId)
            .order('created_at', { ascending: false });

        const data = handleSupabaseResponse(response);
        return (data || []).map(mapRowToMotorcycle);
    },

    async search(query: string, userId?: string, limit: number = 10): Promise<Motorcycle[]> {
        const { data: { user } } = await supabase.auth.getUser();
        const targetUserId = userId || user?.id;

        const response = await supabase
            .from('motorcycles')
            .select('*')
            .eq('user_id', targetUserId)
            .or(`brand.ilike.%${query}%,model.ilike.%${query}%`)
            .limit(limit);

        const data = handleSupabaseResponse(response);
        return (data || []).map(mapRowToMotorcycle);
    },

    async create(moto: Omit<Motorcycle, 'id'>): Promise<Motorcycle> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado ou sessão expirada.');

        const response = await supabase
            .from('motorcycles')
            .insert({
                user_id: user.id,
                brand: moto.brand,
                model: moto.model,
                year: moto.year,
                model_year: moto.modelYear,
                plate: moto.plate,
                chassis: moto.chassis,
                fipe_price: moto.fipePrice,
                price: moto.price,
                category: moto.category,
                engine: moto.engine,
                mileage: moto.mileage,
                color: moto.color,
                is_single_owner: moto.isSingleOwner,
                has_warranty: moto.hasWarranty,
                is_ipva_paid: moto.isIpvaPaid,
                optionals: moto.optionals,
                image_url: moto.imageUrl,
                gallery_images: moto.galleryImages ?? [],
                start_type: moto.startType ?? null,
                brake_type: moto.brakeType ?? null,
                fuel_system: moto.fuelSystem ?? null,
                cooling: moto.cooling ?? null,
                has_spare_key: moto.hasSpareKey ?? null,
                has_owner_manual: moto.hasOwnerManual ?? null,
                status: moto.status,
                sale_details: moto.saleDetails ?? null,
            })
            .select()
            .single();

        const data = handleSupabaseResponse(response);
        if (!data) throw new Error('Falha ao criar moto.');
        return mapRowToMotorcycle(data);
    },

    async update(moto: Motorcycle): Promise<Motorcycle> {
        const response = await supabase
            .from('motorcycles')
            .update({
                brand: moto.brand,
                model: moto.model,
                year: moto.year,
                model_year: moto.modelYear,
                plate: moto.plate,
                chassis: moto.chassis,
                fipe_price: moto.fipePrice,
                price: moto.price,
                category: moto.category,
                engine: moto.engine,
                mileage: moto.mileage,
                color: moto.color,
                is_single_owner: moto.isSingleOwner,
                has_warranty: moto.hasWarranty,
                is_ipva_paid: moto.isIpvaPaid,
                optionals: moto.optionals,
                image_url: moto.imageUrl,
                gallery_images: moto.galleryImages ?? [],
                start_type: moto.startType ?? null,
                brake_type: moto.brakeType ?? null,
                fuel_system: moto.fuelSystem ?? null,
                cooling: moto.cooling ?? null,
                has_spare_key: moto.hasSpareKey ?? null,
                has_owner_manual: moto.hasOwnerManual ?? null,
                status: moto.status,
                sale_details: moto.saleDetails ?? null,
            })
            .eq('id', moto.id)
            .select()
            .single();

        const data = handleSupabaseResponse(response);
        if (!data) throw new Error('Falha ao atualizar moto.');
        return mapRowToMotorcycle(data);
    },

    async delete(id: string): Promise<void> {
        const responseSelect = await supabase
            .from('motorcycles')
            .select('image_url, gallery_images')
            .eq('id', id)
            .single();

        const moto = handleSupabaseResponse(responseSelect);

        if (moto) {
            const allUrls = [moto.image_url, ...(moto.gallery_images || [])].filter(Boolean) as string[];
            const paths = allUrls.map(url => {
                if (!url.includes('/public/')) return null;
                const parts = url.split('/public/')[1]?.split('/');
                if (!parts) return null;
                parts.shift();
                return parts.join('/');
            }).filter(Boolean) as string[];
            if (paths.length) {
                await handleSupabaseResponse(await supabase.storage.from('vehicles').remove(paths));
            }
        }

        const responseDelete = await supabase.from('motorcycles').delete().eq('id', id);
        handleSupabaseResponse(responseDelete);
    },

    async sell(id: string, details: SaleDetails): Promise<void> {
        const response = await supabase
            .from('motorcycles')
            .update({ status: 'sold', sale_details: details as any })
            .eq('id', id);
        handleSupabaseResponse(response);
    },

    async uploadImage(file: File, userId: string): Promise<string> {
        const path = `moto-${userId}-${Date.now()}.webp`;

        const response = await supabase.storage.from('vehicles').upload(path, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: 'image/webp'
        });

        handleSupabaseResponse(response);

        const { data } = supabase.storage.from('vehicles').getPublicUrl(path);
        return data.publicUrl;
    },

    async uploadGalleryImage(file: File, userId: string): Promise<string> {
        const path = `moto-gallery/${userId}-${Date.now()}-${Math.random().toString(36).substring(2)}.webp`;

        const response = await supabase.storage.from('vehicles').upload(path, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: 'image/webp'
        });

        handleSupabaseResponse(response);

        const { data } = supabase.storage.from('vehicles').getPublicUrl(path);
        return data.publicUrl;
    },
};