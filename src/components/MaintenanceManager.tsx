import React, { useState } from 'react';
import { Wrench, Plus, Search, User, Smartphone, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { Maintenance, MaintenanceStatus } from '../types';

interface MaintenanceManagerProps {
    maintenances: Maintenance[];
    onAddMaintenance: (m: Omit<Maintenance, 'id' | 'createdAt'>) => void;
    onUpdateMaintenance: (m: Maintenance) => void;
    onDeleteMaintenance: (id: string) => void;
}

const statusConfig: Record<MaintenanceStatus, { label: string, color: string, icon: any }> = {
    aguardando_orcamento: { label: 'Orçamento', color: 'bg-amber-50 text-amber-600 border-amber-100', icon: Clock },
    em_manutencao: { label: 'Em Reparo', color: 'bg-blue-50 text-blue-600 border-blue-100', icon: Wrench },
    aguardando_peca: { label: 'Peça', color: 'bg-purple-50 text-purple-600 border-purple-100', icon: AlertCircle },
    pronto: { label: 'Pronto', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: CheckCircle2 },
    entregue: { label: 'Entregue', color: 'bg-slate-50 text-slate-500 border-slate-100', icon: CheckCircle2 }
};

const MaintenanceManager: React.FC<MaintenanceManagerProps> = ({
    maintenances,
    onAddMaintenance,
    onUpdateMaintenance,
    onDeleteMaintenance
}) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filtered = maintenances.filter(m =>
        m.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.deviceModel.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Ordem de Serviço (Manutenção)</h1>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">Controle de reparos e assistência técnica</p>
                </div>
                <button className="flex items-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-emerald-500 transition-all shadow-xl shadow-slate-200">
                    <Plus size={18} />
                    Nova O.S.
                </button>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente / Aparelho</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Situação</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Orçamento</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filtered.map(m => {
                                const cfg = statusConfig[m.status];
                                return (
                                    <tr key={m.id} className="hover:bg-slate-50/30 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-emerald-500 group-hover:border-emerald-100 transition-all">
                                                    <Smartphone size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 tracking-tight">{m.clientName}</p>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">{m.deviceModel}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-black uppercase tracking-widest text-[10px] ${cfg.color}`}>
                                                <cfg.icon size={14} />
                                                {cfg.label}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="font-black text-slate-900">
                                                {m.estimatedPrice ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(m.estimatedPrice) : '---'}
                                            </p>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button className="p-2.5 bg-slate-100 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-200 transition-all">
                                                    <Wrench size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default MaintenanceManager;
