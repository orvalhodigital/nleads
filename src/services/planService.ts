import { supabase } from '../lib/supabaseClient';
import { Profile } from '../types';

export const planService = {
  // Free plan limits
  FREE_PLAN_LIMITS: {
    maxVehicles: 10,
    maxLeads: 50,
    maxMotorcycles: 10,
  },

  async getUserStats(userId: string) {
    try {
      const [vehiclesRes, leadsRes, motorcyclesRes] = await Promise.all([
        supabase.from('vehicles').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('leads').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('motorcycles').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      ]);

      return {
        vehicleCount: vehiclesRes.count || 0,
        leadCount: leadsRes.count || 0,
        motorcycleCount: motorcyclesRes.count || 0,
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return { vehicleCount: 0, leadCount: 0, motorcycleCount: 0 };
    }
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

  getUpgradeStripeUrl(): string {
    return 'https://buy.stripe.com/dRm9AT0wEe5s93G0DY4ZG00';
  },

  async getUpgradeLink(email: string): Promise<string> {
    const baseUrl = this.getUpgradeStripeUrl();
    return `${baseUrl}?prefilled_email=${encodeURIComponent(email)}`;
  },

  async getAsaasUpgradeLink(userId: string, planId: string): Promise<string> {
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
      body: JSON.stringify({ userId, planId }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Erro ao gerar pagamento no Asaas');
    }

    const data = await response.json();
    return data.invoiceUrl;
  },
};
