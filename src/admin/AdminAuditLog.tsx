import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { AlertCircle, Search, Filter } from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  admin_id: string;
  admin_email?: string;
  changes?: any;
  created_at: string;
}

export default function AdminAuditLog() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [resourceFilter, setResourceFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  const actions = ['all', 'create', 'update', 'delete', 'export'];
  const resources = ['all', 'lead', 'vehicle', 'user', 'plan', 'campaign', 'ticket'];

  useEffect(() => {
    fetchLogs();
    // Refresh logs every 30 seconds
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch from admin_audit_logs if it exists, otherwise return empty
      const { data, error: err } = await supabase
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500)
        .catch(() => ({ data: null, error: 'Table not found' }));

      if (err && err !== 'Table not found') {
        throw err;
      }

      // For now, if table doesn't exist, show placeholder
      setLogs(data || []);
    } catch (err) {
      console.error('Error fetching logs:', err);
      // Don't show error if table doesn't exist yet - it's expected
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      (log.resource_id?.includes(searchTerm)) ||
      (log.admin_email?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesResource = resourceFilter === 'all' || log.resource_type === resourceFilter;
    return matchesSearch && matchesAction && matchesResource;
  });

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'bg-emerald-100 text-emerald-700';
      case 'update':
        return 'bg-blue-100 text-blue-700';
      case 'delete':
        return 'bg-red-100 text-red-700';
      case 'export':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-8 animate-fadeUp">
      <header>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Audit Log</h1>
        <p className="text-slate-500 font-bold text-sm mt-1">Rastreamento de todas as ações administrativas.</p>
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="text-red-600" size={20} />
          <p className="text-red-800 font-medium">{error}</p>
        </div>
      )}

      {logs.length === 0 && !loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="text-blue-600" size={20} />
          <p className="text-blue-800 font-medium">
            A tabela de audit log ainda não foi criada no banco de dados. Configure via migrations do Supabase.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por ID ou email do admin..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
        >
          <option value="all">Todas as ações</option>
          {actions.filter(a => a !== 'all').map(action => (
            <option key={action} value={action}>
              {action.charAt(0).toUpperCase() + action.slice(1)}
            </option>
          ))}
        </select>

        <select
          value={resourceFilter}
          onChange={e => setResourceFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
        >
          <option value="all">Todos os recursos</option>
          {resources.filter(r => r !== 'all').map(resource => (
            <option key={resource} value={resource}>
              {resource.charAt(0).toUpperCase() + resource.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400">Carregando audit log...</div>
      ) : filteredLogs.length === 0 && logs.length > 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <AlertCircle className="mx-auto text-slate-300 mb-4" size={48} />
          <p className="text-slate-400 font-bold">Nenhum registro encontrado com esses filtros.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    Quando
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    Admin
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    Ação
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    Recurso
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    ID do Recurso
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    Detalhes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {log.created_at
                          ? new Date(log.created_at).toLocaleString('pt-BR')
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {log.admin_email || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900 capitalize">
                        {log.resource_type}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 font-mono text-[11px]">
                        {log.resource_id?.slice(0, 12)}...
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {log.changes ? (
                          <details className="cursor-pointer">
                            <summary className="font-medium text-slate-600">Ver mudanças</summary>
                            <pre className="text-[10px] mt-2 bg-slate-50 p-2 rounded overflow-auto max-h-32">
                              {JSON.stringify(log.changes, null, 2)}
                            </pre>
                          </details>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      Nenhum log registrado ainda. As ações administrativas aparecerão aqui.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
