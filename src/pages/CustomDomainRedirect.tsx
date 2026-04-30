import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

/**
 * Redirect users from custom domain to their website
 * e.g., otimizza.com.br -> /site/otimizza
 */
const CustomDomainRedirect: React.FC = () => {
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const redirectCustomDomain = async () => {
            // Get the current hostname
            const hostname = window.location.hostname;
            console.log('CustomDomainRedirect: Checking hostname:', hostname);

            // Check if it's a custom domain (not nleads.pro, not nleads.com.br, and not localhost/127.0.0.1)
            const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168');
            const isNleadsPro = hostname.includes('nleads.pro') || hostname.includes('nleads.com.br');
            const isCustomDomain = !isLocalhost && !isNleadsPro;

            console.log('CustomDomainRedirect:', { isLocalhost, isNleadsPro, isCustomDomain });

            if (!isCustomDomain) {
                // Not a custom domain, redirect to the app dashboard.
                console.log('Not a custom domain, redirecting to /dashboard');
                navigate('/dashboard', { replace: true });
                return;
            }

            try {
                console.log('Checking custom domain in database:', hostname);

                // Find the profile with this custom domain
                const { data: profile, error: queryError } = await supabase
                    .from('profiles')
                    .select('website_slug, website_active')
                    .eq('custom_domain', hostname)
                    .maybeSingle();

                if (queryError) {
                    console.error('Error querying custom domain:', queryError);
                    setError(`Erro ao buscar domínio: ${queryError.message}`);
                    return;
                }

                if (!profile) {
                    console.warn('No profile found for custom domain:', hostname);
                    setError(`Domínio ${hostname} não está registrado no sistema.`);
                    return;
                }

                if (!profile.website_slug) {
                    console.warn('Profile found but no website_slug:', profile);
                    setError('Slug do site não foi configurado. Contate o administrador.');
                    return;
                }

                if (profile.website_active === false) {
                    console.warn('Website is inactive:', profile.website_slug);
                    setError('Este site está inativo no momento.');
                    return;
                }

                console.log('Redirecting to website:', profile.website_slug);
                // Redirect to the website
                navigate(`/site/${profile.website_slug}`, { replace: true });
            } catch (err: any) {
                console.error('Error redirecting custom domain:', err);
                setError(`Erro ao redirecionar: ${err.message}`);
            }
        };

        redirectCustomDomain();
    }, [navigate]);

    // If there's an error, show it
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center space-y-4 bg-white p-8 rounded-lg shadow-lg max-w-md">
                    <div className="text-red-600 text-5xl">⚠️</div>
                    <h2 className="text-lg font-bold text-slate-900">Erro ao carregar página</h2>
                    <p className="text-slate-600">{error}</p>
                    <button
                        onClick={() => window.location.href = 'https://www.nleads.pro'}
                        className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition"
                    >
                        Voltar ao nLeads
                    </button>
                </div>
            </div>
        );
    }

    // Show loading while redirecting
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center space-y-4">
                <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-slate-800 animate-spin mx-auto" />
                <p className="text-slate-600 font-medium">Carregando...</p>
            </div>
        </div>
    );
};

export default CustomDomainRedirect;
