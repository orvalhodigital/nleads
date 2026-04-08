
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
        return data as SupportTicket[];
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

        const { data, error } = await supabase
            .from('ticket_messages')
            .insert({
                ticket_id: ticketId,
                sender_id: user.id,
                sender_role: profile?.role === 'admin' ? 'admin' : 'user',
                message,
                attachments
            })
            .select()
            .single();

        if (error) throw error;
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
