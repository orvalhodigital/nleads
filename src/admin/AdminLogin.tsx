
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { LogoRenderer } from '../components/OrvalhoLogo';

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [logoUrl, setLogoUrl] = useState<string | null>(null);

    React.useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data } = await supabase.from('system_settings').select('key, value').in('key', ['logo_url', 'temp_logo_url', 'temp_logo_start', 'temp_logo_end']);

            if (data) {
                const settings = data.reduce((acc: any, curr) => {
                    acc[curr.key] = curr.value;
                    return acc;
                }, {});

                const now = new Date();
                const start = settings['temp_logo_start'] ? new Date(settings['temp_logo_start']) : null;
                const end = settings['temp_logo_end'] ? new Date(settings['temp_logo_end']) : null;
                const tempUrl = settings['temp_logo_url'];

                if (tempUrl && start && end && now >= start && now <= end) {
                    setLogoUrl(tempUrl);
                } else {
                    setLogoUrl(settings['logo_url']);
                }
            }
        } catch (error) {
            console.error('Error loading logo', error);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) throw authError;

            // Check if user is admin
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', authData.user.id)
                .single();

            if (profileError) throw profileError;

            if (profile?.role !== 'admin') {
                await supabase.auth.signOut();
                throw new Error('Acesso não autorizado. Este login é restrito a administradores.');
            }

            // If success, standard auth listener in AdminApp (or App) will handle the redirect
            // Or we can manually navigate
            window.location.href = '/paineldoadm';

        } catch (err: any) {
            setError(err.message || 'Erro ao realizar login');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-neutral-100">
                <div className="bg-white p-8 text-center flex flex-col items-center border-b border-neutral-100">
                    <div className="flex items-center gap-3 mb-2">
                        <LogoRenderer src={logoUrl} variant="horizontal" className="h-12 w-auto" />
                    </div>
                    <p className="text-neutral-500 text-sm font-medium">Painel do Administrador</p>
                </div>
                <div className="p-8">
                    {error && (
                        <div className={`mb-4 px-4 py-3 rounded-md text-sm font-medium ${error.includes('chave de acesso') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">Email Admin</label>
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
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="relative pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-black text-white py-4 rounded-xl hover:bg-neutral-800 transition-colors font-bold tracking-wide disabled:opacity-70 relative overflow-hidden select-none active:scale-[0.99]"
                            >
                                <span className="relative z-10 pointer-events-none">
                                    {loading ? 'VERIFICANDO...' : 'ENTRAR'}
                                </span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            {/* Footer / Copyright */}
            <div className="absolute bottom-6 text-neutral-600 text-xs text-center w-full">
                &copy; {new Date().getFullYear()} Orvalho Security. Acesso Monitorado.
            </div>
        </div>
    );
}
