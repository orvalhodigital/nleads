import { supabase, handleSupabaseResponse } from '../lib/supabaseClient';
import { Lead, LeadPhase, LeadTemperature, InteractionHistory, MarketingMetadata } from '../types';

const mapRowToLead = (row: any): Lead => ({
    id: row.id,
    name: row.name || '',
    phone: row.phone || '',
    email: row.email || '',
    phase: row.phase as LeadPhase,
    temperature: row.temperature as LeadTemperature,
    preferences: {
        interesse_carro: row.interesse_carro ?? true,
        interesse_moto: row.interesse_moto ?? false,
        tipos_veiculo: row.tipos_veiculo || [],
        tipos_moto: row.tipos_moto || [],
        valor_minimo: row.valor_minimo,
        valor_maximo: row.valor_maximo,
        carro_valor_min: row.carro_valor_min,
        carro_valor_max: row.carro_valormax,
        carro_transmissao: row.carro_transmissao || [],
        carro_motorizacao: row.carro_motorizacao || [],
        moto_valor_min: row.moto_valor_min,
        moto_valor_max: row.moto__valormax,
        moto_transmissao: row.moto_transmissao || [],
        moto_motorizacao: row.moto_motorizacao || [],
        marcas: row.marcas || [],
        modelos: row.modelos || [],
        marcas_moto: row.marcas_moto || [],
        modelos_moto: row.modelos_moto || [],
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
    marketing_metadata: row.marketing_metadata as MarketingMetadata | undefined,
    interaction_history: row.interaction_history as InteractionHistory[] || [],
    // is_buyer é armazenado dentro do JSONB follow_up_data para evitar problemas de cache do PostgREST
    is_buyer: row.follow_up_data?.is_buyer || false,
    foto_url: row.foto_url || undefined,
    user_id: row.user_id || undefined,
    admin_id: row.admin_id || undefined,
    saleStatus: row.sale_status || undefined,
    saleDate: row.sale_date || undefined,
    deliveryDate: row.delivery_date || undefined,
    guaranteeId: row.guarantee_id || undefined,
    guaranteeEndsAt: row.guarantee_ends_at || undefined,
    postSaleNotes: row.post_sale_notes || undefined,
});

export const leadService = {
    /**
     * Lista leads com contexto multi-usuário:
     * - isAdminContext=true + adminId: empresa vê todos os leads da equipe (admin_id = adminId)
     * - userId fornecido: vendedor vê apenas os seus (user_id = userId)
     * - fallback: usuário logado vê os seus
     */
    async list(userId?: string, adminId?: string, isAdminContext: boolean = false, limit: number = 50, offset: number = 0): Promise<Lead[]> {
        const { data: { user } } = await supabase.auth.getUser();

        let query = supabase
            .from('leads')
            .select('*')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (isAdminContext && adminId) {
            query = query.eq('admin_id', adminId);
        } else {
            const targetUserId = userId || user?.id;
            query = query.eq('user_id', targetUserId);
        }

        const response = await query;
        const data = handleSupabaseResponse(response);
        return (data || []).map(mapRowToLead);
    },

    async getAll(userId?: string, adminId?: string, isAdminContext: boolean = false): Promise<Lead[]> {
        return this.list(userId, adminId, isAdminContext, 200, 0);
    },

    async search(query: string, userId?: string, adminId?: string, limit: number = 20): Promise<Lead[]> {
        const { data: { user } } = await supabase.auth.getUser();

        let q = supabase
            .from('leads')
            .select('*')
            .ilike('name', `%${query}%`)
            .limit(limit);

        if (adminId) {
            q = q.eq('admin_id', adminId);
        } else {
            q = q.eq('user_id', userId || user?.id);
        }

        const response = await q;
        const data = handleSupabaseResponse(response);
        return (data || []).map(mapRowToLead);
    },

    async create(lead: Omit<Lead, 'id' | 'createdAt' | 'lastUpdate'>): Promise<Lead> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado ou sessão expirada.');

        const response = await supabase
            .from('leads')
            .insert({
                user_id: lead.user_id || user.id,
                admin_id: lead.admin_id || null,
                name: lead.name,
                phone: lead.phone,
                email: lead.email,
                phase: lead.phase,
                temperature: lead.temperature,
                interesse_carro: lead.preferences.interesse_carro,
                interesse_moto: lead.preferences.interesse_moto,
                tipos_veiculo: lead.preferences.tipos_veiculo,
                tipos_moto: lead.preferences.tipos_moto,
                valor_minimo: lead.preferences.valor_minimo,
                valor_maximo: lead.preferences.valor_maximo,
                carro_valor_min: lead.preferences.carro_valor_min,
                carro_valormax: lead.preferences.carro_valor_max,
                carro_transmissao: lead.preferences.carro_transmissao,
                carro_motorizacao: lead.preferences.carro_motorizacao,
                moto_valor_min: lead.preferences.moto_valor_min,
                moto__valormax: lead.preferences.moto_valor_max,
                moto_transmissao: lead.preferences.moto_transmissao,
                moto_motorizacao: lead.preferences.moto_motorizacao,
                marcas: lead.preferences.marcas,
                modelos: lead.preferences.modelos,
                marcas_moto: lead.preferences.marcas_moto,
                modelos_moto: lead.preferences.modelos_moto,
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
                marketing_metadata: lead.marketing_metadata || null,
                interaction_history: lead.interaction_history || [],
                // is_buyer armazenado dentro do JSONB follow_up_data
                follow_up_data: { ...(lead.follow_up_data || {}), is_buyer: lead.is_buyer || false },
                sale_status: lead.saleStatus || null,
                sale_date: lead.saleDate || null,
                delivery_date: lead.deliveryDate || null,
                guarantee_id: lead.guaranteeId || null,
                guarantee_ends_at: lead.guaranteeEndsAt || null,
                post_sale_notes: lead.postSaleNotes || null,
            })
            .select()
            .single();

        const data = handleSupabaseResponse(response);
        if (!data) throw new Error('Falha ao criar lead.');
        return mapRowToLead(data);
    },

    async update(lead: Lead): Promise<Lead> {
        const response = await supabase
            .from('leads')
            .update({
                name: lead.name,
                phone: lead.phone,
                email: lead.email,
                phase: lead.phase,
                temperature: lead.temperature,
                interesse_carro: lead.preferences.interesse_carro,
                interesse_moto: lead.preferences.interesse_moto,
                tipos_veiculo: lead.preferences.tipos_veiculo,
                tipos_moto: lead.preferences.tipos_moto,
                valor_minimo: lead.preferences.valor_minimo,
                valor_maximo: lead.preferences.valor_maximo,
                carro_valor_min: lead.preferences.carro_valor_min,
                carro_valormax: lead.preferences.carro_valor_max,
                carro_transmissao: lead.preferences.carro_transmissao,
                carro_motorizacao: lead.preferences.carro_motorizacao,
                moto_valor_min: lead.preferences.moto_valor_min,
                moto__valormax: lead.preferences.moto_valor_max,
                moto_transmissao: lead.preferences.moto_transmissao,
                moto_motorizacao: lead.preferences.moto_motorizacao,
                marcas: lead.preferences.marcas,
                modelos: lead.preferences.modelos,
                marcas_moto: lead.preferences.marcas_moto,
                modelos_moto: lead.preferences.modelos_moto,
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
                marketing_metadata: lead.marketing_metadata || null,
                interaction_history: lead.interaction_history || [],
                // is_buyer armazenado dentro do JSONB follow_up_data
                follow_up_data: { ...(lead.follow_up_data || {}), is_buyer: lead.is_buyer || false },
                sale_status: lead.saleStatus || null,
                sale_date: lead.saleDate || null,
                delivery_date: lead.deliveryDate || null,
                guarantee_id: lead.guaranteeId || null,
                guarantee_ends_at: lead.guaranteeEndsAt || null,
                post_sale_notes: lead.postSaleNotes || null,
            })
            .eq('id', lead.id)
            .select()
            .single();

        const data = handleSupabaseResponse(response);
        if (!data) throw new Error('Falha ao atualizar lead.');
        return mapRowToLead(data);
    },

    async delete(id: string): Promise<void> {
        const response = await supabase
            .from('leads')
            .delete()
            .eq('id', id);

        handleSupabaseResponse(response);
    },

    async addInteraction(leadId: string, interaction: Omit<InteractionHistory, 'id'>): Promise<Lead> {
        const newInteraction: InteractionHistory = {
            ...interaction,
            id: crypto.randomUUID()
        };

        const response = await supabase
            .rpc('append_lead_interaction', {
                p_lead_id: leadId,
                p_interaction: newInteraction,
            });

        const updatedData = handleSupabaseResponse(response);
        if (!updatedData) throw new Error('Falha ao atualizar o histórico de interações.');
        
        return mapRowToLead(updatedData);
    }
};
