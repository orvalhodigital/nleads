import { supabase } from '../lib/supabaseClient';
import { Phone, SaleDetails } from '../types';

export const phoneService = {
    async getAll(userId?: string): Promise<Phone[]> {
        const { data: { user } } = await supabase.auth.getUser();
        const targetUserId = userId || user?.id;

        const { data, error } = await supabase
            .from('phones')
            .select('*')
            .eq('user_id', targetUserId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(row => ({
            id: row.id,
            brand: row.brand,
            model: row.model,
            capacity: row.capacity,
            color: row.color,
            condition: row.condition as any,
            batteryHealth: row.battery_health,
            price: row.price,
            status: row.status as any,
            imageUrl: row.image_url,
            createdAt: row.created_at,
            saleDetails: row.sale_details
        }));
    },

    async create(phone: Omit<Phone, 'id' | 'createdAt'>): Promise<Phone> {
        const { data: { user } } = await supabase.auth.getUser();

        const { data, error } = await supabase
            .from('phones')
            .insert({
                user_id: user?.id,
                brand: phone.brand,
                model: phone.model,
                capacity: phone.capacity,
                color: phone.color,
                condition: phone.condition,
                battery_health: phone.batteryHealth,
                price: phone.price,
                status: phone.status,
                image_url: phone.imageUrl,
                sale_details: phone.saleDetails
            })
            .select()
            .single();

        if (error) throw error;
        return {
            ...phone,
            id: data.id,
            createdAt: data.created_at
        } as Phone;
    },

    async update(phone: Phone): Promise<Phone> {
        const { error } = await supabase
            .from('phones')
            .update({
                brand: phone.brand,
                model: phone.model,
                capacity: phone.capacity,
                color: phone.color,
                condition: phone.condition,
                battery_health: phone.batteryHealth,
                price: phone.price,
                status: phone.status,
                image_url: phone.imageUrl,
                sale_details: phone.saleDetails
            })
            .eq('id', phone.id);

        if (error) throw error;
        return phone;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('phones')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
