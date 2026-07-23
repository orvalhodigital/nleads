import { supabase, handleSupabaseResponse } from '../lib/supabaseClient';
import { Profile } from '../types';

export const planService = {
  // Free plan limits
  FREE_PLAN_LIMITS: {
    maxVehicles: 10,
    maxLeads: 50,
    maxMotorcycles: 10,
  },

  // --- Admin: edição dos planos (tabela `plans`). RLS restringe a admin. ---
  async listPlans(): Promise<any[]> {
    const response = await supabase
      .from('plans')
      .select('*')
      .order('price', { ascending: true });
    return handleSupabaseResponse(response) || [];
  },

  async updatePlan(id: string, payload: Record<string, any>): Promise<void> {
    handleSupabaseResponse(await supabase.from('plans').update(payload).eq('id', id));
  },

  // Planos ativos, ordenados por preço — para exibir ao lojista.
  async listActivePlans(): Promise<any[]> {
    const response = await supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true });
    return handleSupabaseResponse(response) || [];
  },

  async getUserStats(userId: string) {
    const [vehiclesRes, leadsRes, motorcyclesRes] = await Promise.all([
      supabase.from('vehicles').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('leads').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('motorcycles').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    ]);

    handleSupabaseResponse(vehiclesRes);
    handleSupabaseResponse(leadsRes);
    handleSupabaseResponse(motorcyclesRes);

    return {
      vehicleCount: vehiclesRes.count || 0,
      leadCount: leadsRes.count || 0,
      motorcycleCount: motorcyclesRes.count || 0,
    };
  },

  canAddVehicle(plan: string, currentCount: number): boolean {
    if (plan === 'pro') return true;
    return currentCount < this.FREE_PLAN_LIMITS.maxVehicles;
  },

  canAddLead(plan: string, currentCount: number): boolean {
    if (plan === 'pro') return true;
    return currentCount < this.FREE_PLAN_LIMITS.maxLeads;
  },

  canAddMotorcycle(plan: string, currentCount: number): boolean {
    if (plan === 'pro') return true;
    return currentCount < this.FREE_PLAN_LIMITS.maxVehicles + this.FREE_PLAN_LIMITS.maxMotorcycles;
  },

  canAccessFeature(plan: string, feature: 'agenda' | 'sales-flow' | 'sales' | 'website'): boolean {
    return true;
  },

  // Removidos os métodos de upgrade via Stripe (link buy.stripe.com hardcoded):
  // este sistema cobra exclusivamente pelo Asaas. Um pagamento no Stripe iria
  // para uma conta desintegrada e o plano nunca ativaria (só o webhook do Asaas
  // ativa). Ver getAsaasUpgradeLink abaixo. Achado A47 (Fase 13).

  async getAsaasUpgradeLink(userId: string, planId: string, cpfCnpj?: string): Promise<string> {
    // Envia o token da sessão para o endpoint autenticar o chamador.
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;
    if (!accessToken) {
      throw new Error('Sessão expirada. Faça login novamente para prosseguir com o upgrade.');
    }

    const response = await fetch('/api/create-asaas-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ userId, planId, cpfCnpj }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      // Sinaliza para a UI pedir o CPF/CNPJ, em vez de só mostrar erro.
      if (errData.needsCpfCnpj) {
        const e: any = new Error(errData.detail || 'CPF/CNPJ obrigatório');
        e.needsCpfCnpj = true;
        throw e;
      }
      const msg = errData.detail ? `${errData.error} — ${errData.detail}` : (errData.error || 'Erro ao gerar pagamento no Asaas');
      throw new Error(msg);
    }

    const data = await response.json();
    return data.invoiceUrl;
  },

  async getAsaasBillingPortalLink(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;
    if (!accessToken) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    const response = await fetch('/api/get-asaas-billing-portal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Erro ao recuperar portal de faturamento.');
    }

    const data = await response.json();
    return data.invoiceUrl;
  },
};
