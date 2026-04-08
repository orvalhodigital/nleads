import { supabase } from '../lib/supabaseClient';
import { SaleDetails, Motorcycle, MotorcycleCategory } from '../types';

// ─── Row → App mapper ────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapRowToMotorcycle = (row: any): Motorcycle => ({
    id: row.id,
    brand: row.brand,
    model: row.model,
    year: row.year,
    modelYear: row.model_year ?? row.year,
    plate: row.plate ?? '',
    price: row.price,
    category: row.category as MotorcycleCategory,
    engine: row.engine ?? '',
    mileage: row.mileage ?? 0,
    color: row.color ?? '',
    isSingleOwner: row.is_single_owner ?? false,
    hasWarranty: row.has_warranty ?? false,
    isIpvaPaid: row.is_ipva_paid ?? false,
    optionals: row.optionals ?? [],
    imageUrl: row.image_url ?? '',
    status: (row.status as 'available' | 'sold') ?? 'available',
    saleDetails: row.sale_details ? (row.sale_details as unknown as SaleDetails) : undefined,
});

// ─── Service ─────────────────────────────────────────────────────────────────

export const motorcycleService = {

    async getAll(userId?: string): Promise<Motorcycle[]> {
        const { data: { user } } = await supabase.auth.getUser();
        const targetUserId = userId || user?.id;

        const { data, error } = await supabase
            .from('motorcycles')
            .select('*')
            .eq('user_id', targetUserId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(mapRowToMotorcycle);
    },

    async search(query: string, userId?: string): Promise<Motorcycle[]> {
        const { data: { user } } = await supabase.auth.getUser();
        const targetUserId = userId || user?.id;

        const { data, error } = await supabase
            .from('motorcycles')
            .select('*')
            .eq('user_id', targetUserId)
            .or(`brand.ilike.%${query}%,model.ilike.%${query}%`)
            .limit(5);

        if (error) throw error;
        return (data || []).map(mapRowToMotorcycle);
    },

    async create(moto: Omit<Motorcycle, 'id'>): Promise<Motorcycle> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado ou sessão expirada.');

        const { data, error } = await supabase
            .from('motorcycles')
            .insert({
                user_id: user.id,
                brand: moto.brand,
                model: moto.model,
                year: moto.year,
                model_year: moto.modelYear,
                plate: moto.plate,
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
                status: moto.status,
                sale_details: moto.saleDetails ?? null,
            })
            .select()
            .single();

        if (error) {
            console.error('Erro Supabase ao criar moto:', error);
            throw new Error(error.message || 'Erro ao inserir moto no banco de dados');
        }
        return mapRowToMotorcycle(data);
    },

    async update(moto: Motorcycle): Promise<Motorcycle> {
        const { data, error } = await supabase
            .from('motorcycles')
            .update({
                brand: moto.brand,
                model: moto.model,
                year: moto.year,
                model_year: moto.modelYear,
                plate: moto.plate,
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
                status: moto.status,
                sale_details: moto.saleDetails ?? null,
            })
            .eq('id', moto.id)
            .select()
            .single();

        if (error) {
            console.error('Erro Supabase ao atualizar moto:', error);
            throw new Error(error.message || 'Erro ao atualizar moto');
        }
        return mapRowToMotorcycle(data);
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase.from('motorcycles').delete().eq('id', id);
        if (error) throw error;
    },

    async sell(id: string, details: SaleDetails): Promise<void> {
        const { error } = await supabase
            .from('motorcycles')
            .update({ status: 'sold', sale_details: details })
            .eq('id', id);
        if (error) throw error;
    },

    async uploadImage(file: File, userId: string): Promise<string> {
        const path = `moto-${userId}-${Date.now()}.webp`;

        const { error } = await supabase.storage.from('vehicles').upload(path, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: 'image/webp'
        });

        if (error) throw error;

        const { data } = supabase.storage.from('vehicles').getPublicUrl(path);
        return data.publicUrl;
    },
};
