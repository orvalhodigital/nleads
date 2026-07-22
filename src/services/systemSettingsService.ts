import { supabase } from '../lib/supabaseClient';

/**
 * Acesso à tabela `system_settings` (chave/valor de configurações globais:
 * logo, janelas de logo temporária, etc.). Centraliza `.from('system_settings')`
 * de AdminSettings, AdminLogin e useSystemSettings (A1).
 */
export const systemSettingsService = {
    async getAll(): Promise<{ key: string; value: any }[]> {
        const { data } = await supabase.from('system_settings').select('key, value');
        return data || [];
    },

    async getByKeys(keys: string[]): Promise<{ key: string; value: any }[]> {
        const { data } = await supabase.from('system_settings').select('key, value').in('key', keys);
        return data || [];
    },

    async upsert(updates: { key: string; value: any }[]): Promise<void> {
        const { error } = await supabase.from('system_settings').upsert(updates);
        if (error) throw error;
    },
};
