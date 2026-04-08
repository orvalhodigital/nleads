
import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import Header from './Header';
import Auth from './Auth';
import TrialExpired from './TrialExpired';
import { useData } from '../contexts/DataContext';
import { supabase } from '../lib/supabaseClient';

const UserLayout: React.FC = () => {
    const { session, loading, profile, impersonatedUserId } = useData();
    const location = useLocation();

    if (loading) {
        return <div className="h-screen w-screen flex items-center justify-center bg-[#FAFAFA] text-emerald-500 font-bold">Carregando...</div>
    }

    if (!session) {
        return <Auth />
    }

    if (profile?.planStatus === 'expired' && !impersonatedUserId) {
        return (
            <TrialExpired
                onUpgrade={() => {
                    const paymentLink = 'https://buy.stripe.com/dRm9AT0wEe5s93G0DY4ZG00';
                    const url = profile?.email
                        ? `${paymentLink}?prefilled_email=${encodeURIComponent(profile.email)}`
                        : paymentLink;
                    window.open(url, '_blank');
                }}
                onLogout={() => supabase.auth.signOut()}
            />
        );
    }

    return (
        <div className="flex h-screen bg-slate-50/50 text-slate-800 relative overflow-hidden font-sans">
            {/* Ambient Animated Blobs for Liquid Glass Effect */}
            <div className="absolute top-[-10%] right-[-5%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-emerald-300/20 rounded-full blur-[80px] md:blur-[120px] mix-blend-multiply animate-pulse pointer-events-none" style={{ animationDuration: '8s' }} />
            <div className="absolute bottom-[-10%] left-[-5%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-blue-300/20 rounded-full blur-[80px] md:blur-[120px] mix-blend-multiply animate-pulse pointer-events-none" style={{ animationDuration: '10s', animationDelay: '2s' }} />
            <div className="absolute top-[20%] left-[20%] w-[30vw] h-[30vw] max-w-[400px] max-h-[400px] bg-purple-300/20 rounded-full blur-[80px] md:blur-[100px] mix-blend-multiply animate-pulse pointer-events-none" style={{ animationDuration: '12s', animationDelay: '4s' }} />

            <AppSidebar />

            <main className="flex-1 flex flex-col min-w-0 relative z-10">
                <Header
                    currentView={location.pathname === '/' ? 'home' : (location.pathname.split('/')[1] as any) || 'dashboard'}
                    impersonatedUserId={impersonatedUserId}
                    companyName={profile?.company_name}
                />

                {impersonatedUserId && (
                    <div className="bg-amber-100/80 backdrop-blur-md text-amber-800 px-4 py-2 text-center text-sm font-semibold border-b border-amber-200">
                        ⚠️ Modo Admin: Visualizando como usuário {profile?.full_name || impersonatedUserId}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-4 pb-28 lg:p-10 flex flex-col">
                    <div className="max-w-[1440px] mx-auto w-full flex-1 flex flex-col animate-fadeUp">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default UserLayout;
