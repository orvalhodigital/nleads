import { supabase } from '../lib/supabaseClient';

export interface AdminDashboardStats {
    totalUsers: number;
    activeUsers: number;
    proUsers: number;
    totalLeads: number;
    qualifiedLeads: number;
    totalVehicles: number;
    vehiclesInStock: number;
    completedLeads: number;
    openTickets: number;
}

/**
 * Acesso a dados transversais do Painel Admin (exclusão de lojistas, contagens
 * do dashboard). Centraliza `.from()` diretos de AdminUsers/AdminDashboard (A1).
 * RLS restringe estas operações a admin.
 */
export const adminService = {
    async deleteUser(id: string): Promise<void> {
        const { error } = await supabase.from('profiles').delete().eq('id', id);
        if (error) throw error;
    },

    async deleteUsers(ids: string[]): Promise<void> {
        const { error } = await supabase.from('profiles').delete().in('id', ids);
        if (error) throw error;
    },

    // Troca a senha de um lojista. A RPC valida internamente que o chamador é
    // admin (achado A24). RLS/SECURITY DEFINER fazem a checagem.
    async updateUserPassword(targetUserId: string, newPassword: string): Promise<void> {
        const { error } = await supabase.rpc('admin_update_user_password', {
            target_user_id: targetUserId,
            new_password: newPassword,
        });
        if (error) throw error;
    },

    /** Papel do perfil (para gate de admin). null se não existir / erro. */
    async getProfileRole(userId: string): Promise<{ role: string } | null> {
        const { data } = await supabase.from('profiles').select('role').eq('id', userId).single();
        return data ? { role: data.role } : null;
    },

    /** Lista perfis por papel (ex.: 'user' para a tela de onboarding). */
    async listUsersByRole(role: string): Promise<any[]> {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', role)
            .order('created_at', { ascending: false });
        return data || [];
    },

    /** Leads (com dono e veículo) para o painel de vendas do admin. */
    async getSalesLeads(): Promise<any[]> {
        const { data, error } = await supabase
            .from('leads')
            .select(`
                *,
                profiles:user_id(full_name),
                vehicles:vehicle_id(brand, model)
            `)
            .not('phase', 'is', null)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    /** Veículos vendidos (fonte de receita) para o painel de vendas do admin. */
    async getSoldVehicles(): Promise<any[]> {
        const { data, error } = await supabase
            .from('vehicles')
            .select('sale_details, created_at')
            .eq('status', 'sold');
        if (error) throw error;
        return data || [];
    },

    /** Destinatários de uma transmissão. Sem filtro = todos; com plano = filtra. */
    async getBroadcastRecipients(planFilter?: string): Promise<any[]> {
        let query = supabase.from('profiles').select('id, full_name, email, plan, role');
        if (planFilter && planFilter !== 'all') {
            query = query.eq('plan', planFilter);
        }
        const { data } = await query;
        return data || [];
    },

    async getDashboardStats(): Promise<AdminDashboardStats> {
        const count = (table: string) => supabase.from(table).select('id', { count: 'exact', head: true });
        const [
            usersRes, activeUsersRes, proUsersRes, leadsRes, qualifiedLeadsRes,
            vehiclesRes, vehiclesInStockRes, completedLeadsRes, ticketsRes,
        ] = await Promise.all([
            count('profiles'),
            count('profiles').eq('plan_status', 'active'),
            count('profiles').eq('plan', 'pro'),
            count('leads'),
            // `.not('phase','in','(...)')` é a forma correta no supabase-js.
            count('leads').not('phase', 'in', '("Novo Lead","Compradores","Desqualificados")'),
            count('vehicles'),
            count('vehicles').eq('status', 'available'),
            count('leads').eq('phase', 'Compradores'),
            count('support_tickets').in('status', ['open', 'in_progress']),
        ]);
        return {
            totalUsers: usersRes.count || 0,
            activeUsers: activeUsersRes.count || 0,
            proUsers: proUsersRes.count || 0,
            totalLeads: leadsRes.count || 0,
            qualifiedLeads: qualifiedLeadsRes.count || 0,
            totalVehicles: vehiclesRes.count || 0,
            vehiclesInStock: vehiclesInStockRes.count || 0,
            completedLeads: completedLeadsRes.count || 0,
            openTickets: ticketsRes.count || 0,
        };
    },
};
