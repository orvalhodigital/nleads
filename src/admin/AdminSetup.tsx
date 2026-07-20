
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { LogoRenderer } from '../components/OrvalhoLogo';

export default function AdminSetup() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleSetup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (password !== confirmPassword) {
            setError('Senhas não conferem');
            setLoading(false);
            return;
        }

        try {
            // 1. Sign Up
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    },
                },
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error("Erro ao criar usuário");

            // Check if session exists (Email Confirmation might be on)
            if (!authData.session) {
                throw new Error("Cadastro realizado, mas a sessão não foi iniciada. Verifique se recebeu um email de confirmação.");
            }

            // 1.5. Wait for profile creation (Trigger latency handle)
            let profileExists = false;
            for (let i = 0; i < 5; i++) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('id', authData.user.id)
                    .single();

                if (profile) {
                    profileExists = true;
                    break;
                }
                // Wait 1s
                await new Promise(r => setTimeout(r, 1000));
            }

            if (!profileExists) {
                // Fallback: Try to verify if we can proceed anyway, or throw error
                console.warn("Profile creation lagging, attempting claim anyway...");
            }

            // 2. Claim Admin Access
            // We wait a bit or retry as Trigger might take ms to create profile
            // Actually, handle_new_user trigger runs immediately in same transaction usually.

            const { data: success, error: rpcError } = await supabase.rpc('claim_first_admin');

            if (rpcError) throw rpcError;

            if (!success) {
                throw new Error('Não foi possível reivindicar acesso de administrador. Já existe um administrador cadastrado?');
            }

            // Success!
            alert('Setup concluído com sucesso! Você é o administrador.');

            // Ensure we sign out so the user has to log in (and lands on Login page)
            await supabase.auth.signOut();

            // Force navigation to Login
            window.location.href = '/paineldoadm/login';

        } catch (err: any) {
            setError(err.message || 'Erro ao realizar setup');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-neutral-100">
                <div className="bg-white p-8 text-center flex flex-col items-center border-b border-neutral-100">
                    <img
                        src="/branding/logos/logo-orvalho.png"
                        alt="Orvalho Digital Logo"
                        className="h-12 w-auto object-contain cursor-pointer transition-opacity hover:opacity-80"
                        onClick={() => window.location.reload()}
                    />
                </div>
                <div className="p-8">
                    {error && (
                        <div className="mb-4 bg-red-50 text-red-600 px-4 py-3 rounded-md text-sm font-medium border border-red-100">
                            {error}
                        </div>
                    )}
                    <h2 className="text-xl font-bold text-neutral-900 mb-6 text-center">Configuração Inicial</h2>

                    <form onSubmit={handleSetup} className="space-y-5">
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">Nome Completo</label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-neutral-900 font-medium"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Seu nome"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">Email</label>
                            <input
                                type="email"
                                required
                                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-neutral-900 font-medium"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@exemplo.com"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">Senha</label>
                            <input
                                type="password"
                                required
                                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-neutral-900 font-medium"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                minLength={6}
                                placeholder="••••••••"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">Confirmar Senha</label>
                            <input
                                type="password"
                                required
                                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-neutral-900 font-medium"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                minLength={6}
                                placeholder="••••••••"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-black text-white py-4 rounded-xl hover:bg-neutral-800 transition-colors font-bold tracking-wide disabled:opacity-70 mt-2"
                        >
                            {loading ? 'CRIANDO CONTA...' : 'FINALIZAR CONFIGURAÇÃO'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
