import { supabase, handleSupabaseResponse } from '../lib/supabaseClient';

/**
 * Acesso à tabela `system_settings` (chave/valor de configurações globais:
 * logo, janelas de logo temporária, etc.). Centraliza `.from('system_settings')`
 * de AdminSettings, AdminLogin e useSystemSettings (A1).
 */
export const systemSettingsService = {
    async getAll(): Promise<{ key: string; value: any }[]> {
        const response = await supabase.from('system_settings').select('key, value');
        return handleSupabaseResponse(response) || [];
    },

    async getByKeys(keys: string[]): Promise<{ key: string; value: any }[]> {
        const response = await supabase.from('system_settings').select('key, value').in('key', keys);
        return handleSupabaseResponse(response) || [];
    },

    async upsert(updates: { key: string; value: any }[]): Promise<void> {
        handleSupabaseResponse(await supabase.from('system_settings').upsert(updates));
    },
};
