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
            const width = type === 'avatar' ? 200 : 500;
            const height = type === 'avatar' ? 200 : 125;

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
            {/* Fotos — faixa horizontal */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 flex flex-col sm:flex-row items-center gap-6">
                {/* Avatar */}
                <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-2xl bg-slate-50 border-2 border-slate-100 overflow-hidden flex items-center justify-center">
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <User size={32} className="text-slate-200" />
                            )}
                        </div>
                        <label className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-emerald-600 text-white rounded-lg cursor-pointer hover:bg-emerald-700 transition-all flex items-center justify-center shadow-md">
                            <Camera size={13} />
                            <input type="file" className="hidden" accept="image/*" onChange={e => handleUpload(e, 'avatar')} />
                        </label>
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-bold text-slate-700">{profile.full_name || 'Seu Nome'}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            {profile.role === 'super_admin' ? 'Super Admin' : profile.role === 'admin' ? 'Proprietário' : 'Vendedor'}
                        </p>
                    </div>
                </div>

                {/* Logo — apenas admins */}
                {profile.role !== 'user' && <>
                    <div className="w-px h-16 bg-slate-100 hidden sm:block" />
                    <div className="flex flex-col items-center gap-3">
                        <div className="relative">
                            <div className="w-32 h-10 rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden p-1">
                                {profile.company_logo ? (
                                    <img src={profile.company_logo} alt="" className="w-full h-full object-fill" />
                                ) : (
                                    <Building2 size={20} className="text-slate-200" />
                                )}
                            </div>
                            <label className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-slate-800 text-white rounded-lg cursor-pointer hover:bg-slate-900 transition-all flex items-center justify-center shadow-md">
                                <Camera size={13} />
                                <input type="file" className="hidden" accept="image/*" onChange={e => handleUpload(e, 'logo')} />
                            </label>
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-bold text-slate-700">{profile.company_name || 'Minha Empresa'}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Logo da Empresa</p>
                        </div>
                    </div>
                    <div className="sm:ml-auto text-[11px] text-slate-400 text-center sm:text-right max-w-[200px] leading-relaxed">
                        A logo é exibida para todos os funcionários da equipe.
                        <br/>
                        <span className="text-emerald-500 font-bold">Tamanho ideal: 500x125 pixels.</span>
                    </div>
                </>}
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
