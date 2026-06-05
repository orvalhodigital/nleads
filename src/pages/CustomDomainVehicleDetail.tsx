import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import PublicVehicleDetail from './public/PublicVehicleDetail';

/**
 * Executado SOMENTE em domínios personalizados de clientes.
 * Busca o slug da loja pelo domínio e renderiza PublicVehicleDetail diretamente,
 * mantendo a URL limpa (ex: gelsonveiculos.com.br/veiculo/honda-civic-2022-abc123).
 */
const CustomDomainVehicleDetail: React.FC = () => {
    const { vehicleParam } = useParams<{ vehicleParam: string }>();
    const [slug, setSlug] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const hostname = window.location.hostname;
        const pureHostname = hostname.replace(/^www\./, '');
        console.log('[CustomDomainVehicleDetail] Hostname:', hostname);

        supabase
            .from('profiles')
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
                console.log('[CustomDomainVehicleDetail] Serving vehicle detail for slug:', data.website_slug);
                setSlug(data.website_slug);
            });
    }, []);

    if (slug && vehicleParam) {
        return <PublicVehicleDetail forcedSlug={slug} forcedVehicleParam={vehicleParam} />;
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center space-y-4 bg-white p-8 rounded-2xl shadow-xl max-w-md mx-4">
                    <div className="text-5xl">⚠️</div>
                    <h2 className="text-lg font-bold text-slate-900">Site não encontrado</h2>
                    <p className="text-slate-600 text-sm leading-relaxed">{error}</p>
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

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center space-y-4">
                <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-slate-700 animate-spin mx-auto" />
                <p className="text-slate-500 text-sm font-medium">Carregando veículo...</p>
            </div>
        </div>
    );
};

export default CustomDomainVehicleDetail;
