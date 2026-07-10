import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { profileService } from '../services/profileService';
import { Profile } from '../types';
import { ArrowLeft, Save, Calendar, AlertTriangle, User } from 'lucide-react';
import { format } from 'date-fns';
import { CustomDatePicker } from '../components/ui/CustomDatePicker';

import Toast, { ToastType } from '../components/ui/Toast';

export default function AdminUserDetails() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);

    // Form states
    const [plan, setPlan] = useState<'trial' | 'pro'>('trial');
    const [planStatus, setPlanStatus] = useState<'active' | 'expired'>('active');
    const [trialEndsAt, setTrialEndsAt] = useState('');
    const [fullName, setFullName] = useState('');

    // Ads connections
    const [metaPixelId, setMetaPixelId] = useState('');
    const [metaAccessToken, setMetaAccessToken] = useState('');
    const [googleAdsClientId, setGoogleAdsClientId] = useState('');
    const [googleAdsDeveloperToken, setGoogleAdsDeveloperToken] = useState('');

    useEffect(() => {
        if (userId) {
            loadProfile();
        }
    }, [userId]);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const data = await profileService.getProfile(userId);
            if (data) {
                setProfile(data);
                setPlan(data.plan);
                setPlanStatus(data.planStatus);
                setFullName(data.full_name || '');
                // Handle date for input type="date" or "datetime-local"
                if (data.trialEndsAt) {
                    setTrialEndsAt(new Date(data.trialEndsAt).toISOString().split('T')[0]);
                }
                
                // Initialize ads connection fields
                setMetaPixelId((data as any).meta_pixel_id || '');
                setMetaAccessToken((data as any).meta_access_token || '');
                setGoogleAdsClientId((data as any).google_ads_client_id || '');
                setGoogleAdsDeveloperToken((data as any).google_ads_developer_token || '');
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            setToast({ type: 'error', message: 'Erro ao carregar perfil do usuário.' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!userId) return;
        setSaving(true);
        try {
            await profileService.updateProfile({
                plan,
                planStatus,
                trialEndsAt: trialEndsAt ? new Date(trialEndsAt).toISOString() : undefined,
                full_name: fullName,
                meta_pixel_id: metaPixelId,
                meta_access_token: metaAccessToken,
                google_ads_client_id: googleAdsClientId,
                google_ads_developer_token: googleAdsDeveloperToken
            } as any, userId);
            setToast({ type: 'success', message: 'Perfil atualizado com sucesso!' });
        } catch (error) {
            console.error('Error updating:', error);
            setToast({ type: 'error', message: 'Erro ao atualizar perfil.' });
        } finally {
            setSaving(false);
        }
    };

    const addTrialDays = (days: number) => {
        const current = trialEndsAt ? new Date(trialEndsAt) : new Date();
        const next = new Date(current.getTime() + days * 24 * 60 * 60 * 1000);
        setTrialEndsAt(next.toISOString().split('T')[0]);
    };

    if (loading) return <div className="p-10 text-center text-slate-400">Carregando dados...</div>;
    if (!profile) return <div className="p-10 text-center text-red-500">Usuário não encontrado.</div>;

    return (
        <div className="max-w-4xl mx-auto animate-fadeUp">
            {toast && (
                <Toast
                    type={toast.type}
                    message={toast.message}
                    onClose={() => setToast(null)}
                />
            )}
            <header className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate('/paineldoadm/users')}
                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Detalhes do Usuário</h1>
                    <p className="text-slate-500 text-sm">Gerencie o plano e permissões de acesso</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Info Card */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <User size={20} className="text-indigo-500" /> Informações Pessoais
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Nome Completo</label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={e => setFullName(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Email</label>
                                <div className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-slate-500 cursor-not-allowed">
                                    {profile.email}
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">ID do Usuário</label>
                                    <div className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-xs font-mono text-slate-400 truncate">
                                        {profile.id}
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Data de Cadastro</label>
                                    <div className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-slate-600">
                                        {profile.created_at ? format(new Date(profile.created_at), 'dd/MM/yyyy') : '-'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            Datas e Prazos
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Término do Trial / Plano</label>
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <CustomDatePicker
                                            value={trialEndsAt}
                                            onChange={(date) => setTrialEndsAt(date)}
                                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-medium"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-2">
                                    <button
                                        onClick={() => addTrialDays(7)}
                                        className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md font-bold hover:bg-indigo-100"
                                    >
                                        +7 Dias
                                    </button>
                                    <button
                                        onClick={() => addTrialDays(15)}
                                        className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md font-bold hover:bg-indigo-100"
                                    >
                                        +15 Dias
                                    </button>
                                    <button
                                        onClick={() => addTrialDays(30)}
                                        className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md font-bold hover:bg-indigo-100"
                                    >
                                        +30 Dias
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            Conexões Ads (Meta & Google)
                        </h3>
                        <div className="space-y-6">
                            {/* Meta Ads Group */}
                            <div className="border-b border-slate-100 pb-4">
                                <h4 className="text-sm font-bold text-slate-700 mb-4">Meta Ads</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Meta Pixel ID</label>
                                        <input
                                            type="text"
                                            value={metaPixelId}
                                            onChange={e => setMetaPixelId(e.target.value)}
                                            placeholder="Ex: 123456789012345"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Meta Access Token</label>
                                        <input
                                            type="text"
                                            value={metaAccessToken}
                                            onChange={e => setMetaAccessToken(e.target.value)}
                                            placeholder="Ex: EAAB..."
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Google Ads Group */}
                            <div>
                                <h4 className="text-sm font-bold text-slate-700 mb-4">Google Ads</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Google Ads Client Customer ID</label>
                                        <input
                                            type="text"
                                            value={googleAdsClientId}
                                            onChange={e => setGoogleAdsClientId(e.target.value)}
                                            placeholder="Ex: 123-456-7890"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Google Ads Developer Token</label>
                                        <input
                                            type="text"
                                            value={googleAdsDeveloperToken}
                                            onChange={e => setGoogleAdsDeveloperToken(e.target.value)}
                                            placeholder="Ex: abc123xyz..."
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status Card */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <AlertTriangle size={20} className="text-amber-500" /> Plano e Status
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Plano Atual</label>
                                <select
                                    value={plan}
                                    onChange={(e) => setPlan(e.target.value as any)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 outline-none focus:border-indigo-500 font-medium capitalize"
                                >
                                    <option value="trial">Trial (Teste)</option>
                                    <option value="pro">Pro (Pago)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Status da Assinatura</label>
                                <select
                                    value={planStatus}
                                    onChange={(e) => setPlanStatus(e.target.value as any)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 outline-none focus:border-indigo-500 font-medium capitalize"
                                >
                                    <option value="active">Ativo</option>
                                    <option value="expired">Expirado / Cancelado</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-100">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
                            >
                                {saving ? 'Salvando...' : <><Save size={18} /> Salvar Alterações</>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
