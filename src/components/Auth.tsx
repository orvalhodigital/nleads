import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Mail, Lock, Loader2, ArrowRight, User, Eye, EyeOff, Building, Car } from 'lucide-react';
import { useSystemSettings } from '../hooks/useSystemSettings';

export default function Auth() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [businessType, setBusinessType] = useState<'vehicles' | null>(null);
    const [step, setStep] = useState<'choice' | 'form'>('choice');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    // Default to true as per user request to have password visible
    const [showPassword, setShowPassword] = useState(false);
    const { logoUrl } = useSystemSettings();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            if (isSignUp) {
                if (!fullName.trim()) throw new Error('Por favor, informe seu nome.');
                if (!companyName.trim()) throw new Error('Por favor, informe o nome da empresa.');
                if (!businessType) throw new Error('Por favor, selecione o tipo de negócio.');

                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                            company_name: companyName,
                            business_type: businessType, // Sending business type to Supabase
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

    const toggleMode = () => {
        setIsSignUp(!isSignUp);
        setStep('choice');
        setBusinessType(null);
        setError(null);
        setSuccess(null);
    };

    if (isSignUp && step === 'choice') {
        const options = [
            { id: 'vehicles', label: 'Revenda de Veículos', icon: Building, active: true },
            { id: 'realestate', label: 'Imóveis', icon: Building, active: false },
            { id: 'fashion', label: 'Moda e Acessórios', icon: Building, active: false },
            { id: 'beauty', label: 'Estética e Beleza', icon: Building, active: false },
            { id: 'health', icon: Building, label: 'Saúde', active: false },
            { id: 'education', icon: Building, label: 'Educação', active: false },
            { id: 'digital', icon: Building, label: 'Serviços Digitais', active: false },
        ];

        return (
            <div className="fixed inset-0 bg-white z-[100] flex flex-col overflow-y-auto animate-fadeUp">
                <div className="max-w-6xl mx-auto w-full px-6 py-20 flex flex-col items-center">
                    <div className="mb-16 text-center">
                        {logoUrl ? (
                            <img src={logoUrl} alt="Logo" className="h-16 w-auto object-contain mx-auto mb-8" />
                        ) : (
                            <img src="https://docs.nleads.pro/nleads-logo.png" alt="Logo" className="h-16 w-auto object-contain mx-auto mb-8" />
                        )}
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase mb-4">Escolha o seu nicho</h1>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Selecione o tipo de negócio que você gerencia</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-5xl">
                        {options.map((opt) => (
                            <button
                                key={opt.id}
                                disabled={!opt.active}
                                onClick={() => {
                                    setBusinessType(opt.id as any);
                                    setStep('form');
                                }}
                                className={`
                                    relative p-8 rounded-[2.5rem] border-2 transition-all group flex flex-col items-center text-center gap-6
                                    ${opt.active
                                        ? 'border-slate-100 bg-white hover:border-emerald-500 hover:shadow-2xl hover:shadow-emerald-500/10 active:scale-95'
                                        : 'border-slate-50 bg-slate-50/50 grayscale cursor-not-allowed opacity-60'
                                    }
                                `}
                            >
                                <div className={`
                                    w-16 h-16 rounded-2xl flex items-center justify-center transition-all
                                    ${opt.active ? 'bg-slate-900 text-white group-hover:bg-emerald-500' : 'bg-slate-200 text-slate-400'}
                                `}>
                                    {opt.id === 'vehicles' ? <Car size={32} /> : <Building size={32} />}
                                </div>
                                <div className="space-y-2">
                                    <h3 className={`font-black uppercase tracking-tight text-sm ${opt.active ? 'text-slate-900' : 'text-slate-400'}`}>
                                        {opt.label}
                                    </h3>
                                    {!opt.active && (
                                        <span className="inline-block px-3 py-1 bg-slate-200 rounded-full text-[9px] font-black text-slate-500 uppercase tracking-widest">Em breve</span>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="mt-20">
                        <button
                            onClick={toggleMode}
                            className="text-slate-400 hover:text-slate-900 font-extrabold uppercase tracking-widest text-xs transition-colors"
                        >
                            Já tenho uma conta. Fazer Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

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
                                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-2">Tipo de Negócio</label>
                                    <div className="w-full px-4 py-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="text-emerald-500 flex items-center justify-center">
                                                <Car size={18} />
                                            </div>
                                            <span className="font-black text-sm text-emerald-700">
                                                Revenda de Veículos
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setStep('choice')}
                                            className="text-[9px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-800 transition-colors bg-white px-3 py-1.5 rounded-lg border border-emerald-100 shadow-sm shrink-0"
                                        >
                                            Alterar
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-2">Nome Completo</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-0 bottom-0 my-auto text-slate-300 pointer-events-none" size={18} />
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
                                        <Building className="absolute left-4 top-0 bottom-0 my-auto text-slate-300 pointer-events-none" size={18} />
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
                                <Mail className="absolute left-4 top-0 bottom-0 my-auto text-slate-300 pointer-events-none" size={18} />
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
                                <Lock className="absolute left-4 top-0 bottom-0 my-auto text-slate-300 pointer-events-none" size={18} />
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
                                    className="absolute right-4 top-0 bottom-0 my-auto text-slate-400 hover:text-slate-600 transition-colors z-10"
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

                    <div className="mt-8 text-center bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <p className="text-xs font-bold text-slate-400 mb-3">
                            {isSignUp ? 'Já tem uma conta?' : 'Ainda não tem conta?'}
                        </p>
                        <button
                            onClick={toggleMode}
                            className="text-xs font-extrabold text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-colors"
                        >
                            {isSignUp ? 'Fazer Login' : 'Criar Nova Conta'}
                        </button>
                    </div>
                </div>
            </div>
        </div >
    );
}
