
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Profile } from '../types';
import { useNavigate } from 'react-router-dom';
import { LogIn, Key, Bell, Search, Filter } from 'lucide-react';

export default function AdminUsers() {
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    // Notification State
    const [showNotify, setShowNotify] = useState<string | null>(null);
    const [notifyTitle, setNotifyTitle] = useState('');
    const [notifyMessage, setNotifyMessage] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Map snake_case from DB to camelCase in Profile interface
            const mappedUsers = (data || []).map(u => ({
                ...u,
                planStatus: u.plan_status || (u.trial_ends_at && new Date() > new Date(u.trial_ends_at) ? 'expired' : 'active'),
                plan: u.plan || 'trial',
                trialEndsAt: u.trial_ends_at
            }));

            setUsers(mappedUsers);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const triggerPasswordReset = async (email: string) => {
        if (!window.confirm(`Enviar email de redefinição de senha para ${email}?`)) return;
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password',
        });
        if (error) alert('Erro ao enviar email: ' + error.message);
        else alert('Email de redefinição enviado com sucesso!');
    };

    const sendNotification = async () => {
        if (!showNotify) return;
        const { error } = await supabase.from('notifications').insert({
            user_id: showNotify,
            title: notifyTitle,
            message: notifyMessage
        });

        if (error) alert('Erro ao enviar notificação');
        else {
            alert('Notificação enviada!');
            setShowNotify(null);
            setNotifyTitle('');
            setNotifyMessage('');
        }
    };

    const filteredUsers = users.filter(user =>
        (user.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Gerenciamento de Usuários</h1>
                    <p className="text-slate-500 mt-1">Visualize e gerencie todos os usuários do sistema</p>
                </div>
                <div className="px-4 py-2 bg-white rounded-lg shadow-sm border text-sm font-medium text-slate-600">
                    Total: {users.length} usuários
                </div>
            </header>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-0 bottom-0 my-auto text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou email..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                {/* Future Filters could go here */}
            </div>

            {loading ? (
                <div className="text-center py-20 text-slate-400">Carregando...</div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-white border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-bold text-slate-900 uppercase text-xs tracking-wider">Usuário</th>
                                <th className="px-6 py-4 font-bold text-slate-900 uppercase text-xs tracking-wider">Plano</th>
                                <th className="px-6 py-4 font-bold text-slate-900 uppercase text-xs tracking-wider">Status</th>
                                <th className="px-6 py-4 font-bold text-slate-900 uppercase text-xs tracking-wider">Role</th>
                                <th className="px-6 py-4 font-bold text-slate-900 uppercase text-xs tracking-wider text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4 cursor-pointer" onClick={() => navigate(`/paineldoadm/users/${user.id}`)}>
                                        <div className="font-bold text-slate-900 group-hover:text-black transition-colors">{user.full_name || 'Sem nome'}</div>
                                        <div className="text-sm text-slate-500">{user.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize
                        ${(user.plan === 'pro' || user.plan === 'crm') ? 'bg-black text-white' :
                                                user.plan === 'traffic_crm' ? 'bg-indigo-600 text-white' :
                                                    'bg-slate-100 text-slate-600'}
                      `}>
                                            {user.plan}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-sm font-medium ${user.planStatus === 'active' ? 'text-black' : 'text-red-500'}`}>
                                            {user.planStatus === 'active' ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-mono text-slate-500">
                                        {(user as any).role || 'user'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 text-slate-400">
                                            <button
                                                onClick={() => navigate(`/paineldoadm/user/${user.id}`)}
                                                title="Acessar Painel (Impersonate)"
                                                className="p-2 hover:bg-slate-100 hover:text-black rounded-lg transition-colors"
                                            >
                                                <LogIn size={18} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const newPass = prompt(`Digite a nova senha para ${user.full_name || user.email}:`);
                                                    if (newPass) {
                                                        // Call the admin change password function
                                                        supabase.rpc('admin_update_user_password', {
                                                            target_user_id: user.id,
                                                            new_password: newPass
                                                        }).then(({ error }) => {
                                                            if (error) alert('Erro ao alterar senha: ' + error.message);
                                                            else alert('Senha alterada com sucesso!');
                                                        });
                                                    }
                                                }}
                                                title="Alterar Senha"
                                                className="p-2 hover:bg-slate-100 hover:text-black rounded-lg transition-colors"
                                            >
                                                <Key size={18} />
                                            </button>
                                            <button
                                                onClick={() => setShowNotify(user.id)}
                                                title="Notificar"
                                                className="p-2 hover:bg-slate-100 hover:text-black rounded-lg transition-colors"
                                            >
                                                <Bell size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Notification Modal */}
            {showNotify && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 animate-fadeUp">
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-slate-900">Nova Notificação</h3>
                            <p className="text-slate-500 text-sm">Enviando para o usuário selecionado</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-900 uppercase mb-2">Título</label>
                                <input
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all font-medium"
                                    value={notifyTitle}
                                    onChange={e => setNotifyTitle(e.target.value)}
                                    placeholder="Ex: Atualização do Sistema"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-900 uppercase mb-2">Mensagem</label>
                                <textarea
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 h-32 focus:ring-2 focus:ring-black/5 focus:border-black outline-none resize-none transition-all font-medium"
                                    value={notifyMessage}
                                    onChange={e => setNotifyMessage(e.target.value)}
                                    placeholder="Digite a mensagem..."
                                />
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end gap-3">
                            <button
                                onClick={() => setShowNotify(null)}
                                className="px-6 py-3 text-slate-500 hover:text-black hover:bg-slate-100 rounded-xl transition-colors font-bold text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={sendNotification}
                                className="px-6 py-3 bg-black text-white rounded-xl flex items-center gap-2 hover:bg-zinc-800 transition-colors shadow-lg shadow-black/20 font-bold text-sm"
                            >
                                <Bell size={18} /> Enviar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
