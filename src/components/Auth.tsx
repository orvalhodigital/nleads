import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Mail, Lock, Loader2, ArrowRight, User, Eye, EyeOff, Building } from 'lucide-react';
import { useSystemSettings } from '../hooks/useSystemSettings';

export default function Auth() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    // Default to true as per user request to have password visible
    const [showPassword, setShowPassword] = useState(false);
    const { logoUrl } = useSystemSettings();

    const handleGoogleAuth = async () => {
        setLoading(true);
        setError(null);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin },
        });
        if (error) setError(error.message);
        setLoading(false);
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            if (isSignUp) {
                if (!fullName.trim()) throw new Error('Por favor, informe seu nome.');
                if (!companyName.trim()) throw new Error('Por favor, informe o nome da empresa.');

                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                            company_name: companyName, // Sending company name to Supabase
                        }
                    }
                });
                if (error) throw error;
                setSuccess('Conta criada com sucesso! Verifique seu e-mail para confirmar.');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            }
        } catch (err: any) {
            console.error(err);
            let msg = err.message || 'Ocorreu um erro ao tentar autenticar.';
            if (msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('network error')) {
                msg = 'Erro de conexão. Verifique sua internet, e se as variáveis de ambiente (URL e Chave do Supabase) estão configuradas corretamente no arquivo .env.local.';
            }
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (

        <div className="h-screen overflow-y-auto bg-[#FAFAFA] custom-scrollbar">
            <div className="min-h-full flex flex-col items-center justify-center p-4 py-12">
                <div className="w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-100 animate-fadeUp">
                    <div className="text-center mb-8">
                        {logoUrl ? (
                            <img src={logoUrl} alt="Logo" className="h-16 w-auto object-contain mx-auto mb-4" />
                        ) : (
                            <img src="https://docs.nleads.pro/nleads-logo.png" alt="Logo" className="h-16 w-auto object-contain mx-auto mb-4" />
                        )}
                        <p className="text-sm font-bold text-slate-400">
                            {isSignUp ? 'Crie sua conta para começar' : 'Faça login na sua conta'}
                        </p>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-6">
                        {isSignUp && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-2">Nome Completo</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                        <input
                                            type="text"
                                            required={isSignUp}
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm text-slate-900 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none"
                                            placeholder="João Silva"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-2">Nome da Empresa</label>
                                    <div className="relative">
                                        <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                        <input
                                            type="text"
                                            required={isSignUp}
                                            value={companyName}
                                            onChange={(e) => setCompanyName(e.target.value)}
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm text-slate-900 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none"
                                            placeholder="Sua Empresa"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-2">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm text-slate-900 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none"
                                    placeholder="seu@email.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-2">Senha</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm text-slate-900 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors z-10"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-500 text-center">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-xs font-bold text-emerald-600 text-center">
                                {success}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group"
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : (
                                <>
                                    {isSignUp ? 'Criar Conta' : 'Entrar'}
                                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* ── Google OAuth ── */}
                    <div className="mt-6">
                        <div className="relative flex items-center gap-3 mb-6">
                            <div className="flex-1 h-px bg-slate-100" />
                            <span className="text-[10px] font-extrabold text-slate-300 uppercase tracking-widest shrink-0">ou continue com</span>
                            <div className="flex-1 h-px bg-slate-100" />
                        </div>

                        <button
                            type="button"
                            onClick={handleGoogleAuth}
                            disabled={loading}
                            className="w-full py-4 bg-white border border-slate-200 rounded-2xl font-bold text-sm text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-3 shadow-sm"
                        >
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.615Z" fill="#4285F4"/>
                                <path d="M9 18c2.43 0 4.4673-.806 5.9564-2.1805l-2.9087-2.2581c-.8055.54-1.8354.859-3.0477.859-2.3446 0-4.3282-1.5836-5.036-3.7104H.9574v2.3318C2.4382 15.9832 5.4818 18 9 18Z" fill="#34A853"/>
                                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.5891.1018-1.1618.282-1.71V4.9582H.9574A8.9961 8.9961 0 0 0 0 9c0 1.4518.3477 2.8255.9573 4.0418L3.964 10.71Z" fill="#FBBC05"/>
                                <path d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.426 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9582L3.964 7.29C4.6718 5.1632 6.6554 3.5795 9 3.5795Z" fill="#EA4335"/>
                            </svg>
                            Entrar com Google
                        </button>
                    </div>

                    <div className="mt-6 text-center bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <p className="text-xs font-bold text-slate-400 mb-3">
                            {isSignUp ? 'Já tem uma conta?' : 'Ainda não tem conta?'}
                        </p>
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-xs font-extrabold text-emerald-600 hover:text-emerald-700 uppercase tracking-widest transition-colors"
                        >
                            {isSignUp ? 'Fazer Login' : 'Criar Nova Conta'}
                        </button>
                    </div>
                </div>
            </div>
        </div >
    );
}
