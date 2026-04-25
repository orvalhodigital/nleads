import React, { useState } from 'react';
import { User, Mail, Building2, Target, Save, Loader2, Camera, Lock, PhoneIcon } from 'lucide-react';
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
                        <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-600 text-white rounded-xl cursor-pointer hover:bg-emerald-700 transition-all flex items-center justify-center shadow-lg border-2 border-white">
                            <Camera size={14} />
                            <input type="file" className="hidden" accept="image/*" onChange={e => handleUpload(e, 'avatar')} />
                        </label>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-bold text-slate-800 truncate">Foto de Perfil</h3>
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest rounded-md shrink-0">
                                {profile.role === 'super_admin' ? 'Super Admin' : profile.role === 'admin' ? 'Proprietário' : 'Vendedor'}
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed mb-2">
                            Sua foto de identificação no painel, chat de equipe e notificações.
                        </p>
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg">
                            <div className="w-1 h-1 rounded-full bg-emerald-500" />
                            <span className="text-[10px] font-bold text-slate-400">Tamanho ideal: 200x200 px</span>
                        </div>
                    </div>
                </div>

                {/* Logo da Empresa */}
                {profile.role !== 'user' && (
                    <div className="bg-white rounded-3xl border border-slate-100 p-6 flex items-start gap-5 transition-all hover:shadow-sm">
                        <div className="relative shrink-0">
                            <div className="w-32 h-20 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden flex items-center justify-center p-2 shadow-inner group">
                                {profile.company_logo ? (
                                    <img src={profile.company_logo} alt="" className="w-full h-full object-contain transition-transform group-hover:scale-105" />
                                ) : (
                                    <Building2 size={32} className="text-slate-200" />
                                )}
                            </div>
                            <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-slate-800 text-white rounded-xl cursor-pointer hover:bg-slate-900 transition-all flex items-center justify-center shadow-lg border-2 border-white">
                                <Camera size={14} />
                                <input type="file" className="hidden" accept="image/*" onChange={e => handleUpload(e, 'logo')} />
                            </label>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-slate-800 mb-1">Logotipo da Empresa</h3>
                            <p className="text-[11px] text-slate-500 leading-relaxed mb-2">
                                Exibida no cabeçalho do sistema e no seu site público de vendas para clientes.
                            </p>
                            <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg">
                                <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                <span className="text-[10px] font-bold text-slate-400">Tamanho ideal: 600x300 px</span>
                            </div>
                        </div>
                    </div>
                )}
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
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all"
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
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    placeholder="(00) 00000-0000"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 block">
                                Nome da Empresa {profile.role === 'user' && '(Inalterável)'}
                            </label>
                            <div className="relative">
                                <Building2 className={`absolute left-4 top-1/2 -translate-y-1/2 ${profile.role === 'user' ? 'text-slate-200' : 'text-slate-300'}`} size={16} />
                                <input
                                    type="text"
                                    disabled={profile.role === 'user'}
                                    className={`w-full pl-10 pr-4 py-3 border border-slate-100 rounded-2xl text-sm font-semibold transition-all outline-none ${
                                        profile.role === 'user'
                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                            : 'bg-slate-50 text-slate-800 focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/5'
                                    }`}
                                    value={companyName}
                                    onChange={e => setCompanyName(e.target.value)}
                                    placeholder="Nome da sua loja"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 block">Meta Mensal (Vendas)</label>
                            <div className="relative">
                                <Target className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                <input
                                    type="number"
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all"
                                    value={monthlySalesGoal}
                                    onChange={e => setMonthlySalesGoal(Number(e.target.value))}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 block">Nova Senha</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                <input
                                    type="password"
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all"
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
                            className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-emerald-600 transition-all shadow-sm active:scale-95 disabled:opacity-50"
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
