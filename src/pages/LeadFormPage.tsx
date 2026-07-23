import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LeadForm from '../components/LeadForm';
import { useAuthContext } from '../contexts/AuthContext';
import { useLeadContext } from '../contexts/LeadContext';
import PageContainer from '../components/ui/PageContainer';
import PlanLimitAlert from '../components/PlanLimitAlert';
import { ArrowLeft } from 'lucide-react';
import { isLimitedPlan } from '../lib/planAccess';

const LeadFormPage: React.FC = () => {
    const { id } = useParams<{ id?: string }>();
    const navigate = useNavigate();
    const { profile } = useAuthContext();
    const { leads, addLead, updateLead } = useLeadContext();

    const isEditing = !!id;
    const leadToEdit = isEditing ? leads.find(l => l.id === id) : undefined;

    // Precisa rodar antes de qualquer `return` condicional abaixo — senão, ao
    // atingir o limite do plano Free entre um render e outro, o número de
    // hooks chamados muda e o React derruba a página ("Rendered more/fewer
    // hooks than during the previous render").
    React.useEffect(() => {
        if (isEditing && !leadToEdit) {
            // Wait a bit for initial data load if leads is empty
            if (leads.length > 0) {
                navigate('/leads');
            }
        }
    }, [isEditing, leadToEdit, leads.length, navigate]);

    const isFreePlan = isLimitedPlan(profile?.plan);
    if (isFreePlan && !isEditing && leads.length >= 50) {
        return (
            <PageContainer className="pb-32 animate-fadeUp">
                <div className="flex items-center gap-6 mb-10">
                    <button
                        onClick={() => navigate('/leads')}
                        className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all hover:bg-slate-50 active:scale-95 shadow-sm"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
                            Novo Lead
                        </h1>
                    </div>
                </div>
                <div className="max-w-2xl">
                    <PlanLimitAlert
                        plan={profile?.plan || 'free'}
                        featureName="Leads"
                        currentCount={leads.length}
                        limit={50}
                        email={profile?.email}
                    />
                </div>
            </PageContainer>
        );
    }

    return (
        <LeadForm
            isEditing={isEditing}
            initialData={leadToEdit}
            onSave={async (lead) => {
                if (isEditing && id) {
                    await updateLead({ ...lead, id } as any);
                    navigate('/leads');
                } else {
                    const newLead = await addLead(lead as any);
                    if (newLead) {
                        navigate('/leads');
                    }
                }
            }}
        />
    );
};

export default LeadFormPage;
