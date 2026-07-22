
import React, { useState, useMemo } from 'react';
import { adminService } from '../services/adminService';
import { notificationService } from '../services/notificationService';
import { Profile } from '../types';
import { useNavigate } from 'react-router-dom';
import { LogIn, Key, Bell, Search, Trash2, AlertCircle } from 'lucide-react';
import { useAdminTable } from '../hooks/useAdminTable';
import { useDebounce } from '../hooks/useDebounce';
import { useAdminToast } from '../hooks/useAdminToast';
import { ToastContainer } from '../components/admin/AdminToast';
import { AdminPagination } from '../components/admin/AdminPagination';
import { BulkActionsModal } from '../components/admin/BulkActionsModal';
import { auditLogService } from '../services/auditLogService';

export default function AdminUsers() {
    const [searchTerm, setSearchTerm] = useState('');
    const [deleting, setDeleting] = useState(false);
    const navigate = useNavigate();

    const debouncedSearch = useDebounce(searchTerm, 300);
    const { toasts, removeToast, success, error: showError } = useAdminToast();

    // Notification State
    const [showNotify, setShowNotify] = useState<string | null>(null);
    const [notifyTitle, setNotifyTitle] = useState('');
    const [notifyMessage, setNotifyMessage] = useState('');

    // Password Edit State
    const [showPasswordEdit, setShowPasswordEdit] = useState<{ id: string; name: string } | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);

    // Bulk Actions State
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkDeleting, setBulkDeleting] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

    const {
        data: rawUsers,
        loading,
        error,
        currentPage,
        totalPages,
        totalCount,
        pageSize,
        hasNextPage,
        hasPreviousPage,
        setCurrentPage,
        refetch,
        goToNextPage,
        goToPreviousPage,
    } = useAdminTable('profiles', '*', {
        pageSize: 50,
        orderBy: 'created_at',
        orderDirection: 'desc',
        search: debouncedSearch,
        searchColumns: ['full_name', 'email'],
    });

    // Map snake_case from DB to camelCase
    const users = useMemo(() => {
        return rawUsers.map(u => ({
            ...u,
            planStatus: u.plan_status || (u.trial_ends_at && new Date() > new Date(u.trial_ends_at) ? 'expired' : 'active'),
            plan: u.plan || 'trial',
            trialEndsAt: u.trial_ends_at
        }));
    }, [rawUsers]);

    // A busca agora é server-side (via useAdminTable), então usamos a lista como veio.
    const filteredUsers = users;

    const toggleSelectUser = (id: string) => {
        setSelectedUsers(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const allOnPageSelected = filteredUsers.length > 0 && filteredUsers.every(u => selectedUsers.has(u.id));

    const toggleSelectAll = () => {
        setSelectedUsers(prev => {
            const next = new Set(prev);
            if (allOnPageSelected) {
                filteredUsers.forEach(u => next.delete(u.id));
            } else {
                filteredUsers.forEach(u => next.add(u.id));
            }
            return next;
        });
    };

    const handleDeleteUser = async (id: string, name: string) => {
        if (!window.confirm(`Deletar usuário "${name}"? Esta ação é irreversível e removará todos os dados associados.`)) return;

        setDeleting(true);
        try {
            await adminService.deleteUser(id);

            // Log audit
            await auditLogService.logAction('delete', 'user', id, name);

            success(`Usuário "${name}" deletado com sucesso.`);
            refetch();
        } catch (err) {
            console.error('Error deleting user:', err);
            showError('Erro ao deletar usuário. Tente novamente.');
        } finally {
            setDeleting(false);
        }
    };

    const sendNotification = async () => {
        if (!showNotify) return;
        try {
            await notificationService.create({
                user_id: showNotify,
                title: notifyTitle,
                message: notifyMessage,
            });
            success('Notificação enviada com sucesso!');
            setShowNotify(null);
            setNotifyTitle('');
            setNotifyMessage('');
        } catch (err) {
            console.error('Error sending notification:', err);
            showError('Erro ao enviar notificação. Tente novamente.');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedUsers.size === 0) return;

        setBulkDeleting(true);
        try {
            await adminService.deleteUsers(Array.from(selectedUsers));

            // Log audit for each deleted user
            for (const userId of selectedUsers) {
                const user = filteredUsers.find(u => u.id === userId);
                await auditLogService.logAction('delete', 'user', userId, user?.full_name);
            }

            success(`${selectedUsers.size} usuário(s) deletado(s) com sucesso.`);
            setSelectedUsers(new Set());
            setShowBulkModal(false);
            refetch();
        } catch (err) {
            console.error('Error bulk deleting users:', err);
            showError('Erro ao deletar usuários. Tente novamente.');
        } finally {
            setBulkDeleting(false);
        }
    };

    const handleChangePassword = async () => {
        if (!showPasswordEdit) return;

        if (!newPassword.trim()) {
            showError('Digite uma nova senha.');
            return;
        }

        if (newPassword !== confirmPassword) {
            showError('As senhas não conferem.');
            return;
        }

        // 8 caracteres: alinha com a validação da RPC admin_update_user_password.
        if (newPassword.length < 8) {
            showError('A senha deve ter no mínimo 8 caracteres.');
            return;
        }

        setChangingPassword(true);
        try {
            await adminService.updateUserPassword(showPasswordEdit.id, newPassword);

            // Log audit
            await auditLogService.logAction('update', 'user', showPasswordEdit.id, showPasswordEdit.name, {
                field: 'password',
                action: 'changed',
            });

            success('Senha alterada com sucesso!');
            setShowPasswordEdit(null);
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            console.error('Error changing password:', err);
            showError('Erro ao alterar senha. Tente novamente.');
        } finally {
            setChangingPassword(false);
        }
    };


    return (
        <div className="space-y-8 animate-fadeUp">
            <ToastContainer toasts={toasts} onClose={removeToast} />

            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gerenciamento de Usuários</h1>
                    <p className="text-slate-500 font-bold text-sm mt-1">Visualize, edite e delete usuários do sistema.</p>
                </div>
                <div className="px-4 py-2 bg-white rounded-lg shadow-sm border text-sm font-medium text-slate-600">
                    Total: {totalCount}
                </div>
            </header>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                    <AlertCircle className="text-red-600" size={20} />
                    <p className="text-red-800 font-medium">{error}</p>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou email..."
                        className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                {selectedUsers.size > 0 && (
                    <button
                        onClick={() => setShowBulkModal(true)}
                        disabled={bulkDeleting}
                        className="px-4 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-bold flex items-center gap-2"
                    >
                        ⚙️ Ações em Massa ({selectedUsers.size})
                    </button>
                )}
            </div>

            {loading ? (
                <div className="text-center py-20 text-slate-400">Carregando usuários...</div>
            ) : filteredUsers.length === 0 ? (
                <div className="text-center py-20">
                    <AlertCircle className="mx-auto text-slate-300 mb-4" size={48} />
                    <p className="text-slate-400 font-bold">Nenhum usuário encontrado com esses filtros.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-left w-10">
                                        <input
                                            type="checkbox"
                                            className="accent-amber-600 w-4 h-4 cursor-pointer"
                                            checked={allOnPageSelected}
                                            onChange={toggleSelectAll}
                                            title="Selecionar todos desta página"
                                        />
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-400 tracking-widest">Usuário</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-400 tracking-widest">Plano</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-400 tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-400 tracking-widest">Role</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold uppercase text-slate-400 tracking-widest">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredUsers.map(user => (
                                    <tr key={user.id} className={`hover:bg-slate-50 transition-colors group ${selectedUsers.has(user.id) ? 'bg-amber-50/50' : ''}`}>
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                className="accent-amber-600 w-4 h-4 cursor-pointer"
                                                checked={selectedUsers.has(user.id)}
                                                onChange={() => toggleSelectUser(user.id)}
                                            />
                                        </td>
                                        <td className="px-6 py-4 cursor-pointer" onClick={() => navigate(`/paineldoadm/users/${user.id}`)}>
                                            <div className="font-bold text-slate-900 group-hover:text-black transition-colors">{user.full_name || 'Sem nome'}</div>
                                            <div className="text-sm text-slate-500">{user.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize
                        ${user.plan === 'pro' ? 'bg-black text-white' : 'bg-slate-100 text-slate-600'}
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
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={async () => {
                                                        // Registra o acesso ao painel do lojista (impersonação) antes de entrar.
                                                        // Best-effort: uma falha no log nunca bloqueia o acesso do admin.
                                                        try {
                                                            await auditLogService.logAction('impersonate', 'user', user.id, user.full_name || user.email);
                                                        } catch { /* não bloqueia */ }
                                                        navigate(`/paineldoadm/user/${user.id}`);
                                                    }}
                                                    title="Acessar Painel (Impersonate)"
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    <LogIn size={18} />
                                                </button>
                                                <button
                                                    onClick={() => setShowPasswordEdit({ id: user.id, name: user.full_name || user.email })}
                                                    title="Alterar Senha"
                                                    className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                >
                                                    <Key size={18} />
                                                </button>
                                                <button
                                                    onClick={() => setShowNotify(user.id)}
                                                    title="Notificar"
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                >
                                                    <Bell size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user.id, user.full_name || user.email)}
                                                    disabled={deleting}
                                                    title="Deletar usuário"
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <AdminPagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalCount={totalCount}
                        pageSize={pageSize}
                        hasPreviousPage={hasPreviousPage}
                        hasNextPage={hasNextPage}
                        onPreviousPage={goToPreviousPage}
                        onNextPage={goToNextPage}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}

            {/* Password Edit Modal */}
            {showPasswordEdit && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 animate-fadeUp">
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-slate-900">Alterar Senha</h3>
                            <p className="text-slate-500 text-sm">Mudando senha de: <span className="font-bold">{showPasswordEdit.name}</span></p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-900 uppercase mb-2">Nova Senha</label>
                                <input
                                    type="password"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    placeholder="Mín. 6 caracteres"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-900 uppercase mb-2">Confirmar Senha</label>
                                <input
                                    type="password"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    placeholder="Confirme a nova senha"
                                />
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowPasswordEdit(null);
                                    setNewPassword('');
                                    setConfirmPassword('');
                                }}
                                className="px-6 py-3 text-slate-500 hover:text-black hover:bg-slate-100 rounded-xl transition-colors font-bold text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleChangePassword}
                                disabled={changingPassword}
                                className="px-6 py-3 bg-amber-600 text-white rounded-xl flex items-center gap-2 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-amber-600/20 font-bold text-sm"
                            >
                                <Key size={18} /> {changingPassword ? 'Alterando...' : 'Alterar Senha'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Actions Modal */}
            <BulkActionsModal
                selectedCount={selectedUsers.size}
                selectedIds={Array.from(selectedUsers)}
                isOpen={showBulkModal}
                onClose={() => setShowBulkModal(false)}
                onConfirmDelete={handleBulkDelete}
                resourceType="user"
                isLoading={bulkDeleting}
            />

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
