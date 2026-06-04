import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Vehicle } from '../types';
import { Search, Trash2, DollarSign, Calendar, AlertCircle } from 'lucide-react';

interface VehicleWithUser extends Vehicle {
  user_name?: string;
  user_id?: string;
}

export default function AdminVehicles() {
  const [vehicles, setVehicles] = useState<VehicleWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedVehicles, setSelectedVehicles] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from('vehicles')
        .select(`
          *,
          profiles:user_id(full_name)
        `)
        .order('created_at', { ascending: false });

      if (err) throw err;

      const mapped = (data || []).map((v: any) => ({
        ...v,
        user_name: v.profiles?.full_name,
        status: v.sold_date ? 'sold' : 'available'
      }));

      setVehicles(mapped);
    } catch (err) {
      console.error('Error fetching vehicles:', err);
      setError('Erro ao carregar veículos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch =
      (v.brand?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (v.model?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (v.plate?.includes(searchTerm));
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDeleteVehicle = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja deletar este veículo?')) return;

    try {
      const { error: err } = await supabase.from('vehicles').delete().eq('id', id);
      if (err) throw err;
      setVehicles(vehicles.filter(v => v.id !== id));
    } catch (err) {
      console.error('Error deleting vehicle:', err);
      alert('Erro ao deletar veículo');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedVehicles.size === 0) return;
    if (!window.confirm(`Deletar ${selectedVehicles.size} veículo(s)? Esta ação é irreversível.`)) return;

    try {
      const { error: err } = await supabase
        .from('vehicles')
        .delete()
        .in('id', Array.from(selectedVehicles));

      if (err) throw err;
      setVehicles(vehicles.filter(v => !selectedVehicles.has(v.id)));
      setSelectedVehicles(new Set());
    } catch (err) {
      console.error('Error bulk deleting:', err);
      alert('Erro ao deletar veículos');
    }
  };

  const toggleSelectAll = () => {
    if (selectedVehicles.size === filteredVehicles.length) {
      setSelectedVehicles(new Set());
    } else {
      setSelectedVehicles(new Set(filteredVehicles.map(v => v.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelection = new Set(selectedVehicles);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedVehicles(newSelection);
  };

  return (
    <div className="space-y-8 animate-fadeUp">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gerenciamento de Veículos</h1>
          <p className="text-slate-500 font-bold text-sm mt-1">Visualize, edite e delete veículos de todas as lojas.</p>
        </div>
        <div className="px-4 py-2 bg-white rounded-lg shadow-sm border text-sm font-medium text-slate-600">
          Total: {filteredVehicles.length}
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
            placeholder="Buscar por marca, modelo ou placa..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
        >
          <option value="all">Todos os status</option>
          <option value="available">Disponível</option>
          <option value="sold">Vendido</option>
        </select>

        {selectedVehicles.size > 0 && (
          <button
            onClick={handleBulkDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-bold flex items-center gap-2"
          >
            <Trash2 size={16} />
            Deletar {selectedVehicles.size}
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400">Carregando veículos...</div>
      ) : filteredVehicles.length === 0 ? (
        <div className="text-center py-20">
          <AlertCircle className="mx-auto text-slate-300 mb-4" size={48} />
          <p className="text-slate-400 font-bold">Nenhum veículo encontrado com esses filtros.</p>
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
                      checked={selectedVehicles.size === filteredVehicles.length && filteredVehicles.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Veículo</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Usuário</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Tipo</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Ano</th>
                  <th className="px-6 py-4 text-right text-[10px] font-black uppercase text-slate-400 tracking-widest">Preço</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</th>
                  <th className="px-6 py-4 text-right text-[10px] font-black uppercase text-slate-400 tracking-widest">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVehicles.map(vehicle => (
                  <tr key={vehicle.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedVehicles.has(vehicle.id)}
                        onChange={() => toggleSelect(vehicle.id)}
                        className="w-4 h-4 rounded cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{vehicle.brand} {vehicle.model}</div>
                      <div className="text-sm text-slate-500">{vehicle.plate || 'Sem placa'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {vehicle.user_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{vehicle.type}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{vehicle.year}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 font-bold text-slate-900">
                        <DollarSign size={16} />
                        {vehicle.price.toLocaleString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        vehicle.status === 'sold' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {vehicle.status === 'sold' ? 'Vendido' : 'Disponível'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleDeleteVehicle(vehicle.id)}
                          title="Deletar veículo"
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
        </div>
      )}
    </div>
  );
}
