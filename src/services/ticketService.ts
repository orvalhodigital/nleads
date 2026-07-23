
import { supabase, handleSupabaseResponse } from '../lib/supabaseClient';
import { SupportTicket, TicketMessage, TicketStatus, TicketPriority, TicketCategory } from '../types';

export const ticketService = {
    async getMyTickets() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const response = await supabase
            .from('support_tickets')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        return (handleSupabaseResponse(response) || []) as SupportTicket[];
    },

    async getAllTickets() {
        const response = await supabase
            .from('support_tickets')
            .select('*, profiles(*)')
            .order('created_at', { ascending: false });

        const data = handleSupabaseResponse(response);
        const tickets = (data || []) as SupportTicket[];
        if (tickets.length === 0) return tickets;

        // Busca só a última mensagem de cada ticket (sender_role) para o indicador
        // "Nova Resposta!"/"Aguardando Cliente" da listagem — sem isso, `ticket.messages`
        // nunca era carregado aqui e o indicador ficava sempre preso em "Nova Resposta!",
        // mesmo em tickets onde o admin já tinha respondido por último.
        const mResponse = await supabase
            .from('ticket_messages')
            .select('ticket_id, sender_role, created_at')
            .in('ticket_id', tickets.map(t => t.id))
            .order('created_at', { ascending: false });

        const lastMessages = handleSupabaseResponse(mResponse);

        const lastByTicket = new Map<string, TicketMessage>();
        (lastMessages || []).forEach((m: any) => {
            if (!lastByTicket.has(m.ticket_id)) lastByTicket.set(m.ticket_id, m as TicketMessage);
        });

        return tickets.map(t => {
            const last = lastByTicket.get(t.id);
            return last ? { ...t, messages: [last] } : t;
        });
    },

    async getTicketDetails(ticketId: string) {
        const tResponse = await supabase
            .from('support_tickets')
            .select('*, profiles(*)')
            .eq('id', ticketId)
            .single();

        const ticket = handleSupabaseResponse(tResponse);

        const mResponse = await supabase
            .from('ticket_messages')
            .select('*')
            .eq('ticket_id', ticketId)
            .order('created_at', { ascending: true });

        const messages = handleSupabaseResponse(mResponse);

        return {
            ...ticket,
            messages: (messages || []) as TicketMessage[]
        } as SupportTicket;
    },

    async createTicket(ticket: {
        subject: string;
        description: string;
        priority: TicketPriority;
        category: TicketCategory;
        attachments: string[];
    }) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const response = await supabase
            .from('support_tickets')
            .insert({
                user_id: user.id,
                ...ticket,
                status: 'open'
            })
            .select()
            .single();

        return handleSupabaseResponse(response) as SupportTicket;
    },

    async addMessage(ticketId: string, message: string, attachments: string[] = []) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Get user role to set sender_role
        const pResponse = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();

        const profile = handleSupabaseResponse(pResponse);
        const senderRole = profile?.role === 'admin' ? 'admin' : 'user';

        const response = await supabase
            .from('ticket_messages')
            .insert({
                ticket_id: ticketId,
                sender_id: user.id,
                sender_role: senderRole,
                message,
                attachments
            })
            .select()
            .single();

        const data = handleSupabaseResponse(response);

        // Notificar a outra parte
        const tResponse = await supabase.from('support_tickets').select('*').eq('id', ticketId).maybeSingle();
        const ticket = handleSupabaseResponse(tResponse);
        if (ticket) {
            if (senderRole === 'admin') {
                // Notificar usuário
                const nResponse = await supabase.from('notifications').insert({
                    user_id: ticket.user_id,
                    title: 'Nova Resposta no Suporte',
                    message: `O suporte respondeu ao seu ticket: "${ticket.subject}"`,
                    read: false
                });
                handleSupabaseResponse(nResponse);
            } else {
                // Mudar status para 'open' se o usuário respondeu e estava 'in_progress'
                if (ticket.status === 'in_progress') {
                    const uResponse = await supabase.from('support_tickets').update({ status: 'open' }).eq('id', ticketId);
                    handleSupabaseResponse(uResponse);
                }
                
                // Notificar super admins
                const aResponse = await supabase.from('profiles').select('id').eq('role', 'super_admin');
                const admins = handleSupabaseResponse(aResponse);
                if (admins && admins.length > 0) {
                    const adminNotifications = admins.map(admin => ({
                        user_id: admin.id,
                        title: 'Nova Resposta de Cliente',
                        message: `O cliente enviou uma nova resposta no ticket: "${ticket.subject}"`,
                        read: false
                    }));
                    const nResponse = await supabase.from('notifications').insert(adminNotifications);
                    handleSupabaseResponse(nResponse);
                }
            }
        }

        return data as TicketMessage;
    },

    async updateTicketStatus(ticketId: string, status: TicketStatus) {
        const response = await supabase
            .from('support_tickets')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', ticketId);

        handleSupabaseResponse(response);
    },

    async uploadAttachment(file: File): Promise<string> {
        const { data: { session } } = await supabase.auth.getSession();
        const uid = session?.user?.id;
        if (!uid) throw new Error('Sessão necessária para enviar anexo.');

        const fileExt = (file.name.split('.').pop() || 'bin').replace(/[^a-zA-Z0-9]/g, '');
        const filePath = `tickets/${uid}/${crypto.randomUUID()}.${fileExt}`;

        const uploadRes = await supabase.storage
            .from('support_attachments')
            .upload(filePath, file);

        handleSupabaseResponse(uploadRes);

        return filePath;
    },

    // Resolve o valor guardado (path novo, ou URL http legada) numa URL utilizável.
    // Para paths, gera URL assinada de 1h contra o bucket privado.
    async getAttachmentUrl(pathOrUrl: string): Promise<string> {
        if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl; // compat com valores antigos
        const response = await supabase.storage
            .from('support_attachments')
            .createSignedUrl(pathOrUrl, 3600);
        const data = handleSupabaseResponse(response);
        if (!data) return '#';
        return data.signedUrl;
    }
};
