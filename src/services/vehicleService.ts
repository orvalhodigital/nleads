import { supabase, handleSupabaseResponse } from '../lib/supabaseClient';
import { Vehicle, SaleDetails, VehicleType, TransmissionType, EngineType, FuelType } from '../types';
import { Database } from '../lib/database.types';

type VehicleRow = Database['public']['Tables']['vehicles']['Row'];

// Mapper to convert DB Row to App Entity
const mapRowToVehicle = (row: any): Vehicle => ({
    id: row.id,
    brand: row.brand,
    model: row.model,
    modelYear: row.model_year || row.year,
    year: row.year,
    plate: row.plate || '',
    fipePrice: row.fipe_price,
    price: row.price,
    type: row.type as VehicleType,
    transmission: row.transmission as TransmissionType,
    engine: row.engine as EngineType,
    fuelType: (row.fuel_type as FuelType) || undefined,
    doors: row.doors ? (row.doors as 2 | 4) : undefined,
    hasSpareKey: row.has_spare_key ? (row.has_spare_key as boolean) : undefined,
    hasOwnerManual: row.has_owner_manual ? (row.has_owner_manual as boolean) : undefined,
    mileage: row.mileage,
    color: row.color,
    isSingleOwner: row.is_single_owner,
    isServiceHistoryComplete: row.is_service_history_complete,
    isIpvaPaid: row.is_ipva_paid,
    hasWarranty: row.has_warranty,
    optionals: row.optionals || [],
    imageUrl: row.image_url || '',
    galleryImages: row.gallery_images || [],
    shortDescription: row.short_description || '',
    description: row.description || '',
    status: (row.status as 'available' | 'sold') || 'available',
    sale_phase: row.sale_phase,
    saleDetails: row.sale_details ? (row.sale_details as unknown as SaleDetails) : undefined,
    showOnWebsite: row.show_on_website !== false
});

// Helper: delete a list of storage URLs from the 'vehicles' bucket
async function deleteStorageUrls(urls: string[]): Promise<void> {
    const paths = urls
        .map(url => {
            if (!url || !url.includes('/public/')) return null;
            const relativePath = url.split('/public/')[1];
            if (!relativePath) return null;
            const parts = relativePath.split('/');
            parts.shift(); // remove bucket name
            return parts.join('/');
        })
        .filter(Boolean) as string[];

    if (paths.length > 0) {
        await handleSupabaseResponse(await supabase.storage.from('vehicles').remove(paths));
    }
}

