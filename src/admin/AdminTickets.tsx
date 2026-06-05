
import React, { useEffect, useState } from 'react';
import { ticketService } from '../services/ticketService';
import { SupportTicket, TicketStatus, TicketMessage } from '../types';
import {
    Search,
    Clock,
    MessageCircle,
    CheckCircle2,
    AlertCircle,
    Paperclip,
    Send,
    Loader2,
    ChevronRight,
    Filter,
    User,
    ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AdminTickets() {
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);
    const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');

    useEffect(() => {
        fetchTickets();
    }, []);

    useEffect(() => {
        if (selectedTicketId) {
            fetchTicketDetails(selectedTicketId);
        }
    }, [selectedTicketId]);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const data = await ticketService.getAllTickets();
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

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedTicketId || sendingMessage) return;

        try {
            setSendingMessage(true);
            await ticketService.addMessage(selectedTicketId, newMessage);
            setNewMessage('');
            fetchTicketDetails(selectedTicketId);

            // If ticket was open, mark as in_progress when admin replies
            if (selectedTicket?.status === 'open') {
                await handleUpdateStatus('in_progress');
            }
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSendingMessage(false);
        }
    };

    const handleUpdateStatus = async (status: TicketStatus) => {
        if (!selectedTicketId) return;
        try {
            await ticketService.updateTicketStatus(selectedTicketId, status);
            fetchTicketDetails(selectedTicketId);
            fetchTickets();
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const filteredTickets = tickets.filter(t => {
        const matchesSearch =
            t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.id.includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

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

    if (selectedTicketId && selectedTicket) {
        return (
            <div className="flex flex-col h-full animate-fadeUp">
                <header className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => { setSelectedTicketId(null); setSelectedTicket(null); }}
                        className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 transition-all shadow-sm"
                    >
                        <ChevronRight className="rotate-180" size={20} />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-2xl font-black text-slate-900 leading-none">Ticket #{selectedTicket.id.slice(0, 8)}</h1>
                        <p className="text-slate-500 text-sm mt-1">{selectedTicket.subject}</p>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => handleUpdateStatus('in_progress')}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${selectedTicket.status === 'in_progress' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-100 hover:bg-blue-50'
                                }`}
                        >
                            Em Atendimento
                        </button>
                        <button
                            onClick={() => handleUpdateStatus('closed')}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${selectedTicket.status === 'closed' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-emerald-600 border-emerald-100 hover:bg-emerald-50'
                                }`}
                        >
                            Concluir Ticket
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
                    <div className="lg:col-span-2 flex flex-col bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden h-[calc(100vh-250px)]">
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">
                                            {selectedTicket.profiles?.full_name?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-900">{selectedTicket.profiles?.full_name}</p>
                                            <p className="text-[10px] font-bold text-slate-400">{selectedTicket.profiles?.email}</p>
                                        </div>
                                    </div>
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

                            {selectedTicket.messages?.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.sender_role === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] rounded-3xl p-5 ${msg.sender_role === 'admin'
                                            ? 'bg-slate-900 text-white shadow-lg'
                                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                                        }`}>
                                        <div className="flex justify-between items-center mb-2 gap-4">
                                            <span className="text-[9px] font-black uppercase tracking-widest opacity-70">
                                                {msg.sender_role === 'admin' ? 'Você (Suporte)' : selectedTicket.profiles?.full_name}
                                            </span>
                                            <span className="text-[9px] font-bold opacity-50">
                                                {format(new Date(msg.created_at), 'HH:mm')}
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium leading-relaxed">{msg.message}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <form onSubmit={handleSendMessage} className="p-4 bg-slate-50 border-t border-slate-100">
                            <div className="relative">
                                <textarea
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Envie uma resposta para o cliente..."
                                    className="w-full pl-6 pr-16 py-4 bg-white border border-slate-200 rounded-[1.5rem] font-medium text-sm text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none resize-none h-20 shadow-inner"
                                />
                                <button
                                    type="submit"
                                    disabled={sendingMessage || !newMessage.trim()}
                                    className="absolute right-3 bottom-3 p-3 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                                >
                                    {sendingMessage ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-xl shadow-slate-200/50">
                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-6">Ficha do Cliente</h4>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-xl font-black text-slate-300">
                                    {selectedTicket.profiles?.avatar_url ? <img src={selectedTicket.profiles.avatar_url} className="w-full h-full object-cover rounded-2xl" /> : selectedTicket.profiles?.full_name?.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-base font-black text-slate-900 leading-tight">{selectedTicket.profiles?.full_name}</p>
                                    <p className="text-xs font-bold text-slate-400">{selectedTicket.profiles?.email}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-3 border-b border-slate-50">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Status</span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${selectedTicket.status === 'closed' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                                        }`}>
                                        {selectedTicket.status}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-slate-50">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Prioridade</span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${getPriorityColor(selectedTicket.priority)}`}>
                                        {selectedTicket.priority}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-3">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Empresa</span>
                                    <span className="text-[10px] font-black text-slate-900 uppercase">{selectedTicket.profiles?.company_name || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => window.open(`/paineldoadm/users/${selectedTicket.user_id}`, '_blank')}
                            className="w-full flex items-center justify-center gap-3 p-5 bg-white border border-slate-200 rounded-[1.5rem] text-xs font-black uppercase text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-all"
                        >
                            <ExternalLink size={16} /> Ver Perfil Completo
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fadeUp">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Tickets de Suporte</h1>
                    <p className="text-slate-500 font-bold text-sm mt-1">Gerencie chamados de clientes e resolva problemas.</p>
                </div>

                <div className="flex flex-wrap gap-4">
                    <div className="relative min-w-[300px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar por cliente ou assunto..."
                            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-sm text-slate-900 shadow-sm focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                        />
                    </div>

                    <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                        {(['all', 'open', 'in_progress', 'closed'] as const).map((opt) => (
                            <button
                                key={opt}
                                onClick={() => setStatusFilter(opt)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all ${statusFilter === opt ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                {opt === 'all' ? 'Todos' : getStatusLabel(opt)}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Cliente</th>
                            <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Assunto</th>
                            <th className="px-8 py-5 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</th>
                            <th className="px-8 py-5 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Prioridade</th>
                            <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-slate-400 tracking-widest">Criado em</th>
                            <th className="px-8 py-5"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            Array(5).fill(0).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={6} className="px-8 py-8"><div className="h-6 bg-slate-100 rounded-lg w-full" /></td>
                                </tr>
                            ))
                        ) : filteredTickets.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-8 py-20 text-center">
                                    <div className="flex flex-col items-center">
                                        <Filter className="text-slate-200 mb-4" size={48} />
                                        <p className="text-slate-400 font-bold">Nenhum ticket encontrado com esses filtros.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredTickets.map((ticket) => (
                                <tr key={ticket.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-300">
                                                {ticket.profiles?.avatar_url ? <img src={ticket.profiles.avatar_url} className="w-full h-full object-cover rounded-xl" /> : ticket.profiles?.full_name?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900 leading-none">{ticket.profiles?.full_name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 mt-1">{ticket.profiles?.company_name || 'Sem Empresa'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div>
                                            <p className="text-sm font-black text-slate-900 line-clamp-1">{ticket.subject}</p>
                                            <p className="text-[10px] font-bold text-slate-400 mt-1 capitalize">{ticket.category}</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tight ${ticket.status === 'closed' ? 'bg-emerald-50 text-emerald-600' :
                                                    ticket.status === 'in_progress' ? 'bg-blue-50 text-blue-600' :
                                                        'bg-amber-50 text-amber-600'
                                                }`}>
                                                {getStatusLabel(ticket.status)}
                                            </span>
                                            {ticket.status !== 'closed' && (
                                                <span className={`text-[9px] font-bold uppercase tracking-wider ${
                                                    (ticket.messages && ticket.messages.length > 0 && ticket.messages[ticket.messages.length - 1].sender_role === 'admin') 
                                                    ? 'text-slate-400' 
                                                    : 'text-indigo-600 animate-pulse'
                                                }`}>
                                                    {(ticket.messages && ticket.messages.length > 0 && ticket.messages[ticket.messages.length - 1].sender_role === 'admin') 
                                                        ? 'Aguardando Cliente' 
                                                        : 'Nova Resposta!'}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tight ${getPriorityColor(ticket.priority)}`}>
                                            {ticket.priority}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <p className="text-[11px] font-bold text-slate-400">{format(new Date(ticket.created_at), "dd/MM/yy 'às' HH:mm")}</p>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button
                                            onClick={() => setSelectedTicketId(ticket.id)}
                                            className="p-3 rounded-2xl text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <ChevronRight size={20} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
