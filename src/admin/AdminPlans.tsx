
import React, { useEffect, useState } from 'react';
import { planService } from '../services/planService';
import { campaignService } from '../services/campaignService';
import { Plan, Campaign } from '../types';
import {
    Rocket,
    Edit2,
    Save,
    Plus,
    Trash2,
    Calendar,
    CheckCircle,
    AlertCircle,
    XCircle,
    Star,
    Shield,
    Crown,
    Gift,
    Zap,
    CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AdminPlans() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState<string | null>(null); // Plan ID being edited
    const [editForm, setEditForm] = useState<Partial<Plan>>({});

    // Campaign Modal
    const [showCampaignModal, setShowCampaignModal] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState<Partial<Campaign>>({});

    const [modal, setModal] = useState<{
        isOpen: boolean; type: 'success' | 'error' | 'confirm'; title: string; message: string; onConfirm?: () => void;
    }>({ isOpen: false, type: 'success', title: '', message: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setPlans(await planService.listPlans());
        setCampaigns(await campaignService.list());
        setLoading(false);
    };

    const handleEditPlan = (plan: Plan) => {
        setIsEditing(plan.id);
        setEditForm({
            ...plan,
            features: plan.features || [],
            style: plan.style || { icon: 'Zap', color: 'white', cta: 'Selecionar Plano' }
        });
    };

    const handleFeaturesChange = (text: string) => {
        const features = text.split('\n').filter(f => f.trim() !== '');
        setEditForm({ ...editForm, features });
    };

    const handleSavePlan = async () => {
        if (!isEditing) return;
        try {
            await planService.updatePlan(isEditing, {
                name: editForm.name,
                slug: editForm.slug,
                price: parseFloat(editForm.price as any),
                interval: editForm.interval,
                duration_days: parseInt(editForm.duration_days as any),
                description: editForm.description,
                features: editForm.features,
                is_active: editForm.is_active,
                style: editForm.style,
            });

            showSuccess('Plano Atualizado', 'As alterações foram salvas com sucesso.');
            setIsEditing(null);
            fetchData();
        } catch (error: any) {
            showError('Erro ao salvar plano: ' + error.message);
        }
    };

    const handleSaveCampaign = async () => {
        try {
            const campaignPayload = {
                name: editingCampaign.name,
                plan_id: editingCampaign.plan_id,
                start_date: editingCampaign.start_date,
                end_date: editingCampaign.end_date,
                promo_price: parseFloat(editingCampaign.promo_price as any),
                promo_text: editingCampaign.promo_text,
                is_active: editingCampaign.is_active,
            };
            if (editingCampaign.id) {
                await campaignService.update(editingCampaign.id, campaignPayload);
            } else {
                await campaignService.create(campaignPayload);
            }

            showSuccess('Sucesso', 'Campanha salva com sucesso.');
            setShowCampaignModal(false);
            fetchData();
        } catch (error: any) {
            showError('Erro ao salvar campanha: ' + error.message);
        }
    };

    const handleDeleteCampaign = async (id: string) => {
        setModal({
            isOpen: true,
            type: 'confirm',
            title: 'Excluir Campanha',
            message: 'Tem certeza que deseja excluir esta campanha?',
            onConfirm: async () => {
                try {
                    await campaignService.remove(id);
                    showSuccess('Excluída', 'Campanha removida com sucesso.');
                    fetchData();
                } catch {
                    showError('Erro ao excluir');
                }
            }
        });
    };

    const showSuccess = (title: string, message: string) => {
        setModal({ isOpen: true, type: 'success', title, message });
    };

    const showError = (message: string) => {
        setModal({ isOpen: true, type: 'error', title: 'Erro', message });
    };

    return (
        <div className="space-y-10 animate-fadeUp pb-20">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Planos e Campanhas</h1>
                    <p className="text-slate-500 font-bold text-sm mt-1">Configure os preços, benefícios e promoções do sistema.</p>
                </div>
            </header>

            {/* Plans List */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {plans.map(plan => (
                    <div key={plan.id} className={`bg-white rounded-[2.5rem] border transition-all overflow-hidden ${isEditing === plan.id ? 'border-indigo-500 ring-4 ring-indigo-500/5' : 'border-slate-200 shadow-xl shadow-slate-200/50'}`}>
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white rounded-2xl shadow-sm">
                                    {plan.style?.icon === 'Star' && <Star size={24} className="text-indigo-600" />}
                                    {plan.style?.icon === 'Shield' && <Shield size={24} className="text-indigo-600" />}
                                    {plan.style?.icon === 'Crown' && <Crown size={24} className="text-indigo-600" />}
                                    {plan.style?.icon === 'Rocket' && <Rocket size={24} className="text-indigo-600" />}
                                    {plan.style?.icon === 'Gift' && <Gift size={24} className="text-indigo-600" />}
                                    {(!plan.style?.icon || plan.style?.icon === 'Zap') && <Zap size={24} className="text-indigo-600" />}
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-900">{plan.name}</h3>
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Slug: {plan.slug || 'sem-slug'}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => isEditing === plan.id ? setIsEditing(null) : handleEditPlan(plan)}
                                className={`p-3 rounded-2xl transition-all ${isEditing === plan.id ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 shadow-sm'}`}
                            >
                                {isEditing === plan.id ? <XCircle size={20} /> : <Edit2 size={18} />}
                            </button>
                        </div>

                        <div className="p-8">
                            {isEditing === plan.id ? (
                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nome Comercial</label>
                                                <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:bg-white focus:border-indigo-500 outline-none transition-all" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Slug (Identificador do Sistema)</label>
                                                <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:bg-white focus:border-indigo-500 outline-none transition-all" value={editForm.slug} onChange={e => setEditForm({ ...editForm, slug: e.target.value })} placeholder="ex: crm-trial, crm, full" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Preço (R$)</label>
                                                    <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:bg-white focus:border-indigo-500 outline-none transition-all" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: Number(e.target.value) })} />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Duração (Dias)</label>
                                                    <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:bg-white focus:border-indigo-500 outline-none transition-all" value={editForm.duration_days} onChange={e => setEditForm({ ...editForm, duration_days: Number(e.target.value) })} />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 pt-4">
                                                <button
                                                    onClick={() => setEditForm({ ...editForm, is_active: !editForm.is_active })}
                                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${editForm.is_active ? 'bg-brand-500 border-brand-500 text-white shadow-lg shadow-brand-200' : 'bg-white text-slate-400 border-slate-200'}`}
                                                >
                                                    {editForm.is_active ? 'Plano Ativo' : 'Plano Inativo'}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Descrição Curta</label>
                                                <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:bg-white focus:border-indigo-500 outline-none transition-all resize-none" rows={3} value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Benefícios (Um por linha)</label>
                                                <textarea
                                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:bg-white focus:border-indigo-500 outline-none transition-all resize-none"
                                                    rows={5}
                                                    value={editForm.features?.join('\n')}
                                                    onChange={e => handleFeaturesChange(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Style Config */}
                                    <div className="p-8 bg-slate-900 rounded-[2rem] text-white">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-6 flex items-center gap-2">
                                            <Zap size={16} /> Estilo Visual do Card
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div>
                                                <label className="block text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-4">Ícone</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {['Zap', 'Star', 'Shield', 'Crown', 'Rocket', 'Gift'].map(icon => (
                                                        <button
                                                            key={icon}
                                                            onClick={() => setEditForm({ ...editForm, style: { ...editForm.style, icon } })}
                                                            className={`p-3 rounded-xl border-2 transition-all ${editForm.style?.icon === icon ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'}`}
                                                        >
                                                            {icon === 'Zap' && <Zap size={18} />}
                                                            {icon === 'Star' && <Star size={18} />}
                                                            {icon === 'Shield' && <Shield size={18} />}
                                                            {icon === 'Crown' && <Crown size={18} />}
                                                            {icon === 'Rocket' && <Rocket size={18} />}
                                                            {icon === 'Gift' && <Gift size={18} />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-4">Tema do Card</label>
                                                <div className="flex gap-4">
                                                    <button
                                                        onClick={() => setEditForm({ ...editForm, style: { ...editForm.style, color: 'white' } })}
                                                        className={`flex-1 p-4 rounded-xl border-2 transition-all font-black text-[10px] uppercase ${editForm.style?.color === 'white' ? 'bg-white text-slate-900 border-white' : 'bg-transparent text-white border-white/10'}`}
                                                    >
                                                        Card Light
                                                    </button>
                                                    <button
                                                        onClick={() => setEditForm({ ...editForm, style: { ...editForm.style, color: 'black' } })}
                                                        className={`flex-1 p-4 rounded-xl border-2 transition-all font-black text-[10px] uppercase ${editForm.style?.color === 'black' ? 'bg-white text-slate-900 border-white' : 'bg-transparent text-white border-white/10'}`}
                                                    >
                                                        Card Dark
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3">
                                        <button onClick={() => setIsEditing(null)} className="px-6 py-4 rounded-2xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-all">Cancelar</button>
                                        <button onClick={handleSavePlan} className="px-8 py-4 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-widest text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2">
                                            <Save size={18} /> Salvar Alterações
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-black text-slate-900">
                                            {plan.price === 0 ? 'Grátis' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plan.price)}
                                        </span>
                                        <span className="text-sm font-bold text-slate-400 capitalize">/ {plan.interval === 'day' ? `${plan.duration_days} dias` : plan.interval === 'month' ? 'mês' : 'ano'}</span>
                                    </div>
                                    <p className="text-slate-600 font-medium leading-relaxed">{plan.description}</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <ul className="space-y-3">
                                            {plan.features?.slice(0, Math.ceil(plan.features.length / 2)).map((feat, i) => (
                                                <li key={i} className="flex items-center gap-3 text-xs font-bold text-slate-500">
                                                    <div className="w-5 h-5 rounded-full bg-brand-50 flex items-center justify-center">
                                                        <CheckCircle size={12} className="text-brand-500" />
                                                    </div>
                                                    {feat}
                                                </li>
                                            ))}
                                        </ul>
                                        <ul className="space-y-3">
                                            {plan.features?.slice(Math.ceil(plan.features.length / 2)).map((feat, i) => (
                                                <li key={i} className="flex items-center gap-3 text-xs font-bold text-slate-500">
                                                    <div className="w-5 h-5 rounded-full bg-brand-50 flex items-center justify-center">
                                                        <CheckCircle size={12} className="text-brand-500" />
                                                    </div>
                                                    {feat}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    {!plan.is_active && (
                                        <div className="inline-flex items-center gap-2 bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                            <AlertCircle size={14} /> Plano Inativo
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Campaigns Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                            <Calendar size={24} className="text-indigo-600" /> Campanhas e Ofertas
                        </h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Gerencie descontos e promoções temporárias</p>
                    </div>
                    <button
                        onClick={() => { setEditingCampaign({ is_active: true }); setShowCampaignModal(true); }}
                        className="p-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-600 transition-all shadow-lg active:scale-95 flex items-center gap-2"
                    >
                        <Plus size={16} /> Nova Campanha
                    </button>
                </div>

                <div className="overflow-x-auto">
                    {campaigns.length === 0 ? (
                        <div className="p-20 text-center text-slate-300 font-bold uppercase tracking-widest text-xs">Nenhuma campanha cadastrada.</div>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                    <th className="px-8 py-5">Campanha</th>
                                    <th className="px-8 py-5">Plano</th>
                                    <th className="px-8 py-5">Período</th>
                                    <th className="px-8 py-5">Oferta</th>
                                    <th className="px-8 py-5">Status</th>
                                    <th className="px-8 py-5 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {campaigns.map(camp => {
                                    const planName = plans.find(p => p.id === camp.plan_id)?.name || 'Todos';
                                    const isCurrentlyActive = camp.is_active && new Date() >= new Date(camp.start_date) && new Date() <= new Date(camp.end_date);
                                    return (
                                        <tr key={camp.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-8 py-6 font-black text-slate-900">{camp.name}</td>
                                            <td className="px-8 py-6">
                                                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-tight">
                                                    {planName}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-slate-500 font-medium text-xs">
                                                {format(new Date(camp.start_date), 'dd MMM yyyy', { locale: ptBR })} - {format(new Date(camp.end_date), 'dd MMM yyyy', { locale: ptBR })}
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="font-black text-brand-600 text-sm">{camp.promo_text}</div>
                                                <div className="text-[10px] font-bold text-slate-400">R$ {camp.promo_price}</div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tight ${isCurrentlyActive ? 'bg-brand-100 text-brand-600' : 'bg-slate-100 text-slate-400'}`}>
                                                    {isCurrentlyActive ? 'Ativa' : 'Inativa/Expirada'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => { setEditingCampaign(camp); setShowCampaignModal(true); }} className="p-2 text-slate-400 hover:text-indigo-600 transition-all"><Edit2 size={16} /></button>
                                                    <button onClick={() => handleDeleteCampaign(camp.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-all"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Campaign Modal */}
            {showCampaignModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-scaleUp">
                        <div className="p-10">
                            <h2 className="text-2xl font-black text-slate-900 mb-2">{editingCampaign.id ? 'Editar Campanha' : 'Nova Campanha'}</h2>
                            <p className="text-slate-500 font-bold text-sm mb-8">Defina os detalhes da sua oferta especial.</p>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nome da Campanha</label>
                                    <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:bg-white focus:border-indigo-500 outline-none transition-all" value={editingCampaign.name || ''} onChange={e => setEditingCampaign({ ...editingCampaign, name: e.target.value })} placeholder="Black Friday Gestor de Pátio" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Plano Alvo</label>
                                    <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:bg-white focus:border-indigo-500 outline-none transition-all" value={editingCampaign.plan_id || ''} onChange={e => setEditingCampaign({ ...editingCampaign, plan_id: e.target.value })}>
                                        <option value="">Selecione um plano</option>
                                        {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Data Início</label>
                                        <input type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:bg-white focus:border-indigo-500 outline-none transition-all" value={editingCampaign.start_date?.split('T')[0] || ''} onChange={e => setEditingCampaign({ ...editingCampaign, start_date: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Data Fim</label>
                                        <input type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:bg-white focus:border-indigo-500 outline-none transition-all" value={editingCampaign.end_date?.split('T')[0] || ''} onChange={e => setEditingCampaign({ ...editingCampaign, end_date: e.target.value })} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Preço Promo (R$)</label>
                                        <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:bg-white focus:border-indigo-500 outline-none transition-all" value={editingCampaign.promo_price || ''} onChange={e => setEditingCampaign({ ...editingCampaign, promo_price: Number(e.target.value) })} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Texto da Oferta</label>
                                        <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:bg-white focus:border-indigo-500 outline-none transition-all" value={editingCampaign.promo_text || ''} onChange={e => setEditingCampaign({ ...editingCampaign, promo_text: e.target.value })} placeholder="50% OFF no primeiro mês" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 mt-10">
                                <button onClick={() => setShowCampaignModal(false)} className="flex-1 py-4 rounded-2xl border border-slate-200 font-bold text-slate-500 hover:bg-slate-50 transition-all">Cancelar</button>
                                <button onClick={handleSaveCampaign} className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-widest text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">Salvar Campanha</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Feedback */}
            {modal.isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
                    <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-sm shadow-2xl text-center animate-scaleUp">
                        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 ${modal.type === 'success' ? 'bg-brand-50 text-brand-500' : modal.type === 'confirm' ? 'bg-amber-50 text-amber-500' : 'bg-rose-50 text-rose-500'}`}>
                            {modal.type === 'success' ? <CheckCircle2 size={40} /> : modal.type === 'confirm' ? <AlertCircle size={40} /> : <AlertCircle size={40} />}
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">{modal.title}</h3>
                        <p className="text-slate-500 font-medium mb-8 leading-relaxed">{modal.message}</p>
                        <div className="flex gap-3">
                            {modal.type === 'confirm' && (
                                <button onClick={() => setModal({ ...modal, isOpen: false })} className="flex-1 py-4 border-2 border-slate-100 rounded-2xl font-bold text-slate-400 hover:bg-slate-50 transition-all">
                                    Não
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    if (modal.onConfirm) modal.onConfirm();
                                    setModal({ ...modal, isOpen: false });
                                }}
                                className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg ${modal.type === 'error' ? 'bg-rose-500 text-white' : 'bg-slate-900 text-white hover:bg-black shadow-slate-200'}`}
                            >
                                {modal.type === 'confirm' ? 'Sim, tenho' : 'Entendido'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
