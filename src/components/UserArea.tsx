
import React, { useState, useEffect } from 'react';
import { Check, Star, Zap, User, Lock, Save, Loader2, Shield, Crown, Rocket, Gift, Building, Mail, Target, Edit2, Plus, Trash2 } from 'lucide-react';
import { Profile, Plan, Campaign } from '../types';
import { supabase } from '../lib/supabaseClient';
import { profileService } from '../services/profileService';
import { formatCurrency, parseCurrency } from '../utils/formatters';
import { resizeImage } from '../utils/imageProcessor';

interface UserAreaProps {
    profile: Profile | null;
    onUpgrade: (plan: Plan) => void;
    onProfileUpdate: () => void;
}

const UserArea: React.FC<UserAreaProps> = ({ profile, onUpgrade, onProfileUpdate }) => {
    const [loading, setLoading] = useState(false);
    const [fullName, setFullName] = useState(profile?.full_name || '');
    const [companyName, setCompanyName] = useState(profile?.company_name || '');
    const [email, setEmail] = useState(profile?.email || '');
    const [monthlySalesGoal, setMonthlySalesGoal] = useState<number>(profile?.monthly_sales_goal || 10);
    const [monthlyLeadsGoal, setMonthlyLeadsGoal] = useState<number>(profile?.monthly_leads_goal || 0);
    const [monthlyVisitsGoal, setMonthlyVisitsGoal] = useState<number>(profile?.monthly_visits_goal || 0);
    const [monthlyRevenueGoal, setMonthlyRevenueGoal] = useState<number>(profile?.monthly_revenue_goal || 0);
    const [newPassword, setNewPassword] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Plans Data
    const [plans, setPlans] = useState<Plan[]>([]);
    const [activeCampaigns, setActiveCampaigns] = useState<Campaign[]>([]);
    const [loadingPlans, setLoadingPlans] = useState(true);

    const isPaid = profile?.plan === 'crm' || profile?.plan === 'pro' || profile?.plan === 'traffic_crm';

    useEffect(() => {
        if (profile) {
            setFullName(profile.full_name || '');
            setCompanyName(profile.company_name || '');
            setEmail(profile.email || '');
            setMonthlySalesGoal(profile.monthly_sales_goal || 10);
            setMonthlyLeadsGoal(profile.monthly_leads_goal || 0);
            setMonthlyVisitsGoal(profile.monthly_visits_goal || 0);
            setMonthlyRevenueGoal(profile.monthly_revenue_goal || 0);
        }
    }, [profile]);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const { data: plansData } = await supabase.from('plans').select('*').eq('is_active', true).order('price', { ascending: true });
            const { data: campaignsData } = await supabase.from('campaigns')
                .select('*')
                .eq('is_active', true)
                .lte('start_date', new Date().toISOString())
                .gte('end_date', new Date().toISOString());

            if (plansData) setPlans(plansData);
            if (campaignsData) setActiveCampaigns(campaignsData);
        } catch (error) {
            console.error('Error fetching plans:', error);
        } finally {
            setLoadingPlans(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            await profileService.updateProfile({
                full_name: fullName,
                company_name: companyName,
                monthly_sales_goal: monthlySalesGoal,
                monthly_leads_goal: monthlyLeadsGoal || undefined,
                monthly_visits_goal: monthlyVisitsGoal || undefined,
                monthly_revenue_goal: monthlyRevenueGoal || undefined,
            });

            if (newPassword) {
                const { error } = await supabase.auth.updateUser({ password: newPassword });
                if (error) throw error;
                setNewPassword('');
            }

            setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
            onProfileUpdate();
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Erro ao atualizar perfil' });
        } finally {
            setLoading(false);
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !profile) return;

        try {
            setLoading(true);
            const resizedLogo = await resizeImage(file, 400, 400);
            const fileName = `${profile.id}/company-logo-${Date.now()}.png`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, resizedLogo, { contentType: 'image/png', upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);

            await supabase.auth.updateUser({ data: { company_logo: publicUrl } });
            await profileService.updateProfile({ company_logo: publicUrl });
            onProfileUpdate();
            setMessage({ type: 'success', text: 'Logo atualizada!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Erro no upload' });
        } finally {
            setLoading(false);
        }
    };

    const getStoragePathFromPublicUrl = (url: string) => {
        if (!url.includes('/public/')) return null;
        const relativePath = url.split('/public/')[1];
        if (!relativePath) return null;

        const parts = relativePath.split('/');
        parts.shift();
        return parts.join('/');
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !profile) return;

        try {
            setLoading(true);
            const resizedAvatar = await resizeImage(file, 200, 200);
            const fileName = `${profile.id}/avatar-${Date.now()}.png`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, resizedAvatar, { contentType: 'image/png', upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);

            await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
            await profileService.updateProfile({ avatar_url: publicUrl });
            onProfileUpdate();
            setMessage({ type: 'success', text: 'Avatar atualizado!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Erro no upload' });
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveAvatar = async () => {
        if (!profile?.avatar_url) return;

        try {
            setLoading(true);
            setMessage(null);

            const storagePath = getStoragePathFromPublicUrl(profile.avatar_url);
            if (storagePath) {
                await supabase.storage.from('avatars').remove([storagePath]);
            }

            await supabase.auth.updateUser({ data: { avatar_url: '' } });
            await profileService.updateProfile({ avatar_url: '' });
            onProfileUpdate();
            setMessage({ type: 'success', text: 'Foto removida com sucesso!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Erro ao remover foto' });
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveLogo = async () => {
        if (!profile?.company_logo) return;

        try {
            setLoading(true);
            setMessage(null);

            const storagePath = getStoragePathFromPublicUrl(profile.company_logo);
            if (storagePath) {
                await supabase.storage.from('avatars').remove([storagePath]);
            }

            await supabase.auth.updateUser({ data: { company_logo: '' } });
            await profileService.updateProfile({ company_logo: '' });
            onProfileUpdate();
            setMessage({ type: 'success', text: 'Logo removida com sucesso!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Erro ao remover logo' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-12 pb-20 max-w-[1600px] mx-auto w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Profile Settings */}
                <div className="lg:col-span-12">
                    <div className="bg-white rounded-[2.5rem] p-8 lg:p-12 shadow-2xl shadow-slate-200/50 border border-slate-100 flex flex-col md:flex-row gap-12">
                        {/* Avatar & Logo Section */}
                        <div className="md:w-1/3 flex flex-col items-center space-y-8">
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-[2.5rem] bg-slate-100 overflow-hidden border-4 border-white shadow-xl relative">
                                    {profile?.avatar_url ? (
                                        <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            <User size={48} />
                                        </div>
                                    )}
                                    {profile?.avatar_url && (
                                        <button
                                            type="button"
                                            onClick={handleRemoveAvatar}
                                            className="absolute top-2 right-2 p-2 bg-white text-slate-600 rounded-full shadow-md hover:bg-red-600 hover:text-white transition-all z-20"
                                            title="Remover foto"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                                <label className="absolute -bottom-2 -right-2 p-3 bg-indigo-600 text-white rounded-2xl shadow-lg cursor-pointer hover:bg-indigo-700 transition-all hover:scale-110 active:scale-95">
                                    <Edit2 size={16} />
                                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                                </label>
                            </div>

                            <div className="text-center">
                                <h3 className="text-lg font-black text-slate-900">{profile?.full_name || 'Usuário'}</h3>
                                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mt-1">{profile?.plan === 'trial' ? 'Período de Teste' : 'Assinante Premium'}</p>
                            </div>

                            <div className="w-full h-px bg-slate-100"></div>

                            <div className="w-full space-y-4">
                                <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-slate-400 px-2">
                                    <span>Logo da Loja</span>
                                    <Building size={14} />
                                </div>
                                <div className="relative group p-6 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 hover:border-indigo-400 transition-all text-center">
                                    {profile?.company_logo && (
                                        <button
                                            type="button"
                                            onClick={handleRemoveLogo}
                                            className="absolute top-3 right-3 p-2 bg-white text-slate-600 rounded-full shadow-md hover:bg-red-600 hover:text-white transition-all z-20 pointer-events-auto"
                                            title="Remover logo"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                    {profile?.company_logo ? (
                                        <img src={profile.company_logo} alt="Logo" className="max-h-20 mx-auto group-hover:opacity-50 transition-all" />
                                    ) : (
                                        <div className="text-slate-300 py-4"><Plus size={24} className="mx-auto mb-2" /> <span className="text-[10px] font-black uppercase">Subir Logo</span></div>
                                    )}
                                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" accept="image/*" onChange={handleLogoUpload} />
                                </div>
                            </div>
                        </div>

                        {/* Form Section */}
                        <div className="md:w-2/3">
                            <form onSubmit={handleUpdateProfile} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-2">Nome Completo</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type="text"
                                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm focus:bg-white focus:border-indigo-500 outline-none transition-all"
                                                value={fullName}
                                                onChange={e => setFullName(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-2">Nome da Empresa</label>
                                        <div className="relative">
                                            <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type="text"
                                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm focus:bg-white focus:border-indigo-500 outline-none transition-all"
                                                value={companyName}
                                                onChange={e => setCompanyName(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-2">Email (Apenas Visualização)</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                            <input
                                                type="email"
                                                disabled
                                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm text-slate-400 cursor-not-allowed"
                                                value={email}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-2">Meta — Vendas/mês (unid.)</label>
                                        <div className="relative">
                                            <Target className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type="number"
                                                min={0}
                                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm focus:bg-white focus:border-indigo-500 outline-none transition-all"
                                                value={monthlySalesGoal}
                                                onChange={e => setMonthlySalesGoal(Number(e.target.value))}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-2">Meta — Leads/mês (unid.)</label>
                                        <div className="relative">
                                            <Target className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type="number"
                                                min={0}
                                                placeholder="0 = sem meta"
                                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm focus:bg-white focus:border-indigo-500 outline-none transition-all"
                                                value={monthlyLeadsGoal || ''}
                                                onChange={e => setMonthlyLeadsGoal(Number(e.target.value))}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-2">Meta — Visitas/mês (unid.)</label>
                                        <div className="relative">
                                            <Target className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type="number"
                                                min={0}
                                                placeholder="0 = sem meta"
                                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm focus:bg-white focus:border-indigo-500 outline-none transition-all"
                                                value={monthlyVisitsGoal || ''}
                                                onChange={e => setMonthlyVisitsGoal(Number(e.target.value))}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-2">Meta — Faturamento/mês (R$)</label>
                                        <div className="relative">
                                            <Target className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type="number"
                                                min={0}
                                                placeholder="0 = sem meta"
                                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm focus:bg-white focus:border-indigo-500 outline-none transition-all"
                                                value={monthlyRevenueGoal || ''}
                                                onChange={e => setMonthlyRevenueGoal(Number(e.target.value))}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-2">Alterar Senha</label>
                                        <span className="text-[10px] text-slate-300 font-bold">(Deixe vazio para não alterar)</span>
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="password"
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm focus:bg-white focus:border-indigo-500 outline-none transition-all"
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>

                                {message && (
                                    <div className={`p-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-3 animate-slideIn ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                        <Check size={16} /> {message.text}
                                    </div>
                                )}

                                <button
                                    disabled={loading}
                                    className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-900/10 hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Salvar Alterações</>}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Plans Management */}
                <div className="lg:col-span-12 space-y-10">
                    <div className="text-center max-w-2xl mx-auto mb-4">
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-4">Gestão do Plano</h2>
                        <p className="text-slate-500 font-bold text-lg leading-relaxed">Personalize sua experiência Otimizza e escale seu negócio.</p>
                    </div>

                    {loadingPlans ? (
                        <div className="py-20 flex justify-center text-slate-300"><Loader2 className="animate-spin" size={40} /></div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                            {plans.map(plan => {
                                const isCurrentPlan = profile?.plan === plan.slug || (profile?.plan === 'pro' && plan.slug === 'crm');
                                const campaign = activeCampaigns.find(c => c.plan_id === plan.id);
                                const currentPrice = campaign ? campaign.promo_price : plan.price;
                                const isBlack = plan.style?.color === 'black';

                                const cardBg = isCurrentPlan ? 'bg-white border-indigo-500 ring-4 ring-indigo-500/5' : (isBlack ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/50');
                                const textColor = isCurrentPlan ? 'text-slate-900' : (isBlack ? 'text-white' : 'text-slate-900');
                                const subTextColor = isCurrentPlan ? 'text-slate-500' : (isBlack ? 'text-slate-400' : 'text-slate-500');

                                const priceNode = (
                                    <div className="flex flex-col">
                                        {campaign && !isCurrentPlan && (
                                            <span className="text-xs font-bold text-rose-500 line-through mb-1">
                                                {formatCurrency(plan.price)}
                                            </span>
                                        )}
                                        <div className="flex items-baseline gap-2">
                                            <span className={`text-4xl font-black ${textColor}`}>
                                                {currentPrice === 0 ? 'Grátis' : formatCurrency(currentPrice)}
                                            </span>
                                            <span className={`text-sm font-bold capitalize ${subTextColor}`}>/ {plan.interval === 'day' ? `${plan.duration_days} dias` : plan.interval === 'month' ? 'mês' : 'ano'}</span>
                                        </div>
                                        {campaign && !isCurrentPlan && (
                                            <span className="text-[10px] font-black uppercase text-emerald-500 mt-1 tracking-wider">
                                                {campaign.promo_text}
                                            </span>
                                        )}
                                    </div>
                                );

                                return (
                                    <div key={plan.id} className={`relative p-8 rounded-[2.5rem] border-2 transition-all flex flex-col h-full group ${cardBg}`}>
                                        {isCurrentPlan && (
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/30 whitespace-nowrap z-10">
                                                Plano Atual
                                            </div>
                                        )}

                                        {campaign && !isCurrentPlan && (
                                            <div className="absolute -top-3 right-6 bg-red-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg transform rotate-2 z-10">
                                                Oferta Especial
                                            </div>
                                        )}

                                        <div className="mb-6">
                                            <span className={`p-3 rounded-2xl inline-flex mb-4 transition-transform group-hover:scale-110 ${!isCurrentPlan && isBlack ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                {plan.style?.icon === 'Star' && <Star size={24} fill="currentColor" />}
                                                {plan.style?.icon === 'Shield' && <Shield size={24} fill="currentColor" />}
                                                {plan.style?.icon === 'Crown' && <Crown size={24} fill="currentColor" />}
                                                {plan.style?.icon === 'Rocket' && <Rocket size={24} fill="currentColor" />}
                                                {plan.style?.icon === 'Gift' && <Gift size={24} fill="currentColor" />}
                                                {(!plan.style?.icon || plan.style?.icon === 'Zap') && <Zap size={24} fill="currentColor" />}
                                            </span>
                                            <h3 className={`text-xl font-black ${textColor}`}>{plan.name}</h3>
                                            <p className={`text-sm font-medium mt-2 leading-relaxed ${subTextColor}`}>{plan.description}</p>
                                        </div>

                                        <div className="mb-8 items-baseline">
                                            {priceNode}
                                        </div>

                                        <ul className="space-y-4 mb-8 flex-1">
                                            {plan.features.map((feat, i) => (
                                                <li key={i} className={`flex items-start gap-3 text-xs font-bold leading-tight ${textColor === 'text-white' ? 'text-slate-300' : 'text-slate-600'}`}>
                                                    <div className="mt-0.5 shrink-0">
                                                        <Check size={16} className="text-emerald-500" />
                                                    </div>
                                                    {feat}
                                                </li>
                                            ))}
                                        </ul>

                                        <button
                                            onClick={() => onUpgrade(plan)}
                                            disabled={isCurrentPlan}
                                            className={`w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all ${isCurrentPlan
                                                ? 'bg-emerald-50 text-emerald-600 cursor-default border border-emerald-100'
                                                : (isBlack
                                                    ? 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-xl shadow-emerald-500/20 active:scale-95'
                                                    : 'bg-slate-900 text-white hover:bg-emerald-500 shadow-xl shadow-slate-900/10 active:scale-95')
                                                }`}
                                        >
                                            {isCurrentPlan ? 'ATIVO' : (plan.style?.cta || 'Selecionar Plano')}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserArea;
