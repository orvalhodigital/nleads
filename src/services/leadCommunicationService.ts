import { supabase } from '../lib/supabaseClient';

/**
 * Acesso à tabela `lead_communications` (registro de mensagens enviadas a leads).
 * Centraliza os `.from('lead_communications')` de LeadDetailPage/Inventory/
 * MotorcycleInventory (A1).
 */
export const leadCommunicationService = {
    /** Insere sem retornar a linha (quando o chamador não precisa do id). */
    async insert(record: Record<string, any>): Promise<void> {
        const { error } = await supabase.from('lead_communications').insert(record);
        if (error) throw error;
    },

    /** Insere e retorna `{ id }` (para casos que usam o id no webhook n8n). */
    async create(record: Record<string, any>): Promise<{ id: string }> {
        const { data, error } = await supabase
            .from('lead_communications')
            .insert(record)
            .select('id')
            .single();
        if (error) throw error;
        return data as { id: string };
    },

    async listByVehicle(vehicleId: string): Promise<any[]> {
        const { data } = await supabase
            .from('lead_communications')
            .select('*')
            .eq('vehicle_id', vehicleId);
        return data || [];
    },
};
