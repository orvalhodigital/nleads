import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

/**
 * Redirect users from custom domain to their website
 * e.g., otimizza.com.br -> /site/otimizza
 */
const CustomDomainRedirect: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const redirectCustomDomain = async () => {
            // Get the current hostname
            const hostname = window.location.hostname;

            // Check if it's a custom domain (not veiculos.nleads.pro)
            const isCustomDomain = !hostname.includes('nleads.pro') && !hostname.includes('localhost');

            if (!isCustomDomain) {
                // Not a custom domain, let normal routing handle it
                return;
            }

            try {
                // Find the profile with this custom domain
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('website_slug')
                    .eq('custom_domain', hostname)
                    .single();

                if (error || !profile) {
                    console.error('Custom domain not found:', hostname);
                    // Domain not configured, show error or redirect
                    navigate('/');
                    return;
                }

                // Redirect to the website
                navigate(`/site/${profile.website_slug}`, { replace: true });
            } catch (err) {
                console.error('Error redirecting custom domain:', err);
                navigate('/');
            }
        };

        redirectCustomDomain();
    }, [navigate]);

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
