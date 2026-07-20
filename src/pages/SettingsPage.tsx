import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Save,
    Settings as SettingsIcon,
    Shield,
    Car,
    Bike,
    ToggleLeft,
    ToggleRight,
    Clock,
    User,
    MessageCircle,
    CreditCard,
    MessageSquare,
    Wrench,
    Users,
    Globe,
    Award,
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabaseClient';
import { profileService } from '../services/profileService';
import ProfileSettings from '../components/settings/ProfileSettings';
import WhatsAppSettings from '../components/settings/WhatsAppSettings';
import MessageSettings from '../components/settings/MessageSettings';
import PlanSettings from '../components/settings/PlanSettings';
import TeamManager from '../components/TeamManager';
import WebsiteSettings from '../components/settings/WebsiteSettings';
import GuaranteeSettings from '../components/settings/GuaranteeSettings';
import PageContainer from '../components/ui/PageContainer';

interface BusinessHourEntry {
    day: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    open: boolean;
    start: string;
    end: string;
}

type Tab = 'Perfil' | 'WhatsApp' | 'Mensagens' | 'Planos' | 'Website' | 'Garantia' | 'Geral' | 'Equipe';

const BASE_TABS: Tab[] = ['Perfil', 'WhatsApp', 'Mensagens', 'Planos', 'Website', 'Garantia', 'Geral'];

const TAB_ICONS: Record<Tab, React.ReactNode> = {
    'Perfil': <User size={15} />,
    'WhatsApp': <MessageCircle size={15} />,
    'Mensagens': <MessageSquare size={15} />,
    'Planos': <CreditCard size={15} />,
    'Website': <Globe size={15} />,
    'Garantia': <Award size={15} />,
    'Geral': <Wrench size={15} />,
    'Equipe': <Users size={15} />,
};

