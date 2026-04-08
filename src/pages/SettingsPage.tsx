
import React, { useState, useEffect } from 'react';
import {
    Database,
    Upload,
    Save,
    Settings as SettingsIcon,
    Shield,
    MessageCircle,
    Car,
    Bike,
    Truck,
    ToggleLeft,
    ToggleRight
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabaseClient';
import UserArea from '../components/UserArea';
import { DEFAULT_PRESET_MESSAGES } from '../utils/constants';

const SettingsPage: React.FC = () => {
    const { profile, refreshProfile } = useData();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [enableCars, setEnableCars] = useState(profile?.enable_cars !== false);
    const [enableMotorcycles, setEnableMotorcycles] = useState(profile?.enable_motorcycles || false);
    const [presetMessages, setPresetMessages] = useState<string[]>(
        profile?.preset_messages?.length === 10 ? profile.preset_messages : DEFAULT_PRESET_MESSAGES
    );

    useEffect(() => {
        setEnableCars(profile?.enable_cars !== false);
        setEnableMotorcycles(profile?.enable_motorcycles || false);
        if (profile?.preset_messages?.length === 10) {
            setPresetMessages(profile.preset_messages);
        } else if (profile && (!profile.preset_messages || profile.preset_messages.length === 0)) {
            // Se veio vazio e carregou o perfil, inicializa com 10 padrões
            setPresetMessages(DEFAULT_PRESET_MESSAGES);
        }
    }, [profile]);

    // WhatsApp state
    const [whatsappStatus, setWhatsappStatus] = useState<'checking' | 'connected' | 'disconnected' | 'error'>('checking');
    const [instanceName, setInstanceName] = useState('');

    useEffect(() => {
        if (profile) {
            // Realiza a verificação completa automaticamente ao carregar
            handleVerifyConnection(true);
        }
    }, [profile]);

    const checkWhatsAppStatus = async () => {
        if (!profile?.email) return;
        setWhatsappStatus('checking');
        try {
            const response = await fetch('https://webhook.orvalhodigital.com.br/webhook/veiculos-nleads-status-whatsapp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: profile.email,
                    user_email: profile.email
                })
            });

            if (!response.ok) {
                setWhatsappStatus('disconnected');
                return;
            }

            const text = await response.text();

            let isConnected = false;
            try {
                const data = JSON.parse(text);
                isConnected = data.status === 'connected' ||
                    data.status === 'open' ||
                    data.success === true ||
                    (data.instance && data.instance.status === 'open');
            } catch (e) {
                const cleanText = text.trim().toLowerCase();
                isConnected = cleanText === 'connected' || cleanText === 'open';
            }

            if (isConnected) setWhatsappStatus('connected');
            else setWhatsappStatus('disconnected');
        } catch (error) {
            console.error('WA Status check failed:', error);
            setWhatsappStatus('disconnected');
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            // Save vehicle type toggles to user_metadata (avoids needing DB columns)
            await supabase.auth.updateUser({
                data: {
                    enable_cars: enableCars,
                    enable_motorcycles: enableMotorcycles
                }
            });

            if (profile?.id) {
                // Garante que sempre salvamos exatamente 10 mensagens
                const normalizedMessages = Array(10).fill('').map((_, i) => presetMessages[i] || '');
                await supabase
                    .from('profiles')
                    .update({ preset_messages: normalizedMessages })
                    .eq('id', profile.id);
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

    const handleConnectWhatsApp = () => {
        const url = 'https://webhook.orvalhodigital.com.br/webhook/nLeads-criar-instancia';
        const width = 600;
        const height = 700;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;

        window.open(
            url,
            'ConnectWhatsApp',
            `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes,status=yes`
        );
    };

    const handleSyncContacts = async () => {
        if (!confirm('Você deseja sincronizar todos os contatos do seu WhatsApp como Leads? Isso pode levar alguns minutos se você tiver muitos contatos.')) {
            return;
        }

        setSyncing(true);
        try {
            const response = await fetch('https://webhook.orvalhodigital.com.br/webhook/veiculos-nleads-puxar-contatos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: profile?.id,
                    email: profile?.email,
                    companyName: profile?.company_name
                }),
            });

            if (!response.ok) throw new Error('Falha na resposta do servidor');

            showToast('success', 'Sincronização iniciada com sucesso!');
        } catch (error) {
            console.error('Erro na sincronização:', error);
            showToast('error', 'Erro ao iniciar sincronização de contatos.');
        } finally {
            setSyncing(false);
        }
    };

    const handleVerifyConnection = async (silent = false) => {
        if (!profile?.email) return;
        setWhatsappStatus('checking');
        try {
            const response = await fetch('https://webhook.orvalhodigital.com.br/webhook/v-nleads-verifica-conexao-whatsapp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: profile.email,
                    user_email: profile.email,
                    userId: profile.id
                }),
            });

            if (!response.ok) throw new Error('Falha na resposta do servidor');

            const text = await response.text();

            let isConnected = false;
            try {
                const data = JSON.parse(text);
                isConnected = data.status === 'connected' ||
                    data.status === 'open' ||
                    data.success === true ||
                    (data.instance && data.instance.status === 'open');
            } catch (e) {
                const cleanText = text.trim().toLowerCase();
                isConnected = cleanText === 'connected' || cleanText === 'open';
            }

            if (isConnected) {
                setWhatsappStatus('connected');
                if (!silent) showToast('success', 'WhatsApp conectado e pronto para uso!');
            } else {
                setWhatsappStatus('disconnected');
                if (!silent) showToast('info', 'A instância está desconectada. Escaneie o QR Code.');
            }
        } catch (error) {
            console.error('Erro ao verificar conexão:', error);
            setWhatsappStatus('error');
            if (!silent) showToast('error', 'Erro ao verificar status da conexão.');
        }
    };

    return (
        <div className="flex-1 space-y-10">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <SettingsIcon size={24} className="text-emerald-500" />
                    Configurações
                </h1>
                <p className="text-slate-400 font-bold text-sm mt-1">Gerencie suas preferências e conexões do sistema</p>
            </div>

            <UserArea
                profile={profile}
                onUpgrade={() => {
                    const paymentLink = 'https://buy.stripe.com/dRm9AT0wEe5s93G0DY4ZG00';
                    const url = profile?.email
                        ? `${paymentLink}?prefilled_email=${encodeURIComponent(profile.email)}`
                        : paymentLink;
                    window.open(url, '_blank');
                }}
                onProfileUpdate={refreshProfile}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: General */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Vehicle Types Section */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Car className="text-emerald-500" size={24} />
                                Tipos de Veículos em Estoque
                            </h2>
                        </div>
                        <p className="text-sm text-slate-500 -mt-2">
                            Marque os tipos de veículos que sua loja trabalha. As páginas correspondentes aparecerão no menu lateral.
                        </p>

                        <div className="space-y-4">
                            {/* Cars */}
                            <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${enableCars ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${enableCars ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-200 text-slate-400'}`}>
                                        <Car size={22} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">Carros</p>
                                        <p className="text-[10px] font-medium text-slate-400">Gerenciamento de veículos leves</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setEnableCars(!enableCars)}
                                    className="focus:outline-none"
                                >
                                    {enableCars ? (
                                        <ToggleRight size={36} className="text-emerald-500" />
                                    ) : (
                                        <ToggleLeft size={36} className="text-slate-300" />
                                    )}
                                </button>
                            </div>

                            {/* Motorcycles */}
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
                                <button
                                    onClick={() => setEnableMotorcycles(!enableMotorcycles)}
                                    className="focus:outline-none"
                                >
                                    {enableMotorcycles ? (
                                        <ToggleRight size={36} className="text-blue-500" />
                                    ) : (
                                        <ToggleLeft size={36} className="text-slate-300" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Save button for vehicle types */}
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                        >
                            <Save size={14} />
                            {loading ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>

                    {/* Security Info */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Shield className="text-slate-400" size={24} />
                                Segurança
                            </h2>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex gap-4">
                            <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-lg flex items-center justify-center shrink-0">
                                <Shield size={20} />
                            </div>
                            <div className="text-sm text-slate-600 leading-relaxed">
                                Suas informações estão protegidas e criptografadas. O nLeads utiliza as melhores práticas de segurança para garantir a integridade dos seus dados.
                            </div>
                        </div>
                    </div>

                    {/* Preset Messages */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6">
                        <div className="flex items-center justify-between xl:flex-row flex-col xl:items-center items-start gap-4">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <MessageCircle className="text-emerald-500" size={24} />
                                Mensagens Predefinidas
                            </h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                Variáveis disponíveis: {'{nome}, {marca}, {modelo}, {ano}, {valor}'}
                            </p>
                        </div>
                        <p className="text-sm text-slate-500 -mt-2 mb-4">
                            O sistema escolherá aleatoriamente uma dessas 10 mensagens na hora de enviar sugestões ao lead.
                        </p>

                        <div className="space-y-4">
                            {presetMessages.map((msg, index) => (
                                <div key={index} className="flex gap-3 items-start">
                                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex flex-shrink-0 items-center justify-center text-[10px] font-black mt-2">
                                        {index + 1}
                                    </span>
                                    <textarea
                                        value={msg}
                                        onChange={(e) => {
                                            const newMsgs = [...presetMessages];
                                            newMsgs[index] = e.target.value;
                                            setPresetMessages(newMsgs);
                                        }}
                                        className="w-full text-sm font-medium p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 transition-all outline-none resize-none"
                                        rows={2}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Shortcuts */}
                <div className="space-y-6">
                    {/* WhatsApp Business Card */}
                    <div className="bg-emerald-50 rounded-3xl p-8 border border-emerald-100">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-bold text-emerald-900 flex items-center gap-2">
                                <MessageCircle className="text-emerald-500" size={20} />
                                WhatsApp Business
                            </h3>
                            <button
                                onClick={checkWhatsAppStatus}
                                className="p-1.5 hover:bg-emerald-100 rounded-lg transition-colors text-emerald-600"
                                title="Recarregar Status"
                            >
                                <Database size={14} className={whatsappStatus === 'checking' ? 'animate-spin' : ''} />
                            </button>
                        </div>

                        {/* Connection Status Badge */}
                        <div className="mb-6 flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800/40">Status:</span>
                            {whatsappStatus === 'checking' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 animate-pulse">Consultando...</span>
                            )}
                            {whatsappStatus === 'connected' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white">Conectado</span>
                            )}
                            {whatsappStatus === 'disconnected' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">Desconectado</span>
                            )}
                            {whatsappStatus === 'error' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white">Erro técnico</span>
                            )}
                        </div>

                        <p className="text-sm text-emerald-800/60 mb-6 leading-relaxed">
                            Conecte seu número para automatizar o envio de mensagens para seus leads.
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={handleConnectWhatsApp}
                                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                            >
                                Configurar WhatsApp
                            </button>

                            <button
                                onClick={handleSyncContacts}
                                disabled={syncing}
                                className="w-full py-3 bg-white border border-emerald-200 text-emerald-600 hover:bg-emerald-50 rounded-xl text-xs font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {syncing ? (
                                    <div className="w-4 h-4 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
                                ) : (
                                    <>Sincronizar Contatos</>
                                )}
                            </button>

                            <button
                                onClick={() => handleVerifyConnection(false)}
                                className="w-full py-3 bg-white border border-emerald-200 text-emerald-600 hover:bg-emerald-50 rounded-xl text-xs font-bold uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                Verificar Conexão
                            </button>
                        </div>
                    </div>

                </div>
            </div>

            {/* Action Bar */}
            <div className="pt-6 border-t border-slate-100 flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full md:w-auto md:min-w-[200px] bg-slate-900 text-white py-4 px-8 rounded-2xl shadow-xl shadow-slate-900/20 flex items-center justify-center gap-3 font-bold hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        <>
                            <Save size={20} className="group-hover:rotate-12 transition-transform" />
                            Salvar Configurações
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default SettingsPage;
