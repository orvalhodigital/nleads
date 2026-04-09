
import { supabase } from '../lib/supabaseClient';
import { Vehicle, SaleDetails, VehicleType, TransmissionType, EngineType } from '../types';
import { Database } from '../lib/database.types';

type VehicleRow = Database['public']['Tables']['vehicles']['Row'];

// Mapper to convert DB Row to App Entity
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
    saleDetails: row.sale_details ? (row.sale_details as unknown as SaleDetails) : undefined
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
        await supabase.storage.from('vehicles').remove(paths);
    }
}

export const vehicleService = {
    async getAll(userId?: string): Promise<Vehicle[]> {
        const { data: { user } } = await supabase.auth.getUser();
        const targetUserId = userId || user?.id;

        const { data, error } = await supabase
            .from('vehicles')
            .select('*')
            .eq('user_id', targetUserId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(mapRowToVehicle);
    },

    async search(query: string, userId?: string): Promise<Vehicle[]> {
        const { data: { user } } = await supabase.auth.getUser();
        const targetUserId = userId || user?.id;

        const { data, error } = await supabase
            .from('vehicles')
            .select('*')
            .eq('user_id', targetUserId)
            .or(`brand.ilike.%${query}%,model.ilike.%${query}%`)
            .limit(5);

        if (error) throw error;
        return (data || []).map(mapRowToVehicle);
    },

    async create(vehicle: Omit<Vehicle, 'id'>): Promise<Vehicle> {
        // Tenta inserção padrão
        const { data, error } = await supabase
            .from('vehicles')
            .insert({
                brand: vehicle.brand,
                model: vehicle.model,
                year: vehicle.year,
                model_year: vehicle.modelYear,
                plate: vehicle.plate,
                price: vehicle.price,
                type: vehicle.type,
                transmission: vehicle.transmission,
                engine: vehicle.engine,
                mileage: vehicle.mileage,
                color: vehicle.color,
                is_single_owner: vehicle.isSingleOwner,
                is_service_history_complete: vehicle.isServiceHistoryComplete,
                is_ipva_paid: vehicle.isIpvaPaid,
                has_warranty: vehicle.hasWarranty,
                optionals: vehicle.optionals,
                image_url: vehicle.imageUrl,
                gallery_images: vehicle.galleryImages || [],
                status: vehicle.status,
                sale_details: vehicle.saleDetails ? (vehicle.saleDetails as unknown as any) : null
            })
            .select()
            .single();

        if (error) {
            console.warn("Inserção padrão falhou, tentando fallback RPC V4...", error);

            // Verificar Sessão antes de fallback
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                console.error("Sessão Expirada! Não é possível criar veículo.");
                throw new Error("Sessão expirada. Faça login novamente.");
            }

            // Fallback: Tenta via Função de Segurança V4 (Parâmetros Planos)
            const params = {
                p_brand: vehicle.brand,
                p_model: vehicle.model,
                p_year: vehicle.year,
                p_model_year: vehicle.modelYear || vehicle.year,
                p_price: vehicle.price,
                p_type: vehicle.type,
                p_transmission: vehicle.transmission,
                p_engine: vehicle.engine,
                p_mileage: vehicle.mileage,
                p_color: vehicle.color,
                p_status: vehicle.status,
                p_image_url: vehicle.imageUrl,
                p_optionals: vehicle.optionals || [],
                p_is_single_owner: !!vehicle.isSingleOwner,
                p_is_service_history_complete: !!vehicle.isServiceHistoryComplete,
                p_is_ipva_paid: !!vehicle.isIpvaPaid,
                p_has_warranty: !!vehicle.hasWarranty
            };

            const { data: rpcData, error: rpcError } = await supabase.rpc('create_vehicle_v4', params);

            if (rpcError) {
                console.error("RPC Fallback V4 CRÍTICO:", rpcError);
                throw new Error(`Falha ao criar veículo (Erro: ${rpcError.message || rpcError.code})`);
            }

            if (rpcData && rpcData.id) {
                // Return constructed object to avoid unnecessary fetch if possible, OR fetch lightly
                // Let's fetch to be safe
                const { data: newData, error: fetchError } = await supabase.from('vehicles').select('*').eq('id', rpcData.id).single();
                if (fetchError) {
                    console.warn("Veículo criado mas falha ao recuperar:", fetchError);
                    // Return rudimentary object if fetch fails
                    return { ...vehicle, id: rpcData.id } as Vehicle;
                }
                return mapRowToVehicle(newData);
            }

            throw new Error("Falha desconhecida no fallback RPC.");
        }

        return mapRowToVehicle(data);
    },

    async update(vehicle: Vehicle): Promise<Vehicle> {
        const { data, error } = await supabase
            .from('vehicles')
            .update({
                brand: vehicle.brand,
                model: vehicle.model,
                year: vehicle.year,
                model_year: vehicle.modelYear,
                plate: vehicle.plate,
                price: vehicle.price,
                type: vehicle.type,
                transmission: vehicle.transmission,
                engine: vehicle.engine,
                mileage: vehicle.mileage,
                color: vehicle.color,
                is_single_owner: vehicle.isSingleOwner,
                is_service_history_complete: vehicle.isServiceHistoryComplete,
                is_ipva_paid: vehicle.isIpvaPaid,
                has_warranty: vehicle.hasWarranty,
                optionals: vehicle.optionals,
                image_url: vehicle.imageUrl,
                gallery_images: vehicle.galleryImages || [],
                status: vehicle.status,
                sale_details: vehicle.saleDetails ? (vehicle.saleDetails as unknown as any) : null
            })
            .eq('id', vehicle.id)
            .select()
            .single();

        if (error) throw error;
        return mapRowToVehicle(data);
    },

    async delete(id: string): Promise<void> {
        // 1. Fetch vehicle to get all images
        const { data: vehicle } = await supabase
            .from('vehicles')
            .select('image_url, gallery_images')
            .eq('id', id)
            .single();

        // 2. Delete all images from Storage (main + gallery)
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

        // 3. Delete record from DB
        const { error } = await supabase
            .from('vehicles')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async sell(id: string, saleDetails: SaleDetails): Promise<void> {
        // 1. Fetch gallery images to delete them (keep only main image)
        const { data: vehicle } = await supabase
            .from('vehicles')
            .select('gallery_images')
            .eq('id', id)
            .single();

        if (vehicle?.gallery_images?.length) {
            try {
                await deleteStorageUrls(vehicle.gallery_images);
            } catch (err) {
                console.error("Erro ao deletar galeria na venda:", err);
            }
        }

        // 2. Mark as sold and clear gallery
        const { error } = await supabase
            .from('vehicles')
            .update({
                status: 'sold',
                gallery_images: [],
                sale_details: saleDetails as unknown as any
            })
            .eq('id', id);

        if (error) throw error;
    }
};
