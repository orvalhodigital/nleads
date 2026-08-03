import React, { useState } from 'react';
import { User, Mail, Building2, Target, Save, Loader2, Camera, Lock, PhoneIcon, TrendingUp, CalendarCheck, DollarSign } from 'lucide-react';
import { Profile } from '../../types';
import { profileService } from '../../services/profileService';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabaseClient';
import { resizeImage } from '../../utils/imageProcessor';

interface Props {
    profile: Profile;
    onUpdate: () => void;
}

const ProfileSettings: React.FC<Props> = ({ profile, onUpdate }) => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [fullName, setFullName] = useState(profile.full_name || '');
    const [companyName, setCompanyName] = useState(profile.company_name || '');
    const [monthlySalesGoal, setMonthlySalesGoal] = useState<number>(profile.monthly_sales_goal || 10);
    const [monthlyLeadsGoal, setMonthlyLeadsGoal] = useState<number>(profile.monthly_leads_goal || 0);
    const [monthlyVisitsGoal, setMonthlyVisitsGoal] = useState<number>(profile.monthly_visits_goal || 0);
    const [monthlyRevenueGoal, setMonthlyRevenueGoal] = useState<number>(profile.monthly_revenue_goal || 0);
    const [phone, setPhone] = useState(profile.phone || '');
    const [newPassword, setNewPassword] = useState('');

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await profileService.updateProfile({
                full_name: fullName,
                company_name: companyName,
                monthly_sales_goal: monthlySalesGoal,
                monthly_leads_goal: monthlyLeadsGoal || undefined,
                monthly_visits_goal: monthlyVisitsGoal || undefined,
                monthly_revenue_goal: monthlyRevenueGoal || undefined,
                phone: phone
            });

            if (newPassword) {
                const { error } = await supabase.auth.updateUser({ password: newPassword });
                if (error) throw error;
                setNewPassword('');
                showToast('success', 'Perfil e senha atualizados!');
            } else {
                showToast('success', 'Perfil atualizado com sucesso!');
            }
            onUpdate();
        } catch (error: any) {
            showToast('error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'logo') => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLoading(true);
        try {
            const width = type === 'avatar' ? 200 : 600;
            const height = type === 'avatar' ? 200 : 300;

            const resized = await resizeImage(file, width, height);
            const fileName = `${profile.id}/${type}-${Date.now()}.png`;
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, resized, { contentType: 'image/png', upsert: true });
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
            if (type === 'avatar') {
                await profileService.updateProfile({ avatar_url: publicUrl });
            } else {
                await profileService.updateProfile({ company_logo: publicUrl });
            }
            onUpdate();
            showToast('success', `${type === 'avatar' ? 'Avatar' : 'Logo'} atualizado!`);
        } catch (error: any) {
            showToast('error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Fotos — Grid de upload */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Foto de Perfil */}
                <div className="bg-white rounded-3xl border border-slate-100 p-6 flex items-start gap-5 transition-all hover:shadow-sm">
                    <div className="relative shrink-0">
                        <div className="w-20 h-20 rounded-2xl bg-slate-50 border-2 border-slate-100 overflow-hidden flex items-center justify-center shadow-inner group">
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                            ) : (
                                <User size={32} className="text-slate-200" />
                            )}
                        </div>
                        <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-brand-600 text-white rounded-xl cursor-pointer hover:bg-brand-700 transition-all flex items-center justify-center shadow-lg border-2 border-white">
                            <Camera size={14} />
                            <input type="file" className="hidden" accept="image/*" onChange={e => handleUpload(e, 'avatar')} />
                        </label>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-bold text-slate-800 truncate">Foto de Perfil Pessoal</h3>
                            <span className="px-2 py-0.5 bg-brand-50 text-brand-600 text-[9px] font-black uppercase tracking-widest rounded-md shrink-0">
                                {profile.role === 'super_admin' ? 'Super Admin' : profile.role === 'admin' ? 'Proprietário' : profile.role === 'empresa' ? 'Empresa' : 'Vendedor'}
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed mb-2">
                            Sua foto de identificação no painel de controle e chat de equipe.
                        </p>
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg">
                            <div className="w-1 h-1 rounded-full bg-brand-500" />
                            <span className="text-[10px] font-bold text-slate-400">Tamanho ideal: 200x200 px</span>
                        </div>
                    </div>
                </div>

                {/* Card Informativo para a aba Empresa */}
                <div className="bg-brand-500/5 rounded-3xl border border-brand-500/15 p-6 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-600 flex items-center justify-center shrink-0 border border-brand-500/20">
                        <Building2 size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-slate-900 mb-1">Dados e Marca da Loja</h3>
                        <p className="text-xs text-slate-500 leading-relaxed mb-3">
                            O logotipo oficial, favicon, cores da marca, CNPJ e história da empresa estão centralizados na aba <span className="font-bold text-brand-600 uppercase">EMPRESA</span>.
                        </p>
                    </div>
                </div>
            </div>

            {/* Formulário */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6">
                <form onSubmit={handleUpdateProfile} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 block">Nome Completo</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                <input
                                    type="text"
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-brand-400 focus:ring-4 focus:ring-brand-500/5 outline-none transition-all"
                                    value={fullName}
                                    onChange={e => setFullName(e.target.value)}
                                    placeholder="Seu nome completo"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 block">E-mail (Inalterável)</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-200" size={16} />
                                <input
                                    type="email"
                                    disabled
                                    className="w-full pl-10 pr-4 py-3 bg-slate-100 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-400 cursor-not-allowed"
                                    value={profile.email}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 block">Telefone</label>
                            <div className="relative">
                                <PhoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                <input
                                    type="text"
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-brand-400 focus:ring-4 focus:ring-brand-500/5 outline-none transition-all"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    placeholder="(00) 00000-0000"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 block">Meta Mensal — Vendas (unid.)</label>
                            <div className="relative">
                                <Target className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                <input
                                    type="number"
                                    min={0}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-brand-400 focus:ring-4 focus:ring-brand-500/5 outline-none transition-all"
                                    value={monthlySalesGoal}
                                    onChange={e => setMonthlySalesGoal(Number(e.target.value))}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 block">Meta Mensal — Leads (unid.)</label>
                            <div className="relative">
                                <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                <input
                                    type="number"
                                    min={0}
                                    placeholder="0 = sem meta"
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-brand-400 focus:ring-4 focus:ring-brand-500/5 outline-none transition-all"
                                    value={monthlyLeadsGoal || ''}
                                    onChange={e => setMonthlyLeadsGoal(Number(e.target.value))}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 block">Meta Mensal — Visitas (unid.)</label>
                            <div className="relative">
                                <CalendarCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                <input
                                    type="number"
                                    min={0}
                                    placeholder="0 = sem meta"
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-brand-400 focus:ring-4 focus:ring-brand-500/5 outline-none transition-all"
                                    value={monthlyVisitsGoal || ''}
                                    onChange={e => setMonthlyVisitsGoal(Number(e.target.value))}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 block">Meta Mensal — Faturamento (R$)</label>
                            <div className="relative">
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                <input
                                    type="number"
                                    min={0}
                                    placeholder="0 = sem meta"
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-brand-400 focus:ring-4 focus:ring-brand-500/5 outline-none transition-all"
                                    value={monthlyRevenueGoal || ''}
                                    onChange={e => setMonthlyRevenueGoal(Number(e.target.value))}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 block">Nova Senha</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                <input
                                    type="password"
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-brand-400 focus:ring-4 focus:ring-brand-500/5 outline-none transition-all"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    placeholder="Deixe em branco para manter"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-8 py-3 bg-brand-500 text-white rounded-2xl font-bold text-sm hover:bg-brand-600 transition-all shadow-md shadow-brand-500/20 active:scale-95 disabled:opacity-50 border border-brand-400/30"
                        >
                            {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                            Salvar Perfil
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileSettings;
