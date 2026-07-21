import React from 'react';
import Agenda from '../components/Agenda';
import PageContainer from '../components/ui/PageContainer';
import { useData } from '../contexts/DataContext';
import PlanLimitAlert from '../components/PlanLimitAlert';
import { isLimitedPlan } from '../lib/planAccess';

const AgendaPage: React.FC = () => {
    const { profile, loading } = useData();

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[400px]">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-brand-500 rounded-full animate-spin" />
            </div>
        );
    }

    const isFreePlan = isLimitedPlan(profile?.plan);
    if (isFreePlan) {
        return (
            <PageContainer>
                <div className="max-w-2xl mx-auto mt-8">
                    <PlanLimitAlert
                        plan={profile?.plan || 'free'}
                        featureName="Agenda"
                        email={profile?.email}
                    />
                </div>
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            <Agenda />
        </PageContainer>
    );
};

export default AgendaPage;
