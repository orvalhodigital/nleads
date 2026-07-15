import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Lock, Loader2, Eye, EyeOff, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { LogoRenderer } from '../components/OtimizzaLogo';
import { useSystemSettings } from '../hooks/useSystemSettings';

/**
 * Página de redefinição de senha.
 * O usuário chega aqui pelo link enviado por e-mail (resetPasswordForEmail).
 * O supabase-js detecta o token na URL e cria uma sessão temporária de recuperação;
 * então basta chamar updateUser({ password }).
 */
const ResetPasswordPage: React.FC = () => {
    const navigate = useNavigate();
    const { logoUrl } = useSystemSettings();
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState(false);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        // Confirma que há uma sessão de recuperação válida vinda do link do e-mail.
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true);
        });
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) setReady(true);
        });
        return () => subscription.unsubscribe();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (password.length < 6) {
            setError('A senha precisa ter pelo menos 6 caracteres.');
            return;
        }
        if (password !== confirm) {
            setError('As senhas não coincidem.');
            return;
        }
        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
            setDone(true);
            setTimeout(() => navigate('/dashboard', { replace: true }), 2500);
        } catch (err: any) {
            console.error(err);
            const msg = (err.message || '').toLowerCase();
            if (msg.includes('same password')) {
                setError('A nova senha precisa ser diferente da anterior.');
            } else if (msg.includes('session') || msg.includes('token') || msg.includes('expired')) {
                setError('Link inválido ou expirado. Solicite um novo link de redefinição.');
            } else {
                setError(err.message || 'Não foi possível redefinir a senha.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="w-full max-w-md bg-card border border-border/70 rounded-3xl shadow-sm p-8">
                <div className="flex justify-center mb-6">
                    <LogoRenderer src={logoUrl} variant="horizontal" className="h-9 w-auto" />
                </div>

                {done ? (
                    <div className="text-center py-6">
                        <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 size={28} />
                        </div>
                        <h1 className="text-xl font-heading font-bold text-foreground">Senha redefinida!</h1>
                        <p className="text-sm text-muted-foreground mt-2">Redirecionando para o painel...</p>
                    </div>
                ) : (
                    <>
                        <h1 className="text-xl font-heading font-bold text-foreground text-center">Redefinir senha</h1>
                        <p className="text-xs text-muted-foreground text-center mt-1 mb-6">Escolha uma nova senha para sua conta.</p>

                        {!ready && (
                            <div className="mb-4 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] font-bold text-amber-600 dark:text-amber-400 text-center">
                                Abra esta página pelo link enviado no seu e-mail para redefinir a senha.
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Nova senha"
                                    className="w-full pl-11 pr-11 py-3 bg-muted/50 border border-border rounded-xl font-semibold text-sm text-foreground focus:bg-card focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>

                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={confirm}
                                    onChange={(e) => setConfirm(e.target.value)}
                                    placeholder="Confirmar nova senha"
                                    className="w-full pl-11 pr-4 py-3 bg-muted/50 border border-border rounded-xl font-semibold text-sm text-foreground focus:bg-card focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                />
                            </div>

                            {error && (
                                <div className="p-2.5 bg-destructive/10 border border-destructive/20 rounded-xl text-[11px] font-bold text-destructive text-center">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                            >
                                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                                {loading ? 'Salvando...' : 'Redefinir senha'}
                            </button>
                        </form>

                        <Link to="/login" className="flex items-center justify-center gap-1.5 mt-6 text-[11px] font-bold text-muted-foreground hover:text-primary transition-colors">
                            <ArrowLeft size={13} /> Voltar para o login
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
};

export default ResetPasswordPage;
