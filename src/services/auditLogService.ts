import { supabase, handleSupabaseResponse } from '../lib/supabaseClient';

export interface AuditLogEntry {
  id?: string;
  admin_id: string;
  action: 'create' | 'update' | 'delete' | 'export' | 'impersonate';
  resource_type: 'user' | 'lead' | 'vehicle' | 'sale' | 'plan';
  resource_id: string;
  resource_name?: string;
  changes?: Record<string, any> | null;
  ip_address?: string;
  created_at?: string;
}

export const auditLogService = {
  async logAction(
    action: AuditLogEntry['action'],
    resourceType: AuditLogEntry['resource_type'],
    resourceId: string,
    resourceName?: string,
    changes?: Record<string, any>
  ) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        console.warn('No active session for audit log');
        return;
      }

      const entry: AuditLogEntry = {
        admin_id: session.user.id,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        resource_name: resourceName,
        changes: changes || null,
      };

      const response = await supabase
        .from('admin_audit_logs')
        .insert([entry]);

      handleSupabaseResponse(response);
    } catch (err) {
      console.error('Audit log service error:', err);
    }
  },

  async getAuditLogs(
    filters?: {
      action?: string;
      resourceType?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
    }
  ) {
    let query = supabase
      .from('admin_audit_logs')
      .select('*, admin:admin_id(full_name, email)')
      .order('created_at', { ascending: false });

    if (filters?.action) {
      query = query.eq('action', filters.action);
    }

    if (filters?.resourceType) {
      query = query.eq('resource_type', filters.resourceType);
    }

    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const limit = filters?.limit || 100;
    query = query.limit(limit);

    const response = await query;
    return handleSupabaseResponse(response) || [];
  },

  async getUserAuditLogs(userId: string, limit = 50) {
    const response = await supabase
      .from('admin_audit_logs')
      .select('*')
      .eq('resource_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return handleSupabaseResponse(response) || [];
  },

  getActionLabel(action: string): string {
    const labels: Record<string, string> = {
      create: 'Criado',
      update: 'Atualizado',
      delete: 'Deletado',
      export: 'Exportado',
      impersonate: 'Impersonado',
    };
    return labels[action] || action;
  },

  getResourceTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      user: 'Usuário',
      lead: 'Lead',
      vehicle: 'Veículo',
      sale: 'Venda',
      plan: 'Plano',
    };
    return labels[type] || type;
  },
};
