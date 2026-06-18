import React, { useState, useEffect } from 'react';
import {
    Users, UserPlus, Shield, TrendingUp, X, Eye, EyeOff, Lock,
    User, Trash2, Edit2, RefreshCcw, Save, Loader2, LayoutDashboard,
    ArrowLeft, Phone, Mail, Calendar, Tag, Target, ChevronRight
} from 'lucide-react';
import Modal from './ui/Modal';
import { Profile, Lead, LeadPhase } from '../types';
import { profileService } from '../services/profileService';
import { leadService } from '../services/leadService';
import { useToast } from '../contexts/ToastContext';

interface TeamManagerProps {
    adminProfile: Profile;
}

const PHASE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
    [LeadPhase.NEW]:          { label: 'Novos Leads',      color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200' },
    [LeadPhase.FOLLOW_UP]:    { label: 'Follow-Up',        color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200' },
    [LeadPhase.STAND_BY]:     { label: 'Stand-By',         color: 'text-violet-600',  bg: 'bg-violet-50',  border: 'border-violet-200' },
    [LeadPhase.SIMULATION]:   { label: 'Simulação',        color: 'text-purple-600',  bg: 'bg-purple-50',  border: 'border-purple-200' },
    [LeadPhase.COMPLETED]:    { label: 'Convertidos',      color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    [LeadPhase.DISQUALIFIED]: { label: 'Desqualificados',  color: 'text-rose-500',    bg: 'bg-rose-50',    border: 'border-rose-200' },
};

const DISPLAY_PHASES = [LeadPhase.NEW, LeadPhase.FOLLOW_UP, LeadPhase.STAND_BY, LeadPhase.SIMULATION, LeadPhase.COMPLETED, LeadPhase.DISQUALIFIED];

const LeadCard: React.FC<{ lead: Lead }> = ({ lead }) => (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-2 mb-2">
            <p className="font-bold text-slate-800 text-sm leading-tight line-clamp-1">{lead.name}</p>
            {lead.temperature && (
                <span className={`shrink-0 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    lead.temperature === 'Quente' ? 'bg-red-100 text-red-500' :
                    lead.temperature === 'Morna'  ? 'bg-amber-100 text-amber-500' :
                    'bg-blue-100 text-blue-500'
                }`}>{lead.temperature}</span>
            )}
        </div>
        <div className="space-y-1">
            {lead.phone && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Phone size={10} className="text-slate-300" />
                    <span>{lead.phone}</span>
                </div>
            )}
            {lead.source && (
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Tag size={10} className="text-slate-300" />
                    <span>{lead.source}</span>
                </div>
            )}
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Calendar size={10} className="text-slate-300" />
                <span>{new Date(lead.createdAt).toLocaleDateString('pt-BR')}</span>
            </div>
        </div>
    </div>
);

const MemberKanban: React.FC<{ member: Profile; adminId: string; onBack: () => void }> = ({ member, adminId, onBack }) => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    useEffect(() => {
        const fetch = async () => {
            try {
                setLoading(true);
                const data = await leadService.list(member.id);
                setLeads(data);
            } catch {
                showToast('error', 'Erro ao carregar leads do colaborador.');
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [member.id]);

    const leadsByPhase = DISPLAY_PHASES.reduce((acc, phase) => {
        acc[phase] = leads.filter(l => l.phase === phase);
        return acc;
    }, {} as Record<string, Lead[]>);

    return (
        <div className="space-y-5">
            <div className="flex items-center gap-3">
                <button
                    onClick={onBack}
                    className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-500 font-semibold transition-colors"
                >
                    <ArrowLeft size={14} />
                    Voltar
                </button>
                <ChevronRight size={12} className="text-slate-300" />
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center font-bold text-emerald-500 text-sm">
                        {member.full_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                        <p className="text-sm font-black text-slate-800">{member.full_name || 'Colaborador'}</p>
                        <p className="text-[10px] text-slate-400">{member.email}</p>
                    </div>
                </div>
                <span className="ml-auto bg-emerald-50 text-emerald-600 text-xs font-black px-3 py-1 rounded-full">
                    {leads.length} lead{leads.length !== 1 ? 's' : ''}
                </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {DISPLAY_PHASES.map(phase => {
                    const cfg = PHASE_CONFIG[phase];
                    const count = leadsByPhase[phase]?.length || 0;
                    return (
                        <div key={phase} className={`${cfg.bg} border ${cfg.border} rounded-2xl p-4`}>
                            <p className={`text-[10px] font-black uppercase tracking-widest ${cfg.color} mb-1`}>{cfg.label}</p>
                            <p className={`text-2xl font-black ${cfg.color}`}>{count}</p>
                        </div>
                    );
                })}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
                </div>
            ) : leads.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-300 gap-3">
                    <Target size={40} />
                    <p className="text-sm font-semibold text-slate-400">Este colaborador ainda não cadastrou leads.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                    {DISPLAY_PHASES.map(phase => {
                        const cfg = PHASE_CONFIG[phase];
                        const phaseLeads = leadsByPhase[phase] || [];
                        return (
                            <div key={phase} className="flex flex-col gap-3">
                                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${cfg.bg} border ${cfg.border}`}>
                                    <p className={`text-[10px] font-black uppercase tracking-widest ${cfg.color} flex-1`}>{cfg.label}</p>
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${cfg.color} bg-white/80`}>{phaseLeads.length}</span>
                                </div>
                                <div className="flex flex-col gap-2 min-h-[80px]">
                                    {phaseLeads.length === 0 ? (
                                        <div className="text-center text-slate-300 text-xs py-6 border-2 border-dashed border-slate-100 rounded-2xl">
                                            Nenhum lead
                                        </div>
                                    ) : (
                                        phaseLeads.map(lead => <LeadCard key={lead.id} lead={lead} />)
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const TeamManager: React.FC<TeamManagerProps> = ({ adminProfile }) => {
    const { showToast } = useToast();
    const [members, setMembers] = useState<Profile[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewingMember, setViewingMember] = useState<Profile | null>(null);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [createEmail, setCreateEmail] = useState('');
    const [createName, setCreateName] = useState('');
    const [createPhone, setCreatePhone] = useState('');
    const [createPassword, setCreatePassword] = useState('');
    const [createLoading, setCreateLoading] = useState(false);

    const [editMember, setEditMember] = useState<Profile | null>(null);
    const [editName, setEditName] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editPassword, setEditPassword] = useState('');
    const [editLoading, setEditLoading] = useState(false);

    const [removingId, setRemovingId] = useState<string | null>(null);

    const loadTeamData = async () => {
        try {
            setLoading(true);
            const [membersData, leadsData] = await Promise.all([
                profileService.getTeamMembers(adminProfile.id),
                leadService.list(undefined, adminProfile.id, true, 200, 0),
            ]);
            setMembers(membersData);
            setLeads(leadsData);
        } catch (error) {
            showToast('error', 'Erro ao carregar dados da equipe.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadTeamData(); }, [adminProfile.id]);

    const resetCreate = () => {
        setCreateEmail('');
        setCreateName('');
        setCreatePhone('');
        setCreatePassword('');
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!createEmail || !createName || !createPassword) {
            showToast('error', 'Nome, e-mail e senha são obrigatórios.');
            return;
        }
        if (createPassword.length < 6) {
            showToast('error', 'A senha deve ter pelo menos 6 caracteres.');
            return;
        }
        setCreateLoading(true);
        try {
            await profileService.createTeamUser(createEmail, createPassword, createName);
            showToast('success', 'Vendedor criado com sucesso!');
            setIsCreateOpen(false);
            resetCreate();
            await loadTeamData();
        } catch (error: any) {
            showToast('error', error?.message || 'Erro ao criar vendedor.');
        } finally {
            setCreateLoading(false);
        }
    };

    const openEdit = (member: Profile) => {
        setEditMember(member);
        setEditName(member.full_name || '');
        setEditPhone(member.phone || '');
        setEditPassword('');
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editMember) return;
        if (editPassword && editPassword.length < 6) {
            showToast('error', 'A nova senha deve ter pelo menos 6 caracteres.');
            return;
        }
        setEditLoading(true);
        try {
            await profileService.updateTeamUser(
                editMember.id,
                editName,
                editPassword || undefined
            );
            showToast('success', 'Dados atualizados!');
            setMembers(prev => prev.map(m => m.id === editMember.id ? {
                ...m,
                full_name: editName,
                phone: editPhone || undefined
            } : m));
            setEditMember(null);
        } catch (error: any) {
            showToast('error', error?.message || 'Erro ao atualizar vendedor.');
        } finally {
            setEditLoading(false);
        }
    };

    const handleRemove = async (member: Profile) => {
        if (!confirm(`Remover "${member.full_name || member.email}" da equipe?\n\nEle perderá acesso ao sistema.`)) return;
        setRemovingId(member.id);
        try {
            await profileService.removeTeamUser(member.id);
            showToast('success', 'Usuário removido da equipe.');
            setMembers(prev => prev.filter(m => m.id !== member.id));
        } catch (error: any) {
            showToast('error', error?.message || 'Erro ao remover usuário.');
        } finally {
            setRemovingId(null);
        }
    };

    const getUserMetrics = (userId: string) => {
        const userLeads = leads.filter(l => l.user_id === userId);
        const conversions = userLeads.filter(l => l.is_buyer).length;
        return {
            leads: userLeads.length,
            conversions,
            rate: userLeads.length > 0 ? ((conversions / userLeads.length) * 100).toFixed(1) : '0.0'
        };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
            </div>
        );
    }

    if (viewingMember) {
        return (
            <MemberKanban
                member={viewingMember}
                adminId={adminProfile.id}
                onBack={() => setViewingMember(null)}
            />
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center gap-4">
                    <div className="w-11 h-11 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                        <Users size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Membros</p>
                        <p className="text-2xl font-black text-slate-800">{members.length}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center gap-4">
                    <div className="w-11 h-11 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                        <TrendingUp size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Conversão</p>
                        <p className="text-2xl font-black text-slate-800">
                            {leads.length > 0 ? ((leads.filter(l => l.is_buyer).length / leads.length) * 100).toFixed(1) : '0'}%
                        </p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 flex flex-col gap-2 justify-center">
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="w-full py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all active:scale-95"
                    >
                        <UserPlus size={16} /> Adicionar Usuário
                    </button>
                    <button onClick={loadTeamData} className="text-xs text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1.5 py-1 transition-colors">
                        <RefreshCcw size={11} /> Atualizar
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
                    <Shield size={16} className="text-emerald-500" />
                    <h2 className="text-sm font-black text-slate-800">Gerenciar Equipe</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/60">
                            <tr>
                                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Usuário</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Telefone</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Leads</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vendas</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Taxa</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {members.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-14 text-center">
                                        <div className="flex flex-col items-center gap-2 text-slate-300">
                                            <Users size={32} />
                                            <p className="text-sm font-semibold text-slate-400">Nenhum usuário adicionado.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                members.map(member => {
                                    const m = getUserMetrics(member.id);
                                    return (
                                        <tr key={member.id} className="hover:bg-slate-50/40 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center font-bold text-emerald-500 text-sm overflow-hidden">
                                                        {member.avatar_url ? (
                                                            <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            member.full_name?.charAt(0)?.toUpperCase() || '?'
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800">{member.full_name || 'Sem nome'}</p>
                                                        <p className="text-xs text-slate-400">{member.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{member.phone || '—'}</td>
                                            <td className="px-6 py-4 font-bold text-slate-700 text-sm">{m.leads}</td>
                                            <td className="px-6 py-4 font-bold text-emerald-600 text-sm">{m.conversions}</td>
                                            <td className="px-6 py-4 font-bold text-slate-600 text-sm">{m.rate}%</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => setViewingMember(member)}
                                                        className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"
                                                        title="Ver leads deste colaborador"
                                                    >
                                                        <LayoutDashboard size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => openEdit(member)}
                                                        className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                                                        title="Editar usuário"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemove(member)}
                                                        disabled={removingId === member.id}
                                                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all disabled:opacity-40"
                                                        title="Remover da equipe"
                                                    >
                                                        {removingId === member.id
                                                            ? <Loader2 size={14} className="animate-spin" />
                                                            : <Trash2 size={14} />
                                                        }
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal
                isOpen={isCreateOpen}
                onClose={() => { setIsCreateOpen(false); resetCreate(); }}
                title={
                    <div>
                        <h3 className="text-lg font-black text-slate-800">Criar Novo Usuário</h3>
                        <p className="text-xs text-slate-400 mt-0.5">O acesso é imediato após a criação.</p>
                    </div>
                }
                maxWidth="max-w-md"
            >
                <form onSubmit={handleCreate} className="p-6 space-y-4">
                    <Field label="Nome Completo *" icon={<User size={15} />}>
                        <input required type="text" value={createName} onChange={e => setCreateName(e.target.value)} placeholder="João da Silva" className={inputCls} />
                    </Field>
                    <Field label="E-mail (Login) *" icon={<Mail size={15} />}>
                        <input required type="email" value={createEmail} onChange={e => setCreateEmail(e.target.value)} placeholder="vendedor@empresa.com" className={inputCls} />
                    </Field>
                    <Field label="Senha de Acesso *" icon={<Lock size={15} />}>
                        <input required type="password" value={createPassword} onChange={e => setCreatePassword(e.target.value)} placeholder="Mínimo 6 caracteres" className={inputCls} />
                    </Field>
                    <Field label="Telefone (Opcional)" icon={<Phone size={15} />}>
                        <input type="tel" value={createPhone} onChange={e => setCreatePhone(e.target.value)} placeholder="(11) 99999-9999" className={inputCls} />
                    </Field>
                    <p className="text-[11px] text-slate-400 bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                        ⚡ O vendedor acessa o sistema com o e-mail e senha definidos acima.
                    </p>
                    <button type="submit" disabled={!createEmail || !createName || !createPassword || createLoading} className="w-full py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                        {createLoading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                        {createLoading ? 'Criando...' : 'Criar Vendedor'}
                    </button>
                </form>
            </Modal>

            <Modal
                isOpen={!!editMember}
                onClose={() => setEditMember(null)}
                title={
                    editMember && (
                        <div>
                            <h3 className="text-lg font-black text-slate-800">Editar Usuário</h3>
                            <p className="text-xs text-slate-400 mt-0.5">{editMember.email}</p>
                        </div>
                    )
                }
                maxWidth="max-w-md"
            >
                <form onSubmit={handleEdit} className="p-6 space-y-4">
                    <Field label="Nome Completo" icon={<User size={15} />}>
                        <input type="text" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Nome do usuário" className={inputCls} />
                    </Field>
                    <Field label="Nova Senha (deixe em branco para não alterar)" icon={<Lock size={15} />}>
                        <input type="password" value={editPassword} onChange={e => setEditPassword(e.target.value)} placeholder="Nova senha (opcional)" className={inputCls} />
                    </Field>
                    <Field label="Telefone" icon={<Phone size={15} />}>
                        <input type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="(11) 99999-9999" className={inputCls} />
                    </Field>
                    <button type="submit" disabled={editLoading} className="w-full py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                        {editLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {editLoading ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </form>
            </Modal>
        </div>
    );
};

const inputCls = "w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all";

function Field({ label, icon, rightAction, children }: { label?: string; icon?: React.ReactNode; rightAction?: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            {label && <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 block">{label}</label>}
            <div className="relative">
                {icon && <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300">{icon}</div>}
                {children}
                {rightAction && <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{rightAction}</div>}
            </div>
        </div>
    );
}

export default TeamManager;
