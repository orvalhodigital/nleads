
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { OnboardingSession, Profile } from '../types';
import {
    Rocket,
    Calendar,
    CheckCircle2,
    Clock,
    Search,
    MoreHorizontal,
    MessageSquare,
    Video,
    BarChart3,
    ArrowRight,
    Play,
    Star,
    AlertCircle,
    Settings,
    Target,
    TrendingUp
} from 'lucide-react';
import { format, isToday, isTomorrow, parseISO, startOfDay } from 'date-fns';
import { CustomDatePicker } from '../components/ui/CustomDatePicker';
import { CustomTimePicker } from '../components/ui/CustomTimePicker';
import { ptBR } from 'date-fns/locale';

export default function AdminOnboarding() {
    const [sessions, setSessions] = useState<OnboardingSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'dashboard' | 'agenda'>('dashboard');
    const [selectedSession, setSelectedSession] = useState<OnboardingSession | null>(null);

    useEffect(() => {
        fetchOnboardingData();
    }, []);

    const fetchOnboardingData = async () => {
        try {
            setLoading(true);

            // 1. Busca todos os usuários
            const { data: profiles, error: pError } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'user')
                .order('created_at', { ascending: false });

            if (pError) throw pError;

            // 2. Busca todos os registros de onboarding existentes
            const { data: onboardingData, error: oError } = await supabase
                .from('onboarding_sessions')
                .select('*');

            // Se a tabela não existir ainda ou der erro, tratamos como vazio em vez de travar
            const sessionsMap = (onboardingData || []).reduce((acc, s) => {
                acc[s.user_id] = s;
                return acc;
            }, {} as Record<string, any>);

            // 3. Junta os dados em memória
            const mergedData = (profiles || []).map(p => {
                const session = sessionsMap[p.id] || {
                    user_id: p.id,
                    step_welcome_meeting: false,
                    step_educational_materials: false,
                    step_technical_setup: false,
                    step_traffic_setup: false,
                    step_pixel_configured: false,
                    step_first_activation: false,
                    step_followup_success: false,
                    step_referral_request: false
                };

                return {
                    ...session,
                    profiles: {
                        ...p,
                        planStatus: p.plan_status || 'active',
                        plan: p.plan || 'trial'
                    }
                };
            });

            setSessions(mergedData as any);
        } catch (error) {
            console.error('Erro ao carregar onboarding:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleStep = async (session: any, field: string, currentValue: boolean) => {
        try {
            let sessionId = session.id;
            // Se não tem ID, é porque o registro na onboarding_sessions ainda não existe
            if (!sessionId) {
                const { data, error } = await supabase
                    .from('onboarding_sessions')
                    .insert({ user_id: session.user_id, [field]: !currentValue })
                    .select()
                    .single();
                if (error) throw error;
                sessionId = data.id;
            } else {
                const { error } = await supabase
                    .from('onboarding_sessions')
                    .update({ [field]: !currentValue, updated_at: new Date().toISOString() })
                    .eq('id', sessionId);
                if (error) throw error;
            }

            // Lógica automática: Se marcou Setup Técnico como concluído, sugere Review em 30 dias
            if (field === 'step_technical_setup' && !currentValue && !session.review_30d_date) {
                const thirtyDaysLater = new Date();
                thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
                await supabase
                    .from('onboarding_sessions')
                    .update({ review_30d_date: thirtyDaysLater.toISOString() })
                    .eq('id', sessionId);
            }

            // Atualiza localmente para ser instantâneo
            if (selectedSession && selectedSession.user_id === session.user_id) {
                setSelectedSession({ ...selectedSession, id: sessionId, [field]: !currentValue });
            }

            fetchOnboardingData();
        } catch (error) {
            console.error('Error updating step:', error);
        }
    };

    const updateDate = async (session: any, field: string, date: string) => {
        try {
            let sessionId = session.id;
            if (!sessionId) {
                const { data, error } = await supabase
                    .from('onboarding_sessions')
                    .insert({ user_id: session.user_id, [field]: date })
                    .select()
                    .single();
                if (error) throw error;
                sessionId = data.id;
            } else {
                const { error } = await supabase
                    .from('onboarding_sessions')
                    .update({ [field]: date, updated_at: new Date().toISOString() })
                    .eq('id', sessionId);
                if (error) throw error;
            }

            if (selectedSession && selectedSession.user_id === session.user_id) {
                setSelectedSession({ ...selectedSession, id: sessionId, [field]: date });
            }

            fetchOnboardingData();
        } catch (error) {
            console.error('Error updating date:', error);
        }
    };

    const updateNotes = async (session: any, notes: string) => {
        try {
            let sessionId = session.id;
            if (!sessionId) {
                const { data, error } = await supabase
                    .from('onboarding_sessions')
                    .insert({ user_id: session.user_id, notes })
                    .select()
                    .single();
                if (error) throw error;
                sessionId = data.id;
            } else {
                const { error } = await supabase
                    .from('onboarding_sessions')
                    .update({ notes, updated_at: new Date().toISOString() })
                    .eq('id', sessionId);
                if (error) throw error;
            }

            if (selectedSession && selectedSession.user_id === session.user_id) {
                setSelectedSession({ ...selectedSession, id: sessionId, notes });
            }

            fetchOnboardingData();
        } catch (error) {
            console.error('Error updating notes:', error);
        }
    };

    const filteredSessions = sessions.filter(s =>
        (s.profiles?.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (s.profiles?.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const pendingMeetings = sessions.filter(s => s.welcome_meeting_date && !s.step_welcome_meeting);
    const todayMeetings = sessions.filter(s => s.welcome_meeting_date && isToday(parseISO(s.welcome_meeting_date)));

    const getProgress = (s: OnboardingSession) => {
        const steps = [
            s.step_welcome_meeting,
            s.step_educational_materials,
            s.step_technical_setup,
            s.step_traffic_setup,
            s.step_pixel_configured,
            s.step_first_activation,
            s.step_followup_success,
            s.step_referral_request
        ];
        const completed = steps.filter(Boolean).length;
        return Math.round((completed / steps.length) * 100);
    };

    const splitDateTime = (isoString?: string) => {
        if (!isoString) return { date: '', time: '' };
        try {
            const dateObj = new Date(isoString);
            if (isNaN(dateObj.getTime())) return { date: '', time: '' };

            const yyyy = dateObj.getFullYear();
            const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
            const dd = String(dateObj.getDate()).padStart(2, '0');
            const hh = String(dateObj.getHours()).padStart(2, '0');
            const min = String(dateObj.getMinutes()).padStart(2, '0');

            return {
                date: `${yyyy}-${mm}-${dd}`,
                time: `${hh}:${min}`
            };
        } catch (e) {
            return { date: isoString.split('T')[0] || '', time: '' };
        }
    };

    const handleDateTimeChange = async (session: any, field: string, datePart: string, timePart: string) => {
        if (!datePart) return;
        const fullIso = `${datePart}T${timePart || '00:00'}:00`;
        updateDate(session, field, fullIso);
    };

    const getWhatsAppLink = (phone: string, message: string) => {
        const cleanPhone = phone.replace(/\D/g, '');
        return `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
    };

    const suggest30DayReview = (session: any) => {
        const today = new Date();
        const thirtyDaysLater = new Date(today);
        thirtyDaysLater.setDate(today.getDate() + 30);
        updateDate(session, 'review_30d_date', thirtyDaysLater.toISOString());
    };

    if (selectedSession) {
        return (
            <div className="space-y-6 animate-fadeUp">
                <header className="flex items-center gap-4">
                    <button
                        onClick={() => setSelectedSession(null)}
                        className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
                    >
                        <ArrowRight className="rotate-180" size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900">Detalhes do Onboarding</h1>
                        <p className="text-slate-500 text-sm">Gerenciando a jornada de {selectedSession.profiles?.full_name}</p>
                    </div>
                </header>

                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50">
                    {/* Header do Perfil */}
                    <div className="bg-indigo-600 p-10 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-3xl bg-white/20 border border-white/30 flex items-center justify-center text-3xl font-black overflow-hidden shadow-inner">
                                {selectedSession.profiles?.avatar_url ? (
                                    <img src={selectedSession.profiles.avatar_url} className="w-full h-full object-cover" />
                                ) : selectedSession.profiles?.full_name?.charAt(0)}
                            </div>
                            <div>
                                <h3 className="text-3xl font-black tracking-tight">{selectedSession.profiles?.full_name}</h3>
                                <p className="text-indigo-100 font-medium opacity-80">{selectedSession.profiles?.email}</p>
                                <div className="flex gap-2 mt-2">
                                    <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-wider border border-white/10">
                                        {selectedSession.profiles?.plan}
                                    </span>
                                    <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-wider border border-white/10 text-indigo-200">
                                        {selectedSession.profiles?.planStatus}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="bg-white/10 rounded-2xl p-5 border border-white/10 backdrop-blur-sm min-w-[160px]">
                                <p className="text-[10px] uppercase font-bold text-indigo-200 tracking-widest mb-1">Membro Desde</p>
                                <p className="font-bold text-lg">{format(parseISO(selectedSession.profiles?.created_at || new Date().toISOString()), 'dd/MM/yyyy')}</p>
                            </div>
                            <div className="bg-white/10 rounded-2xl p-5 border border-white/10 backdrop-blur-sm min-w-[140px]">
                                <p className="text-[10px] uppercase font-bold text-indigo-200 tracking-widest mb-1">Progresso Total</p>
                                <p className="font-bold text-lg">{getProgress(selectedSession)}%</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
                        {/* Coluna Esquerda: Checklist */}
                        <div className="lg:col-span-2 space-y-10">
                            <div>
                                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <CheckCircle2 size={18} className="text-indigo-600" />
                                    Etapas de Sucesso
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[
                                        { field: 'step_welcome_meeting', label: 'Reunião Boas Vindas', icon: Video, desc: 'Apresentação do sistema e alinhamento', type: 'both' },
                                        { field: 'step_educational_materials', label: 'Materiais Educativos', icon: Play, desc: 'Envio de vídeos e tutoriais', type: 'both' },
                                        { field: 'step_technical_setup', label: 'Setup Técnico', icon: Settings, desc: 'WhatsApp e importação de estoque', type: 'both' },
                                        { field: 'step_traffic_setup', label: 'Tráfego Pago', icon: Target, desc: 'Acessos ao BM / Gerenciador', type: 'traffic' },
                                        { field: 'step_pixel_configured', label: 'Pixel / API Conversão', icon: TrendingUp, desc: 'Configuração de rastreamento', type: 'traffic' },
                                        { field: 'step_first_activation', label: 'Primeiro Lead', icon: Star, desc: 'Sucesso na entrada de novos contatos', type: 'both' },
                                        { field: 'step_followup_success', label: 'Follow-up Satisfação', icon: MessageSquare, desc: 'Pesquisa pós-configuração', type: 'both' },
                                        { field: 'step_referral_request', label: 'Pedido de Indicação', icon: ArrowRight, desc: 'Incentivo ao bônus de indicação', type: 'both' },
                                    ].filter(step => {
                                        const userPlan = selectedSession.profiles?.plan?.toLowerCase() || '';
                                        // Se o plano for apenas CRM (crm ou trial de crm), oculta etapas de tráfego
                                        if (userPlan === 'crm' && step.type === 'traffic') return false;
                                        return true;
                                    }).map(step => (
                                        <button
                                            key={step.field}
                                            onClick={() => toggleStep(selectedSession, step.field, (selectedSession as any)[step.field])}
                                            className={`flex items-start gap-4 p-5 rounded-3xl border-2 transition-all text-left active:scale-95 group ${(selectedSession as any)[step.field]
                                                ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-lg shadow-emerald-500/10'
                                                : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200 hover:shadow-md'
                                                }`}
                                        >
                                            <div className={`p-3 rounded-2xl transition-colors ${(selectedSession as any)[step.field] ? 'bg-emerald-500 text-white shadow-inner' : 'bg-slate-50 text-slate-300 group-hover:text-indigo-400'}`}>
                                                <step.icon size={20} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center mb-0.5">
                                                    <p className="text-sm font-black uppercase tracking-tight">{step.label}</p>
                                                    {(selectedSession as any)[step.field] ? (
                                                        <CheckCircle2 size={14} className="text-emerald-500" />
                                                    ) : (
                                                        <div className="w-2 h-2 rounded-full bg-slate-200 group-hover:bg-indigo-300" />
                                                    )}
                                                </div>
                                                <p className={`text-[11px] font-medium leading-tight ${(selectedSession as any)[step.field] ? 'text-emerald-600' : 'text-slate-400'}`}>{step.desc}</p>
                                                <div className="flex items-center gap-1.5 mt-2">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${(selectedSession as any)[step.field] ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
                                                    <p className={`text-[9px] font-bold uppercase tracking-widest ${(selectedSession as any)[step.field] ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                        {(selectedSession as any)[step.field] ? 'Concluído' : 'Em andamento'}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Agendamentos */}
                            <div>
                                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <Calendar size={18} className="text-indigo-600" />
                                    Cronograma de Reuniões
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Reunião de Boas-vindas</label>
                                        <div className="flex flex-col gap-3">
                                            <CustomDatePicker
                                                value={splitDateTime(selectedSession.welcome_meeting_date).date}
                                                onChange={(val) => handleDateTimeChange(selectedSession, 'welcome_meeting_date', val, splitDateTime(selectedSession.welcome_meeting_date).time)}
                                                className="w-full text-base font-bold bg-white"
                                            />
                                            <CustomTimePicker
                                                value={splitDateTime(selectedSession.welcome_meeting_date).time}
                                                onChange={(val) => handleDateTimeChange(selectedSession, 'welcome_meeting_date', splitDateTime(selectedSession.welcome_meeting_date).date, val)}
                                                className="w-full text-base font-bold bg-white"
                                            />
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Review de 30 dias</label>
                                        <div className="flex flex-col gap-3">
                                            <CustomDatePicker
                                                value={splitDateTime(selectedSession.review_30d_date).date}
                                                onChange={(val) => handleDateTimeChange(selectedSession, 'review_30d_date', val, splitDateTime(selectedSession.review_30d_date).time)}
                                                className="w-full text-base font-bold bg-white"
                                            />
                                            <CustomTimePicker
                                                value={splitDateTime(selectedSession.review_30d_date).time}
                                                onChange={(val) => handleDateTimeChange(selectedSession, 'review_30d_date', splitDateTime(selectedSession.review_30d_date).date, val)}
                                                className="w-full text-base font-bold bg-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Coluna Direita: Notas e Ações */}
                        <div className="space-y-8">
                            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-200">
                                <h4 className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-6 flex items-center gap-2">
                                    <MessageSquare size={16} />
                                    Diário de Bordo CS
                                </h4>
                                <textarea
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm min-h-[250px] focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium placeholder:text-white/20"
                                    placeholder="Como está sendo o processo? Teve alguma dificuldade técnica? Registre aqui os principais feedbacks da reunião..."
                                    value={selectedSession.notes || ''}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setSelectedSession({ ...selectedSession, notes: val });
                                    }}
                                    onBlur={() => {
                                        updateNotes(selectedSession, selectedSession.notes || '');
                                    }}
                                />
                                <p className="text-[10px] text-white/30 mt-4 italic">As notas são salvas automaticamente ao sair do campo.</p>
                            </div>

                            <div className="bg-white border-2 border-slate-100 rounded-3xl p-6 space-y-4">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Ações Rápidas</h4>
                                {selectedSession.profiles?.phone && (
                                    <a
                                        href={getWhatsAppLink(selectedSession.profiles.phone, `Olá ${selectedSession.profiles.full_name}, tudo bem? Sou da equipe de Sucesso do Cliente Otimizza!`)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-3 w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100"
                                    >
                                        <MessageSquare size={18} />
                                        Falar no WhatsApp
                                    </a>
                                )}
                                <button
                                    onClick={() => setSelectedSession(null)}
                                    className="w-full py-4 border-2 border-slate-100 text-slate-500 rounded-2xl font-bold hover:bg-slate-50 transition-all"
                                >
                                    Concluir e Voltar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fadeUp">
            <header className="flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-2 text-indigo-600 font-bold mb-1">
                        <Rocket size={20} />
                        <span className="text-sm tracking-widest uppercase">Customer Success</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900">Onboarding de Clientes</h1>
                    <p className="text-slate-500">Acompanhe a jornada dos novos usuários e garanta o sucesso deles.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-slate-600 border'}`}
                    >
                        Dashboard
                    </button>
                    <button
                        onClick={() => setActiveTab('agenda')}
                        className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'agenda' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-slate-600 border'}`}
                    >
                        Agenda CS
                    </button>
                </div>
            </header>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-3">
                        <Clock size={20} />
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Aguardando Setup</p>
                    <p className="text-2xl font-black text-slate-900">{sessions.filter(s => !s.step_technical_setup).length}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-3">
                        <Video size={20} />
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reuniões Hoje</p>
                    <p className="text-2xl font-black text-slate-900">{todayMeetings.length}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-3">
                        <BarChart3 size={20} />
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Média de Progresso</p>
                    <p className="text-2xl font-black text-slate-900">
                        {sessions.length > 0 ? Math.round(sessions.reduce((acc, s) => acc + getProgress(s), 0) / sessions.length) : 0}%
                    </p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mb-3">
                        <AlertCircle size={20} />
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pendentes de Follow-up</p>
                    <p className="text-2xl font-black text-slate-900">{sessions.filter(s => s.step_technical_setup && !s.step_followup_success).length}</p>
                </div>
            </div>

            {activeTab === 'dashboard' ? (
                <>
                    {/* Filters */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar cliente..."
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-20 text-slate-300 font-medium">Carregando jornada dos clientes...</div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-200">
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cliente</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Progresso</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Etapas Atuais</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Próximo Marco</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredSessions.map(session => (
                                        <tr key={session.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 border border-slate-200 overflow-hidden">
                                                        {session.profiles?.avatar_url ? (
                                                            <img src={session.profiles.avatar_url} className="w-full h-full object-cover" />
                                                        ) : session.profiles?.full_name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">{session.profiles?.full_name || 'Usuário sem nome'}</p>
                                                        <p className="text-xs text-slate-500">{session.profiles?.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="w-full max-w-[120px]">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase">{getProgress(session)}%</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all duration-500 ${getProgress(session) > 70 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                                            style={{ width: `${getProgress(session)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-1.5">
                                                    <div className={`p-1.5 rounded-lg ${session.step_welcome_meeting ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`} title="Reunião Boas Vindas">
                                                        <Video size={14} />
                                                    </div>
                                                    <div className={`p-1.5 rounded-lg ${session.step_educational_materials ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`} title="Materiais Enviados">
                                                        <Play size={14} />
                                                    </div>
                                                    <div className={`p-1.5 rounded-lg ${session.step_technical_setup ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`} title="Setup Técnico">
                                                        <Settings size={14} />
                                                    </div>
                                                    <div className={`p-1.5 rounded-lg ${session.step_traffic_setup ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`} title="Tráfego Pago">
                                                        <Target size={14} />
                                                    </div>
                                                    <div className={`p-1.5 rounded-lg ${session.step_first_activation ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`} title="Primeiro Lead">
                                                        <Star size={14} />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {!session.step_welcome_meeting ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-amber-600 block">Agendar Boas-vindas</span>
                                                        <span className="text-[10px] text-slate-400">Pendente</span>
                                                    </div>
                                                ) : !session.step_technical_setup ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-indigo-600 block">Validar Configurações</span>
                                                        <span className="text-[10px] text-slate-400">WhatsApp / Estoque</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-emerald-600 block">Acompanhamento Retenção</span>
                                                        <span className="text-[10px] text-slate-400">30 dias pós venda</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setSelectedSession(session)}
                                                        className="p-2 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-lg transition-all text-slate-400 hover:text-indigo-600"
                                                        title="Ver Detalhes"
                                                    >
                                                        <ArrowRight size={18} />
                                                    </button>
                                                    {session.profiles?.phone && (
                                                        <a
                                                            href={getWhatsAppLink(session.profiles.phone, `Olá ${session.profiles.full_name}, tudo bem? Sou da equipe de Onboarding do Otimizza!`)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-2 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 rounded-lg transition-all text-slate-400 hover:text-emerald-600"
                                                            title="Enviar WhatsApp"
                                                        >
                                                            <MessageSquare size={18} />
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Upcoming Meetings */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                                <Calendar size={18} />
                            </div>
                            <h2 className="font-bold text-slate-900">Agenda de Boas-Vindas</h2>
                        </div>

                        <div className="space-y-4">
                            {sessions.filter(s => s.welcome_meeting_date).length === 0 ? (
                                <div className="text-center py-10 text-slate-400 text-sm">Nenhum compromisso agendado.</div>
                            ) : (
                                sessions.filter(s => s.welcome_meeting_date).sort((a, b) => parseISO(a.welcome_meeting_date!).getTime() - parseISO(b.welcome_meeting_date!).getTime()).map(s => (
                                    <div key={s.id} className="flex gap-4 p-4 rounded-xl border border-slate-100 hover:border-indigo-100 transition-colors group">
                                        <div className="flex flex-col items-center justify-center min-w-[60px] bg-slate-50 rounded-lg p-2">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">{format(parseISO(s.welcome_meeting_date!), 'MMM', { locale: ptBR })}</span>
                                            <span className="text-xl font-black text-slate-800">{format(parseISO(s.welcome_meeting_date!), 'dd')}</span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-bold text-slate-900">{s.profiles?.full_name}</h4>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${s.step_welcome_meeting ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {s.step_welcome_meeting ? 'Realizada' : 'Pendente'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                                                <Clock size={12} /> {format(parseISO(s.welcome_meeting_date!), 'HH:mm')}
                                            </p>
                                            <div className="flex gap-2">
                                                {!s.step_welcome_meeting && (
                                                    <button
                                                        onClick={() => toggleStep(s, 'step_welcome_meeting', false)}
                                                        className="text-[10px] font-bold text-indigo-600 hover:underline"
                                                    >
                                                        Concluir etapa
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setSelectedSession(s)}
                                                    className="text-[10px] font-bold text-slate-400 hover:text-slate-600 underline"
                                                >
                                                    Detalhes
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Follow-ups */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center">
                                <MessageSquare size={18} />
                            </div>
                            <h2 className="font-bold text-slate-900">Checkpoints CS (30 dias)</h2>
                        </div>

                        <div className="space-y-4">
                            {sessions.filter(s => s.review_30d_date).length === 0 ? (
                                <div className="text-center py-10 text-slate-400 text-sm">Nenhum checkpoint para hoje.</div>
                            ) : (
                                sessions.filter(s => s.review_30d_date).map(s => (
                                    <div key={s.id} className="flex gap-4 p-4 rounded-xl border border-slate-100 hover:border-rose-100 transition-colors bg-slate-50/30">
                                        <div className="flex flex-col items-center justify-center min-w-[60px] bg-white border border-slate-100 shadow-sm rounded-lg p-2">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">{format(parseISO(s.review_30d_date!), 'MMM', { locale: ptBR })}</span>
                                            <span className="text-xl font-black text-rose-600">{format(parseISO(s.review_30d_date!), 'dd')}</span>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-slate-900">{s.profiles?.full_name}</h4>
                                            <p className="text-xs text-slate-500 mb-1">Status: {getProgress(s)}% da jornada concluída</p>
                                            <p className="text-[10px] text-slate-400 italic">Checar satisfação e propor upgrade/indicação.</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

