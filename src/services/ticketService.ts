
import { supabase } from '../lib/supabaseClient';
import { SupportTicket, TicketMessage, TicketStatus, TicketPriority, TicketCategory } from '../types';

export const ticketService = {
    async getMyTickets() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('support_tickets')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as SupportTicket[];
    },

    async getAllTickets() {
        const { data, error } = await supabase
            .from('support_tickets')
            .select('*, profiles(*)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        const tickets = (data || []) as SupportTicket[];
        if (tickets.length === 0) return tickets;

        // Busca só a última mensagem de cada ticket (sender_role) para o indicador
        // "Nova Resposta!"/"Aguardando Cliente" da listagem — sem isso, `ticket.messages`
        // nunca era carregado aqui e o indicador ficava sempre preso em "Nova Resposta!",
        // mesmo em tickets onde o admin já tinha respondido por último.
        const { data: lastMessages, error: mError } = await supabase
            .from('ticket_messages')
            .select('ticket_id, sender_role, created_at')
            .in('ticket_id', tickets.map(t => t.id))
            .order('created_at', { ascending: false });

        if (mError) throw mError;

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
        const { data: ticket, error: tError } = await supabase
            .from('support_tickets')
            .select('*, profiles(*)')
            .eq('id', ticketId)
            .single();

        if (tError) throw tError;

        const { data: messages, error: mError } = await supabase
            .from('ticket_messages')
            .select('*')
            .eq('ticket_id', ticketId)
            .order('created_at', { ascending: true });

        if (mError) throw mError;

        return {
            ...ticket,
            messages: messages as TicketMessage[]
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

        const { data, error } = await supabase
            .from('support_tickets')
            .insert({
                user_id: user.id,
                ...ticket,
                status: 'open'
            })
            .select()
            .single();

        if (error) throw error;
        return data as SupportTicket;
    },

    async addMessage(ticketId: string, message: string, attachments: string[] = []) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Get user role to set sender_role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        const senderRole = profile?.role === 'admin' ? 'admin' : 'user';

        const { data, error } = await supabase
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

        if (error) throw error;

        // Notificar a outra parte
        const { data: ticket } = await supabase.from('support_tickets').select('*').eq('id', ticketId).single();
        if (ticket) {
            if (senderRole === 'admin') {
                // Notificar usuário
                await supabase.from('notifications').insert({
                    user_id: ticket.user_id,
                    title: 'Nova Resposta no Suporte',
                    message: `O suporte respondeu ao seu ticket: "${ticket.subject}"`,
                    read: false
                });
            } else {
                // Mudar status para 'open' se o usuário respondeu e estava 'in_progress'
                if (ticket.status === 'in_progress') {
                    await supabase.from('support_tickets').update({ status: 'open' }).eq('id', ticketId);
                }
                
                // Notificar super admins
                const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'super_admin');
                if (admins && admins.length > 0) {
                    const adminNotifications = admins.map(admin => ({
                        user_id: admin.id,
                        title: 'Nova Resposta de Cliente',
                        message: `O cliente enviou uma nova resposta no ticket: "${ticket.subject}"`,
                        read: false
                    }));
                    await supabase.from('notifications').insert(adminNotifications);
                }
            }
        }

        return data as TicketMessage;
    },

    async updateTicketStatus(ticketId: string, status: TicketStatus) {
        const { error } = await supabase
            .from('support_tickets')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', ticketId);

        if (error) throw error;
    },

    async uploadAttachment(file: File): Promise<string> {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `tickets/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('support_attachments')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from('support_attachments')
            .getPublicUrl(filePath);

        return data.publicUrl;
    }
};
