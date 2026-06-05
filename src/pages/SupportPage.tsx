
import React, { useEffect, useState } from 'react';
import { ticketService } from '../services/ticketService';
import { SupportTicket, TicketCategory, TicketPriority } from '../types';
import {
    Plus,
    MessageCircle,
    Clock,
    CheckCircle2,
    AlertCircle,
    Paperclip,
    Send,
    X,
    Loader2,
    ChevronRight,
    LifeBuoy
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function SupportPage() {
    const [view, setView] = useState<'list' | 'create' | 'details'>('list');
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);

    // New Ticket Form State
    const [newSubject, setNewSubject] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newCategory, setNewCategory] = useState<TicketCategory>('support');
    const [newPriority, setNewPriority] = useState<TicketPriority>('medium');
    const [attachments, setAttachments] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchTickets();
    }, []);

    useEffect(() => {
        if (selectedTicketId && view === 'details') {
            fetchTicketDetails(selectedTicketId);
        }
    }, [selectedTicketId, view]);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const data = await ticketService.getMyTickets();
            setTickets(data);
        } catch (error) {
            console.error('Error fetching tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTicketDetails = async (id: string) => {
        try {
            const data = await ticketService.getTicketDetails(id);
            setSelectedTicket(data);
        } catch (error) {
            console.error('Error fetching ticket details:', error);
        }
    };

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (uploading) return;

        try {
            setUploading(true);

            const attachmentUrls: string[] = [];
            for (const file of attachments) {
                const url = await ticketService.uploadAttachment(file);
                attachmentUrls.push(url);
            }

            await ticketService.createTicket({
                subject: newSubject,
                description: newDescription,
                category: newCategory,
                priority: newPriority,
                attachments: attachmentUrls
            });

            resetForm();
            setView('list');
            fetchTickets();
        } catch (error) {
            console.error('Error creating ticket:', error);
        } finally {
            setUploading(false);
        }
    };

    const resetForm = () => {
        setNewSubject('');
        setNewDescription('');
        setNewCategory('support');
        setNewPriority('medium');
        setAttachments([]);
    };

    const [messageAttachments, setMessageAttachments] = useState<File[]>([]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && messageAttachments.length === 0) || !selectedTicketId || sendingMessage) return;

        try {
            setSendingMessage(true);

            const attachmentUrls: string[] = [];
            for (const file of messageAttachments) {
                const url = await ticketService.uploadAttachment(file);
                attachmentUrls.push(url);
            }

            await ticketService.addMessage(selectedTicketId, newMessage, attachmentUrls);
            setNewMessage('');
            setMessageAttachments([]);
            fetchTicketDetails(selectedTicketId);
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSendingMessage(false);
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (file) {
                    setMessageAttachments(prev => [...prev, file]);
                }
            }
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'open': return <Clock className="text-amber-500" size={16} />;
            case 'in_progress': return <MessageCircle className="text-blue-500" size={16} />;
            case 'closed': return <CheckCircle2 className="text-emerald-500" size={16} />;
            default: return <Clock className="text-slate-400" size={16} />;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'open': return 'Aberto';
            case 'in_progress': return 'Em Atendimento';
            case 'closed': return 'Finalizado';
            default: return status;
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'bg-red-100 text-red-600';
            case 'high': return 'bg-orange-100 text-orange-600';
            case 'medium': return 'bg-blue-100 text-blue-600';
            case 'low': return 'bg-slate-100 text-slate-600';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    if (view === 'details' && selectedTicketId && selectedTicket) {
        return (
            <div className="flex flex-col h-full animate-fadeUp">
                <header className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => { setView('list'); setSelectedTicketId(null); setSelectedTicket(null); }}
                        className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 transition-all shadow-sm"
                    >
                        <ChevronRight className="rotate-180" size={20} />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-2xl font-black text-slate-900 leading-none">Ticket #{selectedTicket.id.slice(0, 8)}</h1>
                        <p className="text-slate-500 text-sm mt-1">{selectedTicket.subject}</p>
                    </div>
                    <div className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 border ${selectedTicket.status === 'closed' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                        selectedTicket.status === 'in_progress' ? 'bg-blue-50 border-blue-100 text-blue-600' :
                            'bg-amber-50 border-amber-100 text-amber-600'
                        }`}>
                        {getStatusIcon(selectedTicket.status)}
                        {getStatusLabel(selectedTicket.status)}
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
                    {/* Main Chat Area */}
                    <div className="lg:col-span-2 flex flex-col bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden h-[calc(100vh-250px)]">
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Original Message */}
                            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Problema Inicial</span>
                                    <span className="text-[10px] font-bold text-slate-400">
                                        {format(new Date(selectedTicket.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                    </span>
                                </div>
                                <p className="text-slate-700 font-medium whitespace-pre-wrap">{selectedTicket.description}</p>
                                {selectedTicket.attachments?.length > 0 && (
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {selectedTicket.attachments.map((url, i) => (
                                            <a key={i} href={url} target="_blank" rel="noreferrer" className="p-2 bg-white border border-slate-200 rounded-xl flex items-center gap-2 text-[10px] font-bold text-indigo-600 hover:border-indigo-200 transition-all">
                                                <Paperclip size={12} /> Anexo {i + 1}
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Thread */}
                            {selectedTicket.messages?.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.sender_role === 'admin' ? 'justify-start' : 'justify-end'}`}>
                                    <div className={`max-w-[80%] rounded-3xl p-5 ${msg.sender_role === 'admin'
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                                        }`}>
                                        <div className="flex justify-between items-center mb-2 gap-4">
                                            <span className="text-[9px] font-black uppercase tracking-widest opacity-70">
                                                {msg.sender_role === 'admin' ? 'Suporte Otimizza' : 'Você'}
                                            </span>
                                            <span className="text-[9px] font-bold opacity-50">
                                                {format(new Date(msg.created_at), 'HH:mm')}
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                                        {msg.attachments && msg.attachments.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {msg.attachments.map((url, i) => (
                                                    <a key={i} href={url} target="_blank" rel="noreferrer" className={`inline-flex p-2 rounded-xl items-center gap-2 text-[10px] font-bold transition-all ${msg.sender_role === 'admin' ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-slate-200/50 hover:bg-slate-200 text-indigo-600'}`}>
                                                        <Paperclip size={12} /> Anexo {i + 1}
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {selectedTicket.status !== 'closed' && (
                            <form onSubmit={handleSendMessage} className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col gap-2">
                                {messageAttachments.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-2 px-2">
                                        {messageAttachments.map((file, i) => (
                                            <div key={i} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-bold flex items-center gap-2 border border-indigo-100">
                                                <Paperclip size={12} />
                                                <span className="max-w-[150px] truncate">{file.name}</span>
                                                <button type="button" onClick={() => setMessageAttachments(prev => prev.filter((_, idx) => idx !== i))} className="hover:text-red-500">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="relative">
                                    <textarea
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onPaste={handlePaste}
                                        placeholder="Responda ou adicione mais detalhes (Ctrl+V para colar imagem)..."
                                        className="w-full pl-6 pr-24 py-4 bg-white border border-slate-200 rounded-[1.5rem] font-medium text-sm text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none resize-none h-20 shadow-inner"
                                    />
                                    <div className="absolute right-3 bottom-3 flex items-center gap-1">
                                        <label className="p-3 text-slate-400 hover:text-indigo-600 cursor-pointer transition-colors rounded-full hover:bg-slate-100" title="Anexar arquivo">
                                            <Paperclip size={20} />
                                            <input 
                                                type="file" 
                                                className="hidden" 
                                                multiple 
                                                onChange={(e) => {
                                                    const files = Array.from(e.target.files || []);
                                                    setMessageAttachments(prev => [...prev, ...files]);
                                                }}
                                            />
                                        </label>
                                        <button
                                            type="submit"
                                            disabled={sendingMessage || (!newMessage.trim() && messageAttachments.length === 0)}
                                            className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-slate-900 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                                        >
                                            {sendingMessage ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        )}
                        {selectedTicket.status === 'closed' && (
                            <div className="p-4 bg-emerald-50 border-t border-emerald-100 text-center">
                                <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest flex items-center justify-center gap-2">
                                    <CheckCircle2 size={14} /> Atendimento Finalizado
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Sidebar Area */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-xl shadow-slate-200/50">
                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-6">Informações</h4>
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1">Status</label>
                                    <p className="text-sm font-black text-slate-900">{getStatusLabel(selectedTicket.status)}</p>
                                </div>
                                <div>
                                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1">Prioridade</label>
                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight ${getPriorityColor(selectedTicket.priority)}`}>
                                        {selectedTicket.priority}
                                    </span>
                                </div>
                                <div>
                                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1">Categoria</label>
                                    <p className="text-sm font-black text-slate-900 capitalize">{selectedTicket.category}</p>
                                </div>
                                <div>
                                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1">Criado em</label>
                                    <p className="text-sm font-black text-slate-900">{format(new Date(selectedTicket.created_at), 'dd/MM/yyyy HH:mm')}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-xl shadow-slate-900/20">
                            <LifeBuoy className="text-indigo-400 mb-4" size={32} />
                            <h4 className="text-lg font-black leading-tight mb-2">Central de Ajuda</h4>
                            <p className="text-slate-400 text-[11px] font-medium leading-relaxed mb-6">
                                Nosso time de suporte responde em média em até 4h úteis para tickets urgentes.
                            </p>
                            <button disabled className="w-full py-4 px-6 bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/10 text-white/50 cursor-not-allowed">
                                Documentação
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (view === 'create') {
        return (
            <div className="animate-fadeUp w-full pb-20">
                <header className="flex items-center gap-6 mb-10">
                    <button
                        onClick={() => setView('list')}
                        className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 transition-all shadow-sm"
                    >
                        <ChevronRight className="rotate-180" size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Novo Atendimento</h1>
                        <p className="text-slate-500 font-bold text-sm mt-1">Nossa equipe entrará em contato em breve.</p>
                    </div>
                </header>

                <form onSubmit={handleCreateTicket} className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl p-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Assunto</label>
                            <input
                                required
                                type="text"
                                value={newSubject}
                                onChange={(e) => setNewSubject(e.target.value)}
                                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm text-slate-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                                placeholder="Ex: Erro ao carregar fotos"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Prioridade</label>
                                <select
                                    value={newPriority}
                                    onChange={(e) => setNewPriority(e.target.value as TicketPriority)}
                                    className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm text-slate-900 appearance-none focus:bg-white transition-all outline-none"
                                >
                                    <option value="low">Baixa</option>
                                    <option value="medium">Média</option>
                                    <option value="high">Alta</option>
                                    <option value="urgent">Urgente</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Categoria</label>
                                <select
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value as TicketCategory)}
                                    className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm text-slate-900 appearance-none focus:bg-white transition-all outline-none"
                                >
                                    <option value="bug">Bug/Erro</option>
                                    <option value="feature">Sugestão</option>
                                    <option value="billing">Financeiro</option>
                                    <option value="support">Dúvida</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2 mb-10">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Mensagem Detalhada</label>
                        <textarea
                            required
                            value={newDescription}
                            onChange={(e) => setNewDescription(e.target.value)}
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm text-slate-900 h-48 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none resize-none"
                            placeholder="Descreva exatamente o que está acontecendo. Se houver erro, cole a mensagem aqui..."
                        />
                    </div>

                    <div className="space-y-4 mb-10">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Anexos de Evidência (Opcional)</label>
                        <div className="flex flex-wrap gap-4">
                            {attachments.map((file, i) => (
                                <div key={i} className="px-4 py-3 bg-indigo-50 text-indigo-600 rounded-2xl text-xs font-bold flex items-center gap-3 border border-indigo-100">
                                    <Paperclip size={14} />
                                    <span className="max-w-[150px] truncate">{file.name}</span>
                                    <button type="button" onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="hover:text-red-500">
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                            <label className="cursor-pointer px-6 py-3 bg-white border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-indigo-500 hover:text-indigo-500 transition-all font-bold text-xs flex items-center gap-3">
                                <input
                                    type="file"
                                    multiple
                                    className="hidden"
                                    onChange={(e) => {
                                        const files = Array.from(e.target.files || []);
                                        setAttachments(prev => [...prev, ...files]);
                                    }}
                                />
                                <Plus size={16} /> Adicionar Prints ou Vídeos
                            </label>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => setView('list')}
                            className="px-8 py-4 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-900 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={uploading}
                            className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl flex items-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {uploading ? <Loader2 size={18} className="animate-spin" /> : <><LifeBuoy size={18} /> Criar Chamado</>}
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fadeUp">
            <header className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Suporte Técnico</h1>
                    <p className="text-slate-500 font-bold text-sm mt-1">Estamos aqui para ajudar com qualquer problema ou dúvida.</p>
                </div>
                <button
                    onClick={() => setView('create')}
                    className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
                >
                    <Plus size={18} strokeWidth={3} /> Novo Ticket
                </button>
            </header>

            {/* Ticket List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    Array(6).fill(0).map((_, i) => (
                        <div key={i} className="bg-white rounded-[2rem] h-48 animate-pulse border border-slate-100" />
                    ))
                ) : tickets.length === 0 ? (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-6">
                            <LifeBuoy size={40} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900">Nenhum ticket aberto</h3>
                        <p className="text-slate-400 text-sm font-medium mt-2">Clique no botão acima para abrir um novo atendimento.</p>
                    </div>
                ) : (
                    tickets.map((ticket) => (
                        <button
                            key={ticket.id}
                            onClick={() => { setSelectedTicketId(ticket.id); setView('details'); }}
                            className="bg-white p-8 rounded-[2rem] border border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all text-left flex flex-col group relative overflow-hidden"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter ${getPriorityColor(ticket.priority)}`}>
                                    {ticket.priority}
                                </span>
                                <span className="text-[10px] font-bold text-slate-300">{format(new Date(ticket.created_at || new Date()), 'dd/MM/yy')}</span>
                            </div>

                            <h3 className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors mb-2 line-clamp-1">{ticket.subject}</h3>
                            <p className="text-xs font-medium text-slate-400 line-clamp-2 leading-relaxed mb-6">{ticket.description}</p>

                            <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {getStatusIcon(ticket.status)}
                                    <span className="text-[10px] font-black uppercase text-slate-600 tracking-tight">{getStatusLabel(ticket.status)}</span>
                                </div>
                                <div className="flex -space-x-2">
                                    {ticket.attachments?.length > 0 && Array(Math.min(ticket.attachments.length, 3)).fill(0).map((_, i) => (
                                        <div key={i} className="w-6 h-6 rounded-lg bg-slate-50 border-2 border-white flex items-center justify-center text-slate-300">
                                            <Paperclip size={10} />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Status Indicator Bar */}
                            <div className={`absolute bottom-0 left-0 h-1 transition-all ${ticket.status === 'closed' ? 'bg-emerald-500 w-full' :
                                ticket.status === 'in_progress' ? 'bg-blue-500 w-1/2' :
                                    'bg-amber-400 w-1/4'
                                }`} />
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}
