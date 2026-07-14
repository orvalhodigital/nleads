import React, { useEffect, useState } from 'react';
import { auditLogService } from '../services/auditLogService';
import { AlertCircle, Filter } from 'lucide-react';

interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  resource_name?: string;
  changes?: Record<string, any>;
  created_at: string;
  admin?: {
    full_name: string;
    email: string;
  };
}

export default function AdminAuditLog() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [resourceFilter, setResourceFilter] = useState<string>('all');

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, resourceFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const filters: any = { limit: 100 };
      if (actionFilter !== 'all') filters.action = actionFilter;
      if (resourceFilter !== 'all') filters.resourceType = resourceFilter;

      const data = await auditLogService.getAuditLogs(filters);
      setLogs(data as AuditLog[]);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'bg-brand-100 text-brand-700';
      case 'update':
        return 'bg-blue-100 text-blue-700';
      case 'delete':
        return 'bg-red-100 text-red-700';
      case 'export':
        return 'bg-amber-100 text-amber-700';
      case 'impersonate':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-8 animate-fadeUp">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Audit Log</h1>
          <p className="text-slate-500 font-bold text-sm mt-1">Rastreie todas as ações administrativas realizadas no sistema.</p>
        </div>
        <div className="px-4 py-2 bg-white rounded-lg shadow-sm border text-sm font-medium text-slate-600">
          Total: {logs.length}
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4">
        <div className="relative flex-1 max-w-xs">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
          >
            <option value="all">Todas as ações</option>
            <option value="create">Criado</option>
            <option value="update">Atualizado</option>
            <option value="delete">Deletado</option>
            <option value="export">Exportado</option>
            <option value="impersonate">Impersonado</option>
          </select>
        </div>

        <select
          value={resourceFilter}
          onChange={(e) => setResourceFilter(e.target.value)}
          className="px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
        >
          <option value="all">Todos os recursos</option>
          <option value="user">Usuário</option>
          <option value="lead">Lead</option>
          <option value="vehicle">Veículo</option>
          <option value="sale">Venda</option>
          <option value="plan">Plano</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400">Carregando audit logs...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-20">
          <AlertCircle className="mx-auto text-slate-300 mb-4" size={48} />
          <p className="text-slate-400 font-bold">Nenhum audit log encontrado.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-400 tracking-widest">Admin</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-400 tracking-widest">Ação</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-400 tracking-widest">Recurso</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-400 tracking-widest">Alvo</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-400 tracking-widest">Data & Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 text-sm">{log.admin?.full_name || 'N/A'}</div>
                      <div className="text-xs text-slate-400">{log.admin?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getActionColor(log.action)}`}>
                        {auditLogService.getActionLabel(log.action)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-900">
                        {auditLogService.getResourceTypeLabel(log.resource_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-900">{log.resource_name || log.resource_id}</div>
                      {log.changes && (
                        <div className="text-xs text-slate-500 mt-1">
                          {Object.keys(log.changes).join(', ')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400 whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
