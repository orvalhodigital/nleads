import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Bell, Clock, Plus, Trash2, Send, Save, AlertCircle, FileText, History, RefreshCcw, AtSign } from 'lucide-react';
import { format } from 'date-fns';
import FeedbackModal from '../components/ui/FeedbackModal';

interface NotificationRule {
    id: string;
    category: 'system' | 'plan' | 'manual';
    title: string;
    message: string;
    trigger_event: 'signup' | 'manual' | 'trial_ending' | 'plan_expired' | 'no_stock_24h' | 'inactivity_7d';
    delay_minutes: number;
    target_plan: string | null;
    target_status: string | null;
    active: boolean;
}

interface Template {
    id: string;
    title: string;
    message: string;
    category: string;
}

interface Broadcast {
    id: string;
    title: string;
    message: string;
    target_filter: string;
    sent_count: number;
    created_at: string;
}

const VARIABLE_OPTIONS = [
    { label: 'Nome do Usuário', value: '@nome' },
    { label: 'Plano Atual', value: '@plano' },
    { label: 'Email', value: '@email' },
    { label: 'Telefone', value: '@telefone' },
];

export default function AdminNotifications() {
    const [activeTab, setActiveTab] = useState<'system' | 'plan' | 'manual'>('system');
    const [rules, setRules] = useState<NotificationRule[]>([]);
    const [loading, setLoading] = useState(true);

    // Templates & History state
    const [templates, setTemplates] = useState<Template[]>([]);
    const [broadcastHistory, setBroadcastHistory] = useState<Broadcast[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');

    // Mentions State
    const [showMentions, setShowMentions] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Form State
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<NotificationRule>>({
        category: 'system',
        trigger_event: 'signup',
        delay_minutes: 0,
        active: true,
        target_plan: 'all',
        target_status: 'all'
    });

    // Manual Send State
    const [manualTarget, setManualTarget] = useState<'all' | 'filtered'>('all');
    const [manualFilterPlan, setManualFilterPlan] = useState('all');
    const [sending, setSending] = useState(false);

    // Broadcast Form Data (separate to avoid conflict with rules form)
    const [broadcastData, setBroadcastData] = useState({ title: '', message: '' });

    // Feedback Modal State
    const [modal, setModal] = useState<{
        isOpen: boolean;
        type: 'success' | 'error' | 'confirm';
        title: string;
        message: string;
        onConfirm?: () => void;
    }>({ isOpen: false, type: 'success', title: '', message: '' });

    useEffect(() => {
        if (activeTab === 'manual') {
            fetchTemplates();
            fetchBroadcastHistory();
        } else {
            fetchRules();
        }
    }, [activeTab]);

    const showSuccess = (title: string, message: string) => {
        setModal({ isOpen: true, type: 'success', title, message });
    };

    const showError = (message: string) => {
        setModal({ isOpen: true, type: 'error', title: 'Erro', message });
    };

    const showConfirm = (title: string, message: string, onConfirm: () => void) => {
        setModal({ isOpen: true, type: 'confirm', title, message, onConfirm });
    };

    const closeModal = () => {
        setModal(prev => ({ ...prev, isOpen: false }));
    };

    const fetchRules = async () => {
        setLoading(true);
        const { data } = await supabase.from('notification_rules').select('*').order('created_at', { ascending: false });
        if (data) setRules(data as any);
        setLoading(false);
    };

    const fetchTemplates = async () => {
        const { data } = await supabase.from('notification_templates').select('*').order('created_at', { ascending: false });
        if (data) setTemplates(data);
    };

    const fetchBroadcastHistory = async () => {
        const { data } = await supabase.from('broadcast_history').select('*').order('created_at', { ascending: false });
        if (data) setBroadcastHistory(data);
    };

    const handleTemplateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const tId = e.target.value;
        setSelectedTemplate(tId);
        if (tId) {
            const tmpl = templates.find(t => t.id === tId);
            if (tmpl) setBroadcastData({ title: tmpl.title, message: tmpl.message });
        }
    };

    // Mentions Logic
    const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        const cursorInfo = e.target.selectionStart;
        setBroadcastData({ ...broadcastData, message: val });

        if (val.slice(cursorInfo - 1, cursorInfo) === '@') {
            setShowMentions(true);
        } else {
            setShowMentions(false);
        }
    };

    const insertVariable = (variable: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const cursorPosition = textarea.selectionStart;
        const textBefore = broadcastData.message.substring(0, cursorPosition);
        const textAfter = broadcastData.message.substring(cursorPosition);

        // Remove trailing @ if present
        let newTextBefore = textBefore;
        if (textBefore.endsWith('@')) {
            newTextBefore = textBefore.slice(0, -1);
        }

        const newText = newTextBefore + variable + " " + textAfter;
        setBroadcastData({ ...broadcastData, message: newText });
        setShowMentions(false);

        setTimeout(() => textarea.focus(), 0);
    };

    const handleSaveRule = async () => {
        try {
            const payload: any = {
                title: formData.title,
                message: formData.message,
                category: activeTab,
                trigger_event: formData.trigger_event,
                delay_minutes: Number(formData.delay_minutes),
                active: formData.active,
                target_plan: activeTab === 'plan' && formData.target_plan !== 'all' ? formData.target_plan : null,
                target_status: activeTab === 'plan' && formData.target_status !== 'all' ? formData.target_status : null,
            };

            let error;
            if (editingId) {
                const { error: err } = await supabase.from('notification_rules').update(payload).eq('id', editingId);
                error = err;
            } else {
                const { error: err } = await supabase.from('notification_rules').insert(payload);
                error = err;
            }
            if (error) throw error;

            setIsEditing(false);
            setEditingId(null);
            fetchRules();
            setFormData({ category: activeTab, trigger_event: 'signup', delay_minutes: 0, active: true, target_plan: 'all', target_status: 'all' });
            showSuccess('Regra Salva', 'A regra de notificação foi atualizada com sucesso.');
        } catch (e: any) {
            showError('Erro ao salvar: ' + e.message);
        }
    };

    const handleDelete = (id: string) => {
        showConfirm('Excluir Regra', 'Tem certeza que deseja excluir esta regra permanentemente?', async () => {
            // Checar o erro antes de atualizar a UI: sem isso, a lista removia a
            // regra na tela mesmo se o delete falhasse (o supabase-js não lança).
            const { error } = await supabase.from('notification_rules').delete().eq('id', id);
            if (error) {
                showError('Erro ao excluir regra: ' + error.message);
                return;
            }
            setRules(prev => prev.filter(r => r.id !== id));
            closeModal();
        });
    };

    const handleBroadcast = () => {
        if (!broadcastData.title || !broadcastData.message) return showError('Preencha título e mensagem');

        showConfirm('Enviar Transmissão', 'Tem certeza que deseja enviar esta notificação agora para os usuários selecionados?', async () => {
            setSending(true);
            closeModal();
            try {
                // 1. Get Users
                let query = supabase.from('profiles').select('id, full_name, email, plan, role');
                if (manualTarget === 'filtered' && manualFilterPlan !== 'all') {
                    query = query.eq('plan', manualFilterPlan);
                }
                const { data: users } = await query;

                if (!users || users.length === 0) {
                    showError('Nenhum usuário encontrado com os filtros selecionados.');
                    setSending(false);
                    return;
                }

                // 2. Insert Notifications with Variable Substitution
                const notifications = users.map(u => {
                    let msg = broadcastData.message;
                    msg = msg.replace(/@nome/g, u.full_name || 'Usuário');
                    msg = msg.replace(/@email/g, u.email || '');
                    msg = msg.replace(/@plano/g, u.plan || 'Trial');
                    msg = msg.replace(/@telefone/g, 'Não Cadastrado');

                    return {
                        user_id: u.id,
                        title: broadcastData.title,
                        message: msg
                    };
                });

                const { error } = await supabase.from('notifications').insert(notifications);
                if (error) throw error;

                // 3. Log History
                const { data: { user } } = await supabase.auth.getUser();
                const { error: histError } = await supabase.from('broadcast_history').insert({
                    admin_id: user?.id,
                    title: broadcastData.title,
                    message: broadcastData.message,
                    target_filter: manualTarget === 'all' ? 'Todos' : manualFilterPlan,
                    sent_count: users.length
                });
                if (histError) throw histError;

                showSuccess('Sucesso', `Enviado para ${users.length} usuários!`);
                setBroadcastData({ title: '', message: '' });
                setSelectedTemplate('');
                fetchBroadcastHistory();
            } catch (e: any) {
                showError('Erro ao enviar: ' + e.message);
            } finally {
                setSending(false);
            }
        });
    };

    const handleDeleteHistory = (id: string) => {
        showConfirm('Apagar Histórico', 'Remover este registro do histórico?', async () => {
            const { error } = await supabase.from('broadcast_history').delete().eq('id', id);
            if (!error) setBroadcastHistory(prev => prev.filter(h => h.id !== id));
            closeModal();
        });
    };

    const handleResend = (broadcast: Broadcast) => {
        setBroadcastData({ title: broadcast.title, message: broadcast.message });
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to form
    };

    const handleSeedDefaults = async () => {
        try {
            setLoading(true);
            const defaults = [
                { category: 'system', title: 'Bem-vindo ao Gestor de Pátio! 🚀', message: 'Olá @nome, que bom ter você aqui! Comece agora adicionando seus primeiros leads e explore todas as nossas ferramentas de gestão.', trigger_event: 'signup', delay_minutes: 0, active: true },
                { category: 'plan', title: 'Seu período de teste está acabando! ⏳', message: 'Ei @nome, seu período trial expira em 2 dias. Não perca o acesso aos seus dados e ferramentas, faça o upgrade hoje mesmo!', trigger_event: 'trial_ending', delay_minutes: 2, active: true },
                { category: 'plan', title: 'Atenção: Seu plano expirou! 🚨', message: 'Seu plano Gestor de Pátio expirou. Sua conta foi limitada. Renove agora para continuar gerindo suas vendas sem interrupções.', trigger_event: 'plan_expired', delay_minutes: 0, active: true },
                { category: 'system', title: 'Seu estoque está parado? 📦', message: 'Você está há mais de 24h sem carros/motos ativos no sistema. Lembre-se: estoque atualizado gera mais leads!', trigger_event: 'no_stock_24h', delay_minutes: 1440, active: true },
                { category: 'system', title: 'Sentimos sua falta no Gestor de Pátio! 👋', message: 'Faz uma semana que você não acessa o painel. Temos novos leads aguardando seu contato. Vamos bater as metas de hoje?', trigger_event: 'inactivity_7d', delay_minutes: 10080, active: true }
            ];

            const { error } = await supabase.from('notification_rules').insert(defaults);
            if (error) throw error;

            // Also seed manual templates if empty
            if (templates.length === 0) {
                const defaultTemplates = [
                    { category: 'Promoção', title: 'Oferta de Renovação Especial 🎁', message: 'Olá @nome! Notamos que você é um usuário fiel. Use o cupom RENOVA20 para ganhar 20% de desconto na sua próxima mensalidade!' },
                    { category: 'Atualização', title: 'Novas Funcionalidades Chegaram! ✨', message: 'Temos novidades! Acabamos de liberar novos filtros e relatórios de desempenho. Confira agora no seu painel.' },
                    { category: 'Dica', title: 'Venda mais rápido com WebP ⚡', message: 'Sabia que fotos em WebP carregam 3x mais rápido? Já convertemos todas as suas fotos para você vender mais rápido!' }
                ];
                const { error: tmplError } = await supabase.from('notification_templates').insert(defaultTemplates);
                if (tmplError) throw tmplError;
                fetchTemplates();
            }

            fetchRules();
            showSuccess('Regras Criadas', 'As notificações e modelos padrão foram configurados com sucesso.');
        } catch (e: any) {
            showError('Erro ao criar padrões: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredRules = rules.filter(r => r.category === activeTab);

    return (
        <div className="space-y-6 animate-fadeUp">
            <FeedbackModal
                isOpen={modal.isOpen}
                type={modal.type}
                title={modal.title}
                message={modal.message}
                onClose={closeModal}
                onConfirm={modal.onConfirm}
            />

            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Central de Notificações</h1>
                    <p className="text-slate-500 mt-1">Gerencie mensagens automáticas e envios em massa</p>
                </div>
            </header>

            {/* Tabs */}
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('system')}
                    className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'system' ? 'border-black text-black' : 'border-transparent text-slate-500 hover:text-black hover:bg-slate-50'}`}
                >
                    <Bell size={16} /> Sistema
                </button>
                <button
                    onClick={() => setActiveTab('plan')}
                    className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'plan' ? 'border-black text-black' : 'border-transparent text-slate-500 hover:text-black hover:bg-slate-50'}`}
                >
                    <AlertCircle size={16} /> Planos
                </button>
                <button
                    onClick={() => setActiveTab('manual')}
                    className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'manual' ? 'border-black text-black' : 'border-transparent text-slate-500 hover:text-black hover:bg-slate-50'}`}
                >
                    <Send size={16} /> Disparo Manual
                </button>
            </div>

            {/* Content Area */}
            <div className={`bg-white p-6 rounded-xl shadow-sm border border-slate-200 min-h-[500px] ${activeTab === 'manual' ? '' : ''}`}>

                {/* MANUAL TAB */}
                {activeTab === 'manual' ? (
                    <div className="flex flex-col xl:flex-row gap-8 items-start">
                        {/* Left: Send Form */}
                        <div className="flex-1 space-y-6">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Send size={20} /> Nova Transmissão
                            </h3>

                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-4">
                                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">Destinatários</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" checked={manualTarget === 'all'} onChange={() => setManualTarget('all')} className="accent-black" />
                                        Todos os Usuários
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" checked={manualTarget === 'filtered'} onChange={() => setManualTarget('filtered')} className="accent-black" />
                                        Filtrar por Plano
                                    </label>
                                </div>

                                {manualTarget === 'filtered' && (
                                    <select
                                        className="w-full mt-2 border rounded p-2 outline-none focus:border-black"
                                        value={manualFilterPlan}
                                        onChange={e => setManualFilterPlan(e.target.value)}
                                    >
                                        <option value="all">Selecione o Plano...</option>
                                        <option value="trial">Trial</option>
                                        <option value="pro">Pro</option>
                                    </select>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold mb-1">Usar Modelo (Opcional)</label>
                                    <div className="flex gap-2">
                                        <select
                                            value={selectedTemplate}
                                            onChange={handleTemplateSelect}
                                            className="w-full border rounded-lg px-3 py-2 outline-none focus:border-black"
                                        >
                                            <option value="">-- Selecione um modelo --</option>
                                            {templates.map(t => (
                                                <option key={t.id} value={t.id}>{t.title} ({t.category})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold mb-1">Título</label>
                                    <input
                                        className="w-full border rounded-lg px-3 py-2 outline-none focus:border-black"
                                        value={broadcastData.title}
                                        onChange={e => setBroadcastData({ ...broadcastData, title: e.target.value })}
                                        placeholder="Ex: Atualização Importante"
                                    />
                                </div>
                                <div className="relative">
                                    <label className="block text-sm font-bold mb-1">Mensagem</label>
                                    <div className="relative">
                                        <textarea
                                            ref={textareaRef}
                                            className="w-full border rounded-lg px-3 py-2 h-32 outline-none focus:border-black resize-none"
                                            value={broadcastData.message}
                                            onChange={handleMessageChange}
                                            placeholder="Digite @ para inserir variáveis (Ex: @nome)"
                                        />

                                        {/* Mentions Dropdown */}
                                        {showMentions && (
                                            <div className="absolute left-0 bottom-full mb-1 w-48 bg-white border border-slate-200 shadow-xl rounded-lg overflow-hidden z-10 animate-fadeUp">
                                                <div className="bg-slate-50 px-3 py-2 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase">
                                                    Inserir Variável
                                                </div>
                                                {VARIABLE_OPTIONS.map(opt => (
                                                    <button
                                                        key={opt.value}
                                                        onClick={() => insertVariable(opt.value)}
                                                        className="w-full text-left px-4 py-2 hover:bg-slate-100 text-sm text-slate-700 flex justify-between items-center group"
                                                    >
                                                        <span>{opt.label}</span>
                                                        <span className="text-xs text-slate-400 font-mono group-hover:text-slate-600">{opt.value}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                        <AtSign size={12} /> Digite <strong>@</strong> para inserir variaveis personalizadas.
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={handleBroadcast}
                                disabled={sending}
                                className="w-full py-3 bg-black text-white rounded-lg font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <Send size={18} /> {sending ? 'Enviando...' : 'Enviar Agora'}
                            </button>
                        </div>

                        {/* Right: History Sidebar */}
                        <div className="w-full xl:w-96 border-l border-slate-100 xl:pl-8 space-y-6">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <History size={20} /> Histórico de Envios
                            </h3>

                            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                {broadcastHistory.length === 0 ? (
                                    <p className="text-slate-400 text-sm text-center py-4">Nenhum envio registrado.</p>
                                ) : (
                                    broadcastHistory.map(item => (
                                        <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm hover:border-slate-300 transition-colors group">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-bold text-slate-800">{item.title}</span>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleResend(item)} title="Reutilizar" className="p-1 text-blue-600 hover:bg-blue-100 rounded">
                                                        <RefreshCcw size={14} />
                                                    </button>
                                                    <button onClick={() => handleDeleteHistory(item.id)} title="Excluir Registro" className="p-1 text-red-600 hover:bg-red-100 rounded">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-slate-600 line-clamp-2 mb-2">{item.message}</p>
                                            <div className="flex justify-between items-center text-xs text-slate-400 border-t border-slate-200 pt-2">
                                                <span>{format(new Date(item.created_at), 'dd/MM HH:mm')}</span>
                                                <span className="bg-white border px-1.5 py-0.5 rounded text-slate-600">
                                                    {item.sent_count} disparos • {item.target_filter}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* SYSTEM & PLAN TABS (CRUD) */
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold">Regras Ativas</h3>
                            <button
                                onClick={() => { setIsEditing(true); setEditingId(null); setFormData({ category: activeTab, trigger_event: 'signup', delay_minutes: 0, active: true, target_plan: 'all', target_status: 'all' }); }}
                                className="px-4 py-2 bg-black text-white rounded-lg text-sm font-bold hover:opacity-90 transition-colors flex items-center gap-2"
                            >
                                <Plus size={16} /> Nova Regra
                            </button>
                        </div>

                        {isEditing && (
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8 animate-fadeUp">
                                <h4 className="font-bold mb-4 text-slate-900">{editingId ? 'Editar Regra' : 'Nova Regra'}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Título</label>
                                        <input
                                            className="w-full border rounded px-3 py-2 outline-none focus:border-black"
                                            value={formData.title || ''}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Mensagem</label>
                                        <textarea
                                            className="w-full border rounded px-3 py-2 h-20 outline-none focus:border-black"
                                            value={formData.message || ''}
                                            onChange={e => setFormData({ ...formData, message: e.target.value })}
                                        />
                                    </div>

                                    {/* Triggers Section */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Gatilho (Quando?)</label>
                                        <select
                                            className="w-full border rounded px-3 py-2 outline-none focus:border-black"
                                            value={formData.trigger_event}
                                            onChange={(e: any) => setFormData({ ...formData, trigger_event: e.target.value })}
                                        >
                                            <option value="signup">Ao se cadastrar (Boas-vindas)</option>
                                            <option value="trial_ending">Trial Acabando (Usa 'Atraso' como dias antes)</option>
                                            <option value="plan_expired">Plano Expirou</option>
                                            <option value="no_stock_24h">Sem Estoque (24h)</option>
                                            <option value="manual">Manual / Outro</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                                            {formData.trigger_event === 'trial_ending' ? 'Dias Antes' : 'Atraso (Minutos)'}
                                        </label>
                                        <input
                                            type="number"
                                            className="w-full border rounded px-3 py-2 outline-none focus:border-black"
                                            value={formData.delay_minutes}
                                            onChange={e => setFormData({ ...formData, delay_minutes: Number(e.target.value) })}
                                            placeholder="0"
                                        />
                                        <p className="text-[10px] text-slate-400 mt-1">
                                            {formData.trigger_event === 'trial_ending'
                                                ? 'Ex: 2 = Enviar 2 dias antes de vencer'
                                                : 'Ex: 60 = 1 hora após ação'}
                                        </p>
                                    </div>

                                    {/* Plan Filters */}
                                    {activeTab === 'plan' && (
                                        <>
                                            <div>
                                                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Plano Alvo</label>
                                                <select
                                                    className="w-full border rounded px-3 py-2 outline-none focus:border-black"
                                                    value={formData.target_plan || 'all'}
                                                    onChange={e => setFormData({ ...formData, target_plan: e.target.value })}
                                                >
                                                    <option value="all">Todos</option>
                                                    <option value="trial">Trial</option>
                                                    <option value="pro">Pro</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Status Alvo</label>
                                                <select
                                                    className="w-full border rounded px-3 py-2 outline-none focus:border-black"
                                                    value={formData.target_status || 'all'}
                                                    onChange={e => setFormData({ ...formData, target_status: e.target.value })}
                                                >
                                                    <option value="all">Todos</option>
                                                    <option value="active">Ativo</option>
                                                    <option value="expired">Expirado</option>
                                                </select>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded font-medium"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleSaveRule}
                                        className="px-4 py-2 bg-black text-white rounded font-medium flex items-center gap-2"
                                    >
                                        <Save size={16} /> Salvar Regra
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            {filteredRules.length === 0 ? (
                                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <Bell size={40} className="mx-auto text-slate-300 mb-3" />
                                    <p className="text-slate-500 font-medium">Nenhuma regra de {activeTab === 'system' ? 'sistema' : 'plano'} configurada.</p>
                                    <button
                                        onClick={handleSeedDefaults}
                                        className="mt-4 px-6 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                                    >
                                        Criar Notificações Padrão
                                    </button>
                                </div>
                            ) : (
                                filteredRules.map(rule => (
                                    <div key={rule.id} className="border border-slate-100 rounded-lg p-4 hover:border-black transition-colors flex justify-between items-center group bg-slate-50/50">
                                        <div>
                                            <h4 className="font-bold text-slate-900">{rule.title} <span className="text-xs font-normal text-slate-400 ml-2">{rule.delay_minutes}min delay</span></h4>
                                            <p className="text-sm text-slate-500">{rule.message}</p>
                                            {rule.target_plan && <span className="inline-block mt-2 text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded uppercase font-bold mr-2">{rule.target_plan}</span>}
                                            {rule.target_status && <span className="inline-block mt-2 text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded uppercase font-bold">{rule.target_status}</span>}
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => { setIsEditing(true); setEditingId(rule.id); setFormData(rule); }}
                                                className="p-2 text-black hover:bg-slate-200 rounded"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(rule.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
