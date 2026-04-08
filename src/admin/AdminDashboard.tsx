
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Profile } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Users, Settings, LogIn, Key, Bell, Save, X } from 'lucide-react';

export default function AdminDashboard() {
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [showNotify, setShowNotify] = useState<string | null>(null); // userId to notify

    // Settings State
    const [logoUrl, setLogoUrl] = useState('');

    // Notify State
    const [notifyTitle, setNotifyTitle] = useState('');
    const [notifyMessage, setNotifyMessage] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        fetchUsers();
        fetchSettings();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSettings = async () => {
        const { data } = await supabase.from('system_settings').select('value').eq('key', 'logo_url').single();
        if (data) setLogoUrl(data.value);
    }

    const saveSettings = async () => {
        const { error } = await supabase.from('system_settings').upsert({ key: 'logo_url', value: logoUrl });
        if (error) alert('Erro ao salvar configurações');
        else {
            alert('Configurações salvas!');
            setShowSettings(false);
        }
    }

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
    }

    const triggerPasswordReset = async (email: string) => {
        if (!window.confirm(`Enviar email de redefinição de senha para ${email}?`)) return;
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password', // Assuming this route exists or just default
        });
        if (error) alert('Erro ao enviar email: ' + error.message);
        else alert('Email de redefinição enviado com sucesso!');
    }

    const handlSignOut = async () => {
        await supabase.auth.signOut();
        navigate('/paineldoadm/login');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full z-10">
                <div className="p-6">
                    <h2 className="text-xl font-bold">nLeads <span className="text-indigo-400">Admin</span></h2>
                </div>
                <nav className="flex-1 px-4 space-y-2">
                    <Link to="/paineldoadm" className="flex items-center gap-3 px-4 py-3 bg-slate-800 rounded-lg text-white">
                        <Users size={20} />
                        Usuários
                    </Link>
                    <button
                        onClick={() => setShowSettings(true)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-left"
                    >
                        <Settings size={20} />
                        Configurações
                    </button>
                </nav>
                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={handlSignOut}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors w-full"
                    >
                        <LogOut size={18} />
                        Sair
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 ml-64 overflow-y-auto">
                <header className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-slate-800">Gerenciamento de Usuários</h1>
                    <div className="text-sm text-slate-500">
                        Total de usuários: {users.length}
                    </div>
                </header>

                {loading ? (
                    <div>Carregando...</div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Usuário</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Plano</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Role</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.map(user => (
                                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{user.full_name || 'Sem nome'}</div>
                                            <div className="text-sm text-slate-500">{user.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${user.plan === 'pro' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}
                      `}>
                                                {user.plan}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-sm ${user.planStatus === 'active' ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {user.planStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {(user as any).role || 'user'}
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2 flex justify-end">
                                            <button
                                                onClick={() => navigate(`/paineldoadm/user/${user.id}`)}
                                                title="Acessar Painel"
                                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                            >
                                                <LogIn size={18} />
                                            </button>
                                            <button
                                                onClick={() => user.email && triggerPasswordReset(user.email)}
                                                title="Enviar Email de Redefinição de Senha"
                                                className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                            >
                                                <Key size={18} />
                                            </button>
                                            <button
                                                onClick={() => setShowNotify(user.id)}
                                                title="Enviar Notificação"
                                                className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                                            >
                                                <Bell size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>

            {/* Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">Configurações do Sistema</h3>
                            <button onClick={() => setShowSettings(false)}><X size={24} /></button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">URL do Logo</label>
                                <input
                                    className="w-full border rounded-lg px-3 py-2"
                                    placeholder="https://..."
                                    value={logoUrl}
                                    onChange={e => setLogoUrl(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={() => setShowSettings(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                            <button onClick={saveSettings} className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2">
                                <Save size={18} /> Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Notification Modal */}
            {showNotify && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">Enviar Notificação</h3>
                            <button onClick={() => setShowNotify(null)}><X size={24} /></button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                                <input
                                    className="w-full border rounded-lg px-3 py-2"
                                    value={notifyTitle}
                                    onChange={e => setNotifyTitle(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem</label>
                                <textarea
                                    className="w-full border rounded-lg px-3 py-2 h-32"
                                    value={notifyMessage}
                                    onChange={e => setNotifyMessage(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={() => setShowNotify(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                            <button onClick={sendNotification} className="px-4 py-2 bg-sky-600 text-white rounded-lg flex items-center gap-2">
                                <Bell size={18} /> Enviar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