export const vehicleService = {
    async getAll(userId?: string, adminId?: string): Promise<Vehicle[]> {
        const { data: { user } } = await supabase.auth.getUser();

        let query = supabase
            .from('vehicles')
            .select('*')
            .order('created_at', { ascending: false });

        if (adminId) {
            query = query.eq('admin_id', adminId);
        } else {
            const targetUserId = userId || user?.id;
            query = query.eq('user_id', targetUserId);
        }

        const response = await query;
        const data = handleSupabaseResponse(response);
        return (data || []).map(mapRowToVehicle);
    },

    async search(query: string, userId?: string, adminId?: string, limit: number = 10): Promise<Vehicle[]> {
        const { data: { user } } = await supabase.auth.getUser();

        let q = supabase
            .from('vehicles')
            .select('*')
            .or(`brand.ilike.%${query}%,model.ilike.%${query}%`)
            .limit(limit);

        if (adminId) {
            q = q.eq('admin_id', adminId);
        } else {
            q = q.eq('user_id', userId || user?.id);
        }

        const response = await q;
        const data = handleSupabaseResponse(response);
        return (data || []).map(mapRowToVehicle);
    },

    async create(vehicle: Omit<Vehicle, 'id'>, userId?: string, adminId?: string): Promise<Vehicle> {
        const { data: { user } } = await supabase.auth.getUser();
        const targetUserId = userId || user?.id;
        if (!targetUserId) throw new Error('Usuário não autenticado ou sessão expirada.');

        const response = await supabase
            .from('vehicles')
            .insert({
                user_id: targetUserId,
                admin_id: adminId || null,
                brand: vehicle.brand,
                model: vehicle.model,
                year: vehicle.year,
                model_year: vehicle.modelYear,
                plate: vehicle.plate,
                fipe_price: vehicle.fipePrice,
                price: vehicle.price,
                type: vehicle.type,
                transmission: vehicle.transmission,
                engine: vehicle.engine,
                fuel_type: vehicle.fuelType || null,
                doors: vehicle.doors || null,
                has_spare_key: vehicle.hasSpareKey ?? null,
                has_owner_manual: vehicle.hasOwnerManual ?? null,
                mileage: vehicle.mileage,
                color: vehicle.color,
                is_single_owner: vehicle.isSingleOwner,
                is_service_history_complete: vehicle.isServiceHistoryComplete,
                is_ipva_paid: vehicle.isIpvaPaid,
                has_warranty: vehicle.hasWarranty,
                optionals: vehicle.optionals,
                image_url: vehicle.imageUrl,
                gallery_images: vehicle.galleryImages || [],
                short_description: vehicle.shortDescription || null,
                description: vehicle.description || null,
                status: vehicle.status,
                sale_phase: vehicle.sale_phase,
                sale_details: vehicle.saleDetails ? (vehicle.saleDetails as unknown as any) : null,
                show_on_website: vehicle.showOnWebsite !== false
            })
            .select()
            .single();

        const data = handleSupabaseResponse(response);
        if (!data) throw new Error('Falha ao criar veículo.');
        return mapRowToVehicle(data);
    },

    async update(vehicle: Vehicle): Promise<Vehicle> {
        const response = await supabase
            .from('vehicles')
            .update({
                brand: vehicle.brand,
                model: vehicle.model,
                year: vehicle.year,
                model_year: vehicle.modelYear,
                plate: vehicle.plate,
                fipe_price: vehicle.fipePrice,
                price: vehicle.price,
                type: vehicle.type,
                transmission: vehicle.transmission,
                engine: vehicle.engine,
                fuel_type: vehicle.fuelType || null,
                doors: vehicle.doors || null,
                has_spare_key: vehicle.hasSpareKey ?? null,
                has_owner_manual: vehicle.hasOwnerManual ?? null,
                mileage: vehicle.mileage,
                color: vehicle.color,
                is_single_owner: vehicle.isSingleOwner,
                is_service_history_complete: vehicle.isServiceHistoryComplete,
                is_ipva_paid: vehicle.isIpvaPaid,
                has_warranty: vehicle.hasWarranty,
                optionals: vehicle.optionals,
                image_url: vehicle.imageUrl,
                gallery_images: vehicle.galleryImages || [],
                short_description: vehicle.shortDescription || null,
                description: vehicle.description || null,
                status: vehicle.status,
                sale_phase: vehicle.sale_phase,
                sale_details: vehicle.saleDetails ? (vehicle.saleDetails as unknown as any) : null,
                show_on_website: vehicle.showOnWebsite !== false
            })
            .eq('id', vehicle.id)
            .select()
            .single();

        const data = handleSupabaseResponse(response);
        if (!data) throw new Error('Falha ao atualizar veículo.');
        return mapRowToVehicle(data);
    },

    async delete(id: string): Promise<void> {
        const responseSelect = await supabase
            .from('vehicles')
            .select('image_url, gallery_images')
            .eq('id', id)
            .single();

        const vehicle = handleSupabaseResponse(responseSelect);

        if (vehicle) {
            try {
                const allUrls = [
                    vehicle.image_url,
                    ...(vehicle.gallery_images || [])
                ].filter(Boolean) as string[];
                await deleteStorageUrls(allUrls);
            } catch (err) {
                console.error("Erro ao deletar imagens do storage:", err);
            }
        }

        const responseDelete = await supabase
            .from('vehicles')
            .delete()
            .eq('id', id);

        handleSupabaseResponse(responseDelete);
    },

    async sell(id: string, saleDetails: SaleDetails): Promise<void> {
        const responseSelect = await supabase
            .from('vehicles')
            .select('gallery_images')
            .eq('id', id)
            .single();

        const vehicle = handleSupabaseResponse(responseSelect);

        if (vehicle?.gallery_images?.length) {
            try {
                await deleteStorageUrls(vehicle.gallery_images);
            } catch (err) {
                console.error("Erro ao deletar galeria na venda:", err);
            }
        }

        const responseUpdate = await supabase
            .from('vehicles')
            .update({
                status: 'sold',
                gallery_images: [],
                sale_details: saleDetails as unknown as any
            })
            .eq('id', id);

        handleSupabaseResponse(responseUpdate);
    },

    async updateSalePhase(id: string, phase: string, saleDetails?: SaleDetails): Promise<void> {
        const response = await supabase
            .from('vehicles')
            .update({
                sale_phase: phase,
                ...(saleDetails && { sale_details: saleDetails as unknown as any })
            })
            .eq('id', id);

        handleSupabaseResponse(response);
    }
};