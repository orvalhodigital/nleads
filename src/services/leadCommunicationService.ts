import { supabase, handleSupabaseResponse } from '../lib/supabaseClient';

/**
 * Acesso à tabela `lead_communications` (registro de mensagens enviadas a leads).
 * Centraliza os `.from('lead_communications')` de LeadDetailPage/Inventory/
 * MotorcycleInventory (A1).
 */
export const leadCommunicationService = {
    /** Insere sem retornar a linha (quando o chamador não precisa do id). */
    async insert(record: Record<string, any>): Promise<void> {
        handleSupabaseResponse(await supabase.from('lead_communications').insert(record));
    },

    /** Insere e retorna `{ id }` (para casos que usam o id no webhook n8n). */
    async create(record: Record<string, any>): Promise<{ id: string }> {
        const response = await supabase
            .from('lead_communications')
            .insert(record)
            .select('id')
            .single();
        return handleSupabaseResponse(response) as { id: string };
    },

    async listByVehicle(vehicleId: string): Promise<any[]> {
        const response = await supabase
            .from('lead_communications')
            .select('*')
            .eq('vehicle_id', vehicleId);
        return handleSupabaseResponse(response) || [];
    },
};
