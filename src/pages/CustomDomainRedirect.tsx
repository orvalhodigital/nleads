import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import PublicSiteHome from './public/PublicSiteHome';

/**
 * Executado SOMENTE em domínios personalizados de clientes.
 * Busca o slug pelo domínio e renderiza o PublicSiteHome diretamente,
 * mantendo a URL limpa (ex: gelsonveiculos.com.br sem /site/slug).
 */
const CustomDomainRedirect: React.FC = () => {
    const [slug, setSlug] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const hostname = window.location.hostname;
        const pureHostname = hostname.replace(/^www\./, '');
        console.log('[CustomDomainRedirect] Hostname:', hostname);

        // Lê a view pública (não `profiles`): o anon não tem acesso à tabela base (A34).
        supabase
            .from('store_public_profile')
            .select('website_slug, website_active')
            .or(`custom_domain.eq.${hostname},custom_domain.eq.${pureHostname}`)
            .maybeSingle()
            .then(({ data, error: queryError }) => {
                if (queryError) {
                    setError(`Erro ao buscar configurações do site: ${queryError.message}`);
                    return;
                }
                if (!data) {
                    setError(`O domínio "${hostname}" não está associado a nenhum site configurado.`);
                    return;
                }
                if (!data.website_slug) {
                    setError('O endereço do site não foi configurado. Entre em contato com o administrador.');
                    return;
                }
                if (data.website_active === false) {
                    setError('Este site está temporariamente inativo.');
                    return;
                }
                console.log('[CustomDomainRedirect] Serving site for slug:', data.website_slug);
                setSlug(data.website_slug);
            });
    }, []);

    if (slug) {
        return <PublicSiteHome forcedSlug={slug} />;
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center space-y-4 bg-white p-8 rounded-2xl shadow-xl max-w-md mx-4">
                    <div className="text-5xl">⚠️</div>
                    <h2 className="text-lg font-bold text-slate-900">Site não encontrado</h2>
                    <p className="text-slate-600 text-sm leading-relaxed">{error}</p>
                    <a
                        href="https://painel.orvalhodigital.com.br"
                        className="inline-block mt-4 px-6 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-semibold hover:bg-slate-900 transition"
                    >
                        Ir para o Gestor de Pátio
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center space-y-4">
                <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-slate-700 animate-spin mx-auto" />
                <p className="text-slate-500 text-sm font-medium">Carregando site...</p>
            </div>
        </div>
    );
};

export default CustomDomainRedirect;
