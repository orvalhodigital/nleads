import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

// Domains that belong to Otimizza / nLeads itself — everything else is a customer custom domain
const NLEADS_HOSTS = ['localhost', '127.0.0.1', 'nleads.pro', 'nleads.com.br', 'otimizza.pro', 'otimizza.com.br', 'otimizzacrm.pro', 'otimizzacrm.com.br', 'vercel.app'];

function isNleadsHost(hostname: string): boolean {
    return NLEADS_HOSTS.some(h => hostname === h || hostname.endsWith(`.${h}`));
}

interface Props {
    children: React.ReactNode; // the normal Otimizza app
    PublicSite: React.ComponentType<{ slug: string }>; // public site renderer
}

type State =
    | { phase: 'checking' }
    | { phase: 'app' }
    | { phase: 'site'; slug: string }
    | { phase: 'error'; message: string };

const RootGate: React.FC<Props> = ({ children, PublicSite }) => {
    const [state, setState] = useState<State>({ phase: 'checking' });

    useEffect(() => {
        const hostname = window.location.hostname;

        if (isNleadsHost(hostname)) {
            setState({ phase: 'app' });
            return;
        }

        // Custom domain — look up which profile owns it
        supabase
            .from('profiles')
            .select('website_slug, website_active')
            .eq('custom_domain', hostname)
            .maybeSingle()
            .then(({ data, error }) => {
                if (error) {
                    setState({ phase: 'error', message: `Erro ao carregar site: ${error.message}` });
                    return;
                }
                if (!data) {
                    setState({ phase: 'error', message: `Domínio ${hostname} não está registrado.` });
                    return;
                }
                if (!data.website_slug) {
                    setState({ phase: 'error', message: 'Site ainda não configurado. Contate o proprietário.' });
                    return;
                }
                if (data.website_active === false) {
                    setState({ phase: 'error', message: 'Este site está temporariamente inativo.' });
                    return;
                }
                setState({ phase: 'site', slug: data.website_slug });
            });
    }, []);

    if (state.phase === 'checking') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-slate-800 animate-spin" />
            </div>
        );
    }

    if (state.phase === 'error') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 max-w-sm text-center space-y-4 mx-4">
                    <div className="text-5xl">⚠️</div>
                    <h2 className="text-lg font-bold text-slate-900">Site não encontrado</h2>
                    <p className="text-sm text-slate-600 leading-relaxed">{state.message}</p>
                    <a
                        href="https://otimizzacrm.com.br"
                        className="inline-block mt-4 px-6 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-semibold hover:bg-slate-900 transition"
                    >
                        Ir para Otimizza CRM
                    </a>
                </div>
            </div>
        );
    }

    if (state.phase === 'site') {
        return <PublicSite slug={state.slug} />;
    }

    // phase === 'app'
    return <>{children}</>;
};

export default RootGate;
