import { supabase } from '../lib/supabaseClient';
import { Maintenance, MaintenanceStatus } from '../types';

export const maintenanceService = {
    async getAll(userId?: string): Promise<Maintenance[]> {
        const { data: { user } } = await supabase.auth.getUser();
        const targetUserId = userId || user?.id;

        const { data, error } = await supabase
            .from('maintenances')
            .select('*')
            .eq('user_id', targetUserId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(row => ({
            id: row.id,
            clientName: row.client_name,
            clientPhone: row.client_phone,
            deviceModel: row.device_model,
            deviceImei: row.device_imei,
            problemDescription: row.problem_description,
            estimatedPrice: row.estimated_price,
            status: row.status as MaintenanceStatus,
            notes: row.notes,
            createdAt: row.created_at
        }));
    },

    async create(maintenance: Omit<Maintenance, 'id' | 'createdAt'>): Promise<Maintenance> {
        const { data: { user } } = await supabase.auth.getUser();

        const { data, error } = await supabase
            .from('maintenances')
            .insert({
                user_id: user?.id,
                client_name: maintenance.clientName,
                client_phone: maintenance.clientPhone,
                device_model: maintenance.deviceModel,
                device_imei: maintenance.deviceImei,
                problem_description: maintenance.problemDescription,
                estimated_price: maintenance.estimatedPrice,
                status: maintenance.status,
                notes: maintenance.notes
            })
            .select()
            .single();

        if (error) throw error;
        return {
            ...maintenance,
            id: data.id,
            createdAt: data.created_at
        } as Maintenance;
    },

    async update(maintenance: Maintenance): Promise<Maintenance> {
        const { error } = await supabase
            .from('maintenances')
            .update({
                client_name: maintenance.clientName,
                client_phone: maintenance.clientPhone,
                device_model: maintenance.deviceModel,
                device_imei: maintenance.deviceImei,
                problem_description: maintenance.problemDescription,
                estimated_price: maintenance.estimatedPrice,
                status: maintenance.status,
                notes: maintenance.notes
            })
            .eq('id', maintenance.id);

        if (error) throw error;
        return maintenance;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('maintenances')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
