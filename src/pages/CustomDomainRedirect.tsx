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

            // Check if it's a custom domain (not nleads.pro and not localhost/127.0.0.1)
            const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168');
            const isNleadsPro = hostname.includes('nleads.pro');
            const isCustomDomain = !isLocalhost && !isNleadsPro;

            if (!isCustomDomain) {
                // Not a custom domain, redirect to the app dashboard.
                navigate('/dashboard', { replace: true });
                return;
            }

            try {
                console.log('Checking custom domain:', hostname);

                // Find the profile with this custom domain
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('website_slug')
                    .eq('custom_domain', hostname)
                    .single();

                if (error) {
                    console.error('Error querying custom domain:', error);
                    return;
                }

                if (!profile || !profile.website_slug) {
                    console.warn('No profile found for custom domain:', hostname);
                    return;
                }

                console.log('Redirecting to website:', profile.website_slug);
                // Redirect to the website
                navigate(`/site/${profile.website_slug}`, { replace: true });
            } catch (err) {
                console.error('Error redirecting custom domain:', err);
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
