import { supabase } from '../lib/supabaseClient';
import { Lead, LeadPhase, LeadTemperature, VisitStatus, VehicleType, TransmissionType, EngineType } from '../types';

const mapRowToLead = (row: any): Lead => ({
    id: row.id,
    name: row.name || '',
    phone: row.phone || '',
    email: row.email || '',
    phase: row.phase as LeadPhase,
    temperature: row.temperature as LeadTemperature,
    preferences: {
        tipos_veiculo: row.tipos_veiculo || [],
        valor_minimo: row.valor_minimo,
        valor_maximo: row.valor_maximo,
        marcas: row.marcas || [],
        modelos: row.modelos || [],
        transmissao: row.transmissao || [],
        motorizacao: row.motorizacao || [],
        observacoes_adicionais: row.observacoes_adicionais || '',
        possui_entrada: row.possui_entrada || false,
        valor_entrada: row.valor_entrada,
        possui_troca: row.possui_troca || false,
        veiculo_troca: row.veiculo_troca || ''
    },
    presentedVehicles: row.presented_vehicles || [],
    source: row.source || '',
    createdAt: row.created_at,
    lastUpdate: row.last_update || row.created_at,
    notes: row.notes || '',
    funnelHistory: row.funnel_history || {},
    disqualificationReasons: row.disqualification_reasons || [],
    disqualificationNotes: row.disqualification_notes || '',
    visit_date: row.visit_date || undefined,
    visit_status: (row.visit_status as any) || 'pending',
    tags: row.tags || [],
    scheduling_data: row.scheduling_data || {},
    simulation_data: row.simulation_data || {},
    follow_up_data: row.follow_up_data || {},
    // is_buyer é armazenado dentro do JSONB follow_up_data para evitar problemas de cache do PostgREST
    is_buyer: row.follow_up_data?.is_buyer || false,
    foto_url: row.foto_url || undefined
});

export const leadService = {
    async list(userId?: string): Promise<Lead[]> {
        const { data: { user } } = await supabase.auth.getUser();
        const targetUserId = userId || user?.id;

        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .eq('user_id', targetUserId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(mapRowToLead);
    },

    async getAll(userId?: string): Promise<Lead[]> {
        return this.list(userId);
    },

    async search(query: string, userId?: string): Promise<Lead[]> {
        const { data: { user } } = await supabase.auth.getUser();
        const targetUserId = userId || user?.id;

        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .eq('user_id', targetUserId)
            .ilike('name', `%${query}%`)
            .limit(10);

        if (error) throw error;
        return (data || []).map(mapRowToLead);
    },

    async create(lead: Omit<Lead, 'id' | 'createdAt' | 'lastUpdate'>): Promise<Lead> {
        const { data, error } = await supabase
            .from('leads')
            .insert({
                name: lead.name,
                phone: lead.phone,
                email: lead.email,
                phase: lead.phase,
                temperature: lead.temperature,
                tipos_veiculo: lead.preferences.tipos_veiculo,
                valor_minimo: lead.preferences.valor_minimo,
                valor_maximo: lead.preferences.valor_maximo,
                marcas: lead.preferences.marcas,
                modelos: lead.preferences.modelos,
                transmissao: lead.preferences.transmissao,
                motorizacao: lead.preferences.motorizacao,
                observacoes_adicionais: lead.preferences.observacoes_adicionais,
                possui_entrada: lead.preferences.possui_entrada,
                valor_entrada: lead.preferences.valor_entrada,
                possui_troca: lead.preferences.possui_troca,
                veiculo_troca: lead.preferences.veiculo_troca,
                presented_vehicles: lead.presentedVehicles,
                source: lead.source,
                notes: lead.notes,
                funnel_history: lead.funnelHistory || {},
                disqualification_reasons: lead.disqualificationReasons,
                disqualification_notes: lead.disqualificationNotes,
                foto_url: lead.foto_url,
                visit_date: lead.visit_date,
                visit_status: lead.visit_status,
                tags: lead.tags,
                scheduling_data: lead.scheduling_data || {},
                simulation_data: lead.simulation_data || {},
                // is_buyer armazenado dentro do JSONB follow_up_data
                follow_up_data: { ...(lead.follow_up_data || {}), is_buyer: lead.is_buyer || false },
            })
            .select()
            .single();

        if (error) throw error;
        return mapRowToLead(data);
    },

    async update(lead: Lead): Promise<Lead> {
        const { data, error } = await supabase
            .from('leads')
            .update({
                name: lead.name,
                phone: lead.phone,
                email: lead.email,
                phase: lead.phase,
                temperature: lead.temperature,
                tipos_veiculo: lead.preferences.tipos_veiculo,
                valor_minimo: lead.preferences.valor_minimo,
                valor_maximo: lead.preferences.valor_maximo,
                marcas: lead.preferences.marcas,
                modelos: lead.preferences.modelos,
                transmissao: lead.preferences.transmissao,
                motorizacao: lead.preferences.motorizacao,
                observacoes_adicionais: lead.preferences.observacoes_adicionais,
                possui_entrada: lead.preferences.possui_entrada,
                valor_entrada: lead.preferences.valor_entrada,
                possui_troca: lead.preferences.possui_troca,
                veiculo_troca: lead.preferences.veiculo_troca,
                presented_vehicles: lead.presentedVehicles,
                source: lead.source,
                last_update: new Date().toISOString(),
                notes: lead.notes,
                funnel_history: lead.funnelHistory || {},
                disqualification_reasons: lead.disqualificationReasons,
                disqualification_notes: lead.disqualificationNotes,
                foto_url: lead.foto_url,
                visit_date: lead.visit_date,
                visit_status: lead.visit_status,
                tags: lead.tags,
                scheduling_data: lead.scheduling_data || {},
                simulation_data: lead.simulation_data || {},
                // is_buyer armazenado dentro do JSONB follow_up_data
                follow_up_data: { ...(lead.follow_up_data || {}), is_buyer: lead.is_buyer || false },
            })
            .eq('id', lead.id)
            .select()
            .single();

        if (error) throw error;
        return mapRowToLead(data);
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('leads')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
