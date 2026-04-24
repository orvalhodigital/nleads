import React, { useState, useEffect } from 'react';
import { MessageCircle, CheckCircle2, AlertCircle, Loader2, Smartphone, Zap, Database, RefreshCcw, SmartphoneIcon, Link, Save } from 'lucide-react';
import { Profile } from '../../types';
import { profileService } from '../../services/profileService';
import { useToast } from '../../contexts/ToastContext';

interface Props {
    profile: Profile;
    onUpdate: () => void;
}

const WhatsAppSettings: React.FC<Props> = ({ profile, onUpdate }) => {
    const { showToast } = useToast();
    const [syncing, setSyncing] = useState(false);
    const [savingWebhook, setSavingWebhook] = useState(false);
    const [useCompanyNumber, setUseCompanyNumber] = useState(profile.use_company_number || false);
    const [whatsappStatus, setWhatsappStatus] = useState<'checking' | 'connected' | 'disconnected' | 'error'>('checking');
    const [sessionData, setSessionData] = useState<{ number?: string; name?: string } | null>(null);
    const [webhookUrl, setWebhookUrl] = useState(profile.whatsapp_webhook_url || '');

    const handleConnectWhatsApp = () => {
        const url = 'https://webhook.orvalhodigital.com.br/webhook/nLeads-veiculos-criar-instancia';
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
                headers: { 'Content-Type': 'application/json' },
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
            const response = await fetch('https://webhook.orvalhodigital.com.br/webhook/nleads-veiculos-verifica-conexao-whatsapp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
                    (data.instance && (data.instance.status === 'open' || data.instance.state === 'open'));

                if (isConnected) {
                    // Evolution API v1 / v2 — várias estruturas possíveis
                    const number =
                        data.instance?.owner ||
                        data.instance?.number ||
                        data.instance?.wuid ||
                        data.number ||
                        data.phone ||
                        data.wuid ||
                        data.owner ||
                        data.me?.id ||
                        data.me?.user;

                    const name =
                        data.instance?.profileName ||
                        data.instance?.name ||
                        data.name ||
                        data.pushName ||
                        data.me?.name;

                    if (number) {
                        setSessionData({
                            number: String(number).replace('@s.whatsapp.net', '').replace(/\D/g, ''),
                            name: name
                        });
                    } else {
                        setSessionData({ number: '—', name: undefined });
                    }
                }
            } catch (e) {
                const cleanText = text.trim().toLowerCase();
                isConnected = cleanText === 'connected' || cleanText === 'open';
            }

            if (isConnected) {
                setWhatsappStatus('connected');
                if (!silent) showToast('success', 'WhatsApp conectado e pronto para uso!');
            } else {
                setWhatsappStatus('disconnected');
                setSessionData(null);
                if (!silent) showToast('info', 'A instância está desconectada. Escaneie o QR Code.');
            }
        } catch (error) {
            console.error('Erro ao verificar conexão:', error);
            setWhatsappStatus('error');
            if (!silent) showToast('error', 'Erro ao verificar status da conexão.');
        }
    };

    useEffect(() => {
        if (profile) {
            handleVerifyConnection(true);
        }
    }, [profile]);

    return (
        <div className="space-y-10 animate-fadeUp">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Visual Card / Status Area */}
                <div className="space-y-8">
                    <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group border-b-8 border-slate-950">
                        <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform">
                            <Zap size={160} />
                        </div>

                        <div className="flex justify-between items-start mb-8">
                            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                                <MessageCircle size={32} className="text-emerald-500" />
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-1">Status Global</span>
                                <div className={`px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-2 ${
                                    whatsappStatus === 'connected' ? 'bg-emerald-500 text-white' :
                                    whatsappStatus === 'checking' ? 'bg-slate-700 text-slate-300 animate-pulse' :
                                    'bg-rose-500 text-white'
                                }`}>
                                    {whatsappStatus === 'connected' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                                    {whatsappStatus === 'connected' ? 'Conectado' :
                                     whatsappStatus === 'checking' ? 'Verificando...' :
                                     'Desconectado'}
                                </div>
                            </div>
                        </div>

                        <h2 className="text-3xl font-black mb-4">Central de WhatsApp</h2>
                        <p className="text-slate-400 font-medium leading-relaxed mb-6">
                            Automatize o contato com seus leads. Envie boas-vindas, ofertas e agendamentos de forma oficial e segura.
                        </p>

                        {sessionData?.number && (
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-8 flex items-center gap-4 animate-fadeIn">
                                <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-500">
                                    <Smartphone size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Número Conectado</p>
                                    <p className="text-lg font-black text-white">+{sessionData.number}</p>
                                </div>
                            </div>
                        )}

                        {!sessionData?.number && whatsappStatus !== 'checking' && (
                            <div className="bg-white/5 border border-white/10 border-dashed rounded-2xl p-4 mb-8 flex items-center gap-4 animate-fadeIn">
                                <div className="w-10 h-10 bg-slate-500/10 rounded-xl flex items-center justify-center text-slate-500">
                                    <Smartphone size={20} className="opacity-50" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Status da Instância</p>
                                    <p className="text-sm font-bold text-slate-400 italic">Nenhum número conectado</p>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button
                                onClick={handleConnectWhatsApp}
                                className="px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-sm transition-all active:scale-95 shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 border-b-4 border-emerald-800"
                            >
                                <Zap size={18} /> Conectar WhatsApp
                            </button>
                            <button
                                onClick={() => handleVerifyConnection(false)}
                                className="px-6 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black text-sm transition-all active:scale-95 border border-white/10 flex items-center justify-center gap-2"
                            >
                                <RefreshCcw size={18} className={whatsappStatus === 'checking' ? 'animate-spin' : ''} /> Verificar
                            </button>
                        </div>
                    </div>
                </div>

                {/* Form Area */}
                <div className="space-y-8">
                    {(profile?.role !== 'admin' && profile?.role !== 'super_admin') && (
                        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 animate-fadeUp">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
                                    <SmartphoneIcon size={24} />
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-slate-900">Número de Origem</h4>
                                    <p className="text-xs font-medium text-slate-400">Defina qual número enviará as mensagens.</p>
                                </div>
                            </div>

                            <div className="flex bg-slate-50 p-2 rounded-[1.5rem] border border-slate-100">
                                <button
                                    onClick={async () => {
                                        setUseCompanyNumber(true);
                                        try {
                                            await profileService.updateProfile({ use_company_number: true });
                                            showToast('success', 'Usando número da loja para notificações.');
                                            onUpdate();
                                        } catch (e: any) { showToast('error', e.message); }
                                    }}
                                    className={`flex-1 py-3 px-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${useCompanyNumber ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:scale-105'}`}
                                >
                                    Número da Loja
                                </button>
                                <button
                                    onClick={async () => {
                                        setUseCompanyNumber(false);
                                        try {
                                            await profileService.updateProfile({ use_company_number: false });
                                            showToast('success', 'Usando número pessoal do vendedor.');
                                            onUpdate();
                                        } catch (e: any) { showToast('error', e.message); }
                                    }}
                                    className={`flex-1 py-3 px-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${!useCompanyNumber ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:scale-105'}`}
                                >
                                    Número Pessoal
                                </button>
                            </div>
                            <p className="text-[10px] text-slate-400 italic px-2 mt-4 leading-relaxed">
                                * Selecione 'Número da Loja' para usar o número central configurado ou 'Número Pessoal' para usar o número de cada colaborador.
                            </p>
                        </div>
                    )}

                    <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-8 animate-fadeUp">
                        <div className="space-y-4">
                            <h3 className="text-xl font-black text-slate-900 border-l-4 border-emerald-500 pl-4 uppercase tracking-tight">Configurações Avançadas</h3>
                            <p className="text-sm font-medium text-slate-400">Vincule seu receptor oficial para automações personalizadas.</p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                                    <Link size={12} />
                                    Webhook de Envio de Mensagens
                                </label>
                                <div className="flex gap-3">
                                    <input
                                        type="url"
                                        value={webhookUrl}
                                        onChange={e => setWebhookUrl(e.target.value)}
                                        placeholder="https://webhook.orvalhodigital.com.br/webhook/..."
                                        className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-[1rem] text-sm font-medium text-slate-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10 transition-all placeholder:text-slate-300"
                                    />
                                    <button
                                        onClick={async () => {
                                            setSavingWebhook(true);
                                            try {
                                                await profileService.updateProfile({ whatsapp_webhook_url: webhookUrl });
                                                showToast('success', 'Webhook salvo com sucesso!');
                                                onUpdate();
                                            } catch (e: any) {
                                                showToast('error', e.message);
                                            } finally {
                                                setSavingWebhook(false);
                                            }
                                        }}
                                        disabled={savingWebhook}
                                        className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[1rem] font-black text-sm transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                                    >
                                        {savingWebhook ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    </button>
                                </div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                                    URL do n8n responsável por enviar mensagens WhatsApp aos leads
                                </p>
                            </div>

                            <div className="pt-6 border-t border-slate-100">
                                <button
                                    onClick={handleSyncContacts}
                                    disabled={syncing}
                                    className="w-full py-5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-[1.5rem] font-black text-sm flex items-center justify-center gap-3 transition-all active:scale-[0.98] border border-emerald-200 border-dashed"
                                >
                                    {syncing ? <Loader2 className="animate-spin" size={20} /> : <><Database size={20} /> Sincronizar todos os contatos como Leads</>}
                                </button>
                                <p className="text-[9px] text-center font-bold text-slate-400 uppercase tracking-widest mt-4">Ação recomendada ao iniciar a conta</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WhatsAppSettings;
