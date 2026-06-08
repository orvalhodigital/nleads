import React from 'react';
import { useData } from '../contexts/DataContext';
import WebsiteSettings from '../components/settings/WebsiteSettings';
import PlanLimitAlert from '../components/PlanLimitAlert';

const WebsitePage: React.FC = () => {
    const { profile, refreshProfile, loading } = useData();

    if (loading || !profile) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
                    <p className="text-slate-400 font-bold text-sm animate-pulse">Carregando Motor de Temas...</p>
                </div>
            </div>
        );
    }

    if (profile.plan !== 'pro') {
        return (
            <div className="flex-1 space-y-8 pb-20">
                <div className="px-4 md:px-0 max-w-2xl mt-8">
                    <PlanLimitAlert
                        plan={profile.plan}
                        featureName="Configurações do Site"
                        email={profile.email}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-8 pb-20">
            <div className="px-4 md:px-0">
                <WebsiteSettings profile={profile} onUpdate={refreshProfile} />
            </div>
        </div>
    );
};

export default WebsitePage;
