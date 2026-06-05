import React, { useState, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Lead } from '../types';
import { Search, Trash2, AlertCircle } from 'lucide-react';
import { useAdminTable } from '../hooks/useAdminTable';
import { useDebounce } from '../hooks/useDebounce';
import { useAdminToast } from '../hooks/useAdminToast';
import { ToastContainer } from '../components/admin/AdminToast';
import { AdminPagination } from '../components/admin/AdminPagination';

interface LeadWithUser extends Lead {
  user_name?: string;
  user_email?: string;
}

export default function AdminLeads() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const debouncedSearch = useDebounce(searchTerm, 300);
  const { toasts, removeToast, success, error: showError } = useAdminToast();

  const {
    data: leads,
    loading,
    error,
    currentPage,
    totalPages,
    totalCount,
    pageSize,
    hasNextPage,
    hasPreviousPage,
    setCurrentPage,
    refetch,
    goToNextPage,
    goToPreviousPage,
  } = useAdminTable('leads', '*, profiles:user_id(full_name, email)', {
    pageSize: 50,
    orderBy: 'created_at',
    orderDirection: 'desc',
  });

  const statuses = ['all', 'novo', 'qualificado', 'em-contato', 'perdido'];

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch =
        (lead.name?.toLowerCase() || '').includes(debouncedSearch.toLowerCase()) ||
        (lead.phone?.includes(debouncedSearch)) ||
        (lead.email?.toLowerCase() || '').includes(debouncedSearch.toLowerCase());
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [leads, debouncedSearch, statusFilter]);

  const handleDeleteLead = async (id: string, name: string) => {
    if (!window.confirm(`Deletar "${name}"? Esta ação é irreversível.`)) return;

    setDeleting(true);
    try {
      const { error: err } = await supabase.from('leads').delete().eq('id', id);
      if (err) throw err;
      success(`Lead "${name}" deletado com sucesso.`);
      refetch();
    } catch (err) {
      console.error('Error deleting lead:', err);
      showError('Erro ao deletar lead. Tente novamente.');
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedLeads.size === 0) return;
    if (!window.confirm(`Deletar ${selectedLeads.size} lead(s)? Esta ação é irreversível.`)) return;

    setDeleting(true);
    try {
      const { error: err } = await supabase
        .from('leads')
        .delete()
        .in('id', Array.from(selectedLeads));

      if (err) throw err;
      success(`${selectedLeads.size} lead(s) deletado(s) com sucesso.`);
      setSelectedLeads(new Set());
      refetch();
    } catch (err) {
      console.error('Error bulk deleting:', err);
      showError('Erro ao deletar leads. Tente novamente.');
    } finally {
      setDeleting(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedLeads.size === filteredLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(filteredLeads.map(l => l.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelection = new Set(selectedLeads);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedLeads(newSelection);
  };

  return (
    <div className="space-y-8 animate-fadeUp">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gerenciamento de Leads</h1>
          <p className="text-slate-500 font-bold text-sm mt-1">Visualize, edite e delete leads de todas as lojas.</p>
        </div>
        <div className="px-4 py-2 bg-white rounded-lg shadow-sm border text-sm font-medium text-slate-600">
          Total: {totalCount}
        </div>
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="text-red-600" size={20} />
          <p className="text-red-800 font-medium">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome, email ou telefone..."
            className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
        >
          <option value="all">Todos os status</option>
          {statuses.filter(s => s !== 'all').map(status => (
            <option key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>

        {selectedLeads.size > 0 && (
          <button
            onClick={handleBulkDelete}
            disabled={deleting}
            className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-bold flex items-center gap-2"
          >
            <Trash2 size={16} />
            Deletar {selectedLeads.size}
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400">Carregando leads...</div>
      ) : filteredLeads.length === 0 ? (
        <div className="text-center py-20">
          <AlertCircle className="mx-auto text-slate-300 mb-4" size={48} />
          <p className="text-slate-400 font-bold">Nenhum lead encontrado com esses filtros.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedLeads.size === filteredLeads.length && filteredLeads.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-400 tracking-widest">Lead</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-400 tracking-widest">Usuário</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-400 tracking-widest">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-400 tracking-widest">Fase</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-400 tracking-widest">Criado</th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase text-slate-400 tracking-widest">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.map(lead => (
                  <tr key={lead.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedLeads.has(lead.id)}
                        onChange={() => toggleSelect(lead.id)}
                        className="w-4 h-4 rounded cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{lead.name || 'Sem nome'}</div>
                      <div className="text-sm text-slate-500">{lead.email || lead.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 text-sm">{lead.user_name || 'N/A'}</div>
                      <div className="text-xs text-slate-400">{lead.user_email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                        lead.status === 'qualificado' ? 'bg-emerald-100 text-emerald-700' :
                        lead.status === 'novo' ? 'bg-blue-100 text-blue-700' :
                        lead.status === 'em-contato' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {lead.status || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{lead.phase || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {lead.created_at ? new Date(lead.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleDeleteLead(lead.id, lead.name || 'Lead')}
                          disabled={deleting}
                          title="Deletar lead"
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <AdminPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={pageSize}
            hasPreviousPage={hasPreviousPage}
            hasNextPage={hasNextPage}
            onPreviousPage={goToPreviousPage}
            onNextPage={goToNextPage}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
