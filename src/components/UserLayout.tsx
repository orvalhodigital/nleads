
import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import OtimizzaLogo, { LogoRenderer } from './OtimizzaLogo';
import { useSystemSettings } from '../hooks/useSystemSettings';
import logoOrvalhoVertical from '../assets/branding/logos/logo-orvalho.png';
import Header from './Header';
import Auth from './Auth';
import TrialExpired from './TrialExpired';
import GlobalSearch from './GlobalSearch';
import OnboardingWizard from './OnboardingWizard';
import OnboardingChecklist from './OnboardingChecklist';
import AppTour from './AppTour';
import { useData } from '../contexts/DataContext';
import { supabase } from '../lib/supabaseClient';
import { profileService } from '../services/profileService';

const UserLayout: React.FC = () => {
    const { session, loading, profile, impersonatedUserId, refreshProfile } = useData();
    const { logoUrl } = useSystemSettings();
    const location = useLocation();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [showRetry, setShowRetry] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchOpen(true);
            }
        };
        window.addEventListener('keydown', handler);

        // Escape hatch for long loading
        let timeout: any;
        if (loading) {
            timeout = setTimeout(() => setShowRetry(true), 8000);
        } else {
            setShowRetry(false);
        }

        return () => {
            window.removeEventListener('keydown', handler);
            if (timeout) clearTimeout(timeout);
        };
    }, [loading]);

    useEffect(() => {
        // Show onboarding if not completed and not impersonating
        if (profile && !profile.onboarding_completed && !impersonatedUserId) {
            setShowOnboarding(true);
        } else {
            setShowOnboarding(false);
        }
    }, [profile?.onboarding_completed, impersonatedUserId]);

    if (loading) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden">
                {/* Background Blobs */}
                <div className="absolute top-[-10%] right-[-5%] w-[50vw] h-[50vw] bg-emerald-100/40 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[50vw] h-[50vw] bg-blue-100/40 rounded-full blur-[100px] animate-pulse" />
                
                <div className="relative flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
                    <div className="relative">
                        {profile?.company_logo ? (
                            <img src={profile.company_logo} alt="Company Logo" className="h-16 w-auto object-contain" />
                        ) : (
                            <LogoRenderer src={logoUrl === '/branding/logos/logo-orvalho.png' ? logoOrvalhoVertical : (logoUrl || logoOrvalhoVertical)} variant="vertical" className="h-16 w-auto" />
                        )}
                    </div>
                        <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                                <div className="w-4 h-4 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                                Sincronizando seus dados...
                            </div>
                            
                            {showRetry && (
                                <button 
                                    onClick={() => window.location.reload()}
                                    className="mt-4 px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 shadow-sm transition-all animate-in fade-in slide-in-from-bottom-2"
                                >
                                    O carregamento está demorando? Clique para recarregar
                                </button>
                            )}
                        </div>
                    </div>
                </div>
        );
    }

    if (!session) {
        return <Navigate to="/login" replace />
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

                <div className="flex-1 overflow-y-auto p-4 pb-20 lg:px-10 lg:pt-10 lg:pb-6 flex flex-col">
                    <div className="w-full flex-1 flex flex-col animate-fadeUp">
                        <Outlet />
                    </div>
                </div>
            </main>

            <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

            {showOnboarding && (
                <OnboardingWizard
                    onComplete={() => {
                        setShowOnboarding(false);
                        refreshProfile();
                    }}
                />
            )}

            <OnboardingChecklist />
            <AppTour />
        </div>
    );
};

export default UserLayout;