const SettingsPage: React.FC = () => {
    const { profile, refreshProfile, isEmpresa } = useData();
    const { showToast } = useToast();
    const [searchParams, setSearchParams] = useSearchParams();
    const tabParam = searchParams.get('tab') as Tab;
    const [activeTab, setActiveTab] = useState<Tab>(tabParam || 'Perfil');
    const tabs: Tab[] = isEmpresa ? [...BASE_TABS, 'Equipe'] : BASE_TABS;

    useEffect(() => {
        const tab = searchParams.get('tab') as Tab;
        if (tab && tabs.includes(tab)) {
            setActiveTab(tab);
        }
    }, [searchParams, tabs]);

    const handleTabChange = (tab: Tab) => {
        setActiveTab(tab);
        setSearchParams({ tab });
    };

    const [loading, setLoading] = useState(false);
    const [enableCars, setEnableCars] = useState(profile?.enable_cars !== false);
    const [enableMotorcycles, setEnableMotorcycles] = useState(profile?.enable_motorcycles || false);
    const [businessHours, setBusinessHours] = useState<BusinessHourEntry[]>([
        { day: 0, open: false, start: '09:00', end: '18:00' },
        { day: 1, open: true,  start: '08:00', end: '18:00' },
        { day: 2, open: true,  start: '08:00', end: '18:00' },
        { day: 3, open: true,  start: '08:00', end: '18:00' },
        { day: 4, open: true,  start: '08:00', end: '18:00' },
        { day: 5, open: true,  start: '08:00', end: '18:00' },
        { day: 6, open: true,  start: '08:00', end: '13:00' },
    ]);

    useEffect(() => {
        setEnableCars(profile?.enable_cars !== false);
        setEnableMotorcycles(profile?.enable_motorcycles || false);
        if (profile?.business_hours && Array.isArray(profile.business_hours) && profile.business_hours.length > 0) {
            setBusinessHours(profile.business_hours as BusinessHourEntry[]);
        }
    }, [profile]);

    const handleSaveGeral = async () => {
        setLoading(true);
        try {
            await supabase.auth.updateUser({
                data: {
                    enable_cars: enableCars,
                    enable_motorcycles: enableMotorcycles
                }
            });

            if (profile?.id) {
                await profileService.updateProfile({ business_hours: businessHours });
            }

            await refreshProfile();
            showToast('success', 'Configurações salvas com sucesso!');
        } catch (error: any) {
            console.error(error);
            showToast('error', 'Erro ao salvar configurações.');
        } finally {
            setLoading(false);
        }
    };

    if (!profile) return null;

    return (
        <PageContainer className="space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <SettingsIcon size={24} className="text-brand-500" />
                    Configurações
                </h1>
                <p className="text-slate-400 font-bold text-sm mt-1">Gerencie suas preferências e conexões do sistema</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 flex-wrap">
                {tabs.map(tab => (
                    <button
                        key={tab}
                        onClick={() => handleTabChange(tab)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${
                            activeTab === tab
                                ? 'bg-slate-900 text-white shadow-lg'
                                : 'bg-white text-slate-500 border border-slate-100 hover:border-slate-200 hover:text-slate-700'
                        }`}
                    >
                        {TAB_ICONS[tab]}
                        {tab}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'Perfil' && (
                <ProfileSettings profile={profile} onUpdate={refreshProfile} />
            )}

            {activeTab === 'WhatsApp' && (
                <WhatsAppSettings profile={profile} onUpdate={refreshProfile} />
            )}

            {activeTab === 'Mensagens' && (
                <MessageSettings profile={profile} onUpdate={refreshProfile} />
            )}

            {activeTab === 'Planos' && (
                <PlanSettings profile={profile} />
            )}

            {activeTab === 'Website' && (
                <WebsiteSettings profile={profile} onUpdate={refreshProfile} />
            )}

            {activeTab === 'Garantia' && (
                <GuaranteeSettings onSave={refreshProfile} />
            )}

            {activeTab === 'Equipe' && isEmpresa && (
                <TeamManager adminProfile={profile} />
            )}

            {activeTab === 'Geral' && (
                <div className="space-y-8">
                    {/* Tipos de Veículos */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Car className="text-brand-500" size={24} />
                                Tipos de Veículos em Estoque
                            </h2>
                            <p className="text-sm text-slate-500 mt-1">
                                Marque os tipos de veículos que sua loja trabalha. As páginas correspondentes aparecerão no menu lateral.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${enableCars ? 'bg-brand-50 border-brand-100' : 'bg-slate-50 border-slate-100'}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${enableCars ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : 'bg-slate-200 text-slate-400'}`}>
                                        <Car size={22} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">Carros</p>
                                        <p className="text-[10px] font-medium text-slate-400">Gerenciamento de veículos leves</p>
                                    </div>
                                </div>
                                <button onClick={() => setEnableCars(!enableCars)} className="focus:outline-none">
                                    {enableCars
                                        ? <ToggleRight size={36} className="text-brand-500" />
                                        : <ToggleLeft size={36} className="text-slate-300" />}
                                </button>
                            </div>

                            <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${enableMotorcycles ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100'}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${enableMotorcycles ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-200 text-slate-400'}`}>
                                        <Bike size={22} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">Motos</p>
                                        <p className="text-[10px] font-medium text-slate-400">Gerenciamento de motocicletas</p>
                                    </div>
                                </div>
                                <button onClick={() => setEnableMotorcycles(!enableMotorcycles)} className="focus:outline-none">
                                    {enableMotorcycles
                                        ? <ToggleRight size={36} className="text-blue-500" />
                                        : <ToggleLeft size={36} className="text-slate-300" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Horário de Funcionamento */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Clock className="text-brand-500" size={24} />
                                Horário de Funcionamento
                            </h2>
                            <p className="text-sm text-slate-500 mt-1">
                                Configure os horários de funcionamento da sua loja para o site público. Esses horários serão usados ao agendar test drives.
                            </p>
                        </div>

                        <div className="space-y-3">
                            {businessHours.map((hour, index) => {
                                const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
                                return (
                                    <div key={index} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${hour.open ? 'bg-brand-50 border-brand-100' : 'bg-slate-50 border-slate-100'}`}>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-slate-900">{dayNames[hour.day]}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {hour.open ? (
                                                <>
                                                    <input
                                                        type="time"
                                                        value={hour.start}
                                                        onChange={(e) => {
                                                            const newHours = [...businessHours];
                                                            newHours[index].start = e.target.value;
                                                            setBusinessHours(newHours);
                                                        }}
                                                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400"
                                                    />
                                                    <span className="text-xs font-medium text-slate-500">até</span>
                                                    <input
                                                        type="time"
                                                        value={hour.end}
                                                        onChange={(e) => {
                                                            const newHours = [...businessHours];
                                                            newHours[index].end = e.target.value;
                                                            setBusinessHours(newHours);
                                                        }}
                                                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400"
                                                    />
                                                </>
                                            ) : (
                                                <span className="text-xs font-medium text-slate-400">Fechado</span>
                                            )}
                                            <button
                                                onClick={() => {
                                                    const newHours = [...businessHours];
                                                    newHours[index].open = !newHours[index].open;
                                                    setBusinessHours(newHours);
                                                }}
                                                className="focus:outline-none"
                                            >
                                                {hour.open
                                                    ? <ToggleRight size={28} className="text-brand-500" />
                                                    : <ToggleLeft size={28} className="text-slate-300" />}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Segurança */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Shield className="text-slate-400" size={24} />
                            Segurança
                        </h2>
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex gap-4">
                            <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-lg flex items-center justify-center shrink-0">
                                <Shield size={20} />
                            </div>
                            <div className="text-sm text-slate-600 leading-relaxed">
                                Suas informações estão protegidas e criptografadas. O Gestor de Pátio utiliza as melhores práticas de segurança para garantir a integridade dos seus dados.
                            </div>
                        </div>
                    </div>

                    {/* Salvar */}
                    <div className="flex justify-end">
                        <button
                            onClick={handleSaveGeral}
                            disabled={loading}
                            className="w-full md:w-auto md:min-w-[200px] bg-brand-500 text-white py-4 px-8 rounded-2xl shadow-xl shadow-brand-500/20 flex items-center justify-center gap-3 font-bold hover:bg-brand-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group border border-brand-400/30"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Save size={20} className="group-hover:rotate-12 transition-transform" />
                                    Salvar Configurações
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </PageContainer>
    );
};

export default SettingsPage;
