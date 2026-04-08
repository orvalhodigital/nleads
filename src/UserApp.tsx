import React, { useState, useEffect } from 'react';
import { Lead, Vehicle, LeadPhase, SaleDetails, View, Profile, Plan } from './types';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import LeadManager from './components/LeadManager';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { supabase } from './lib/supabaseClient';
import { vehicleService } from './services/vehicleService';
import { leadService } from './services/leadService';
import { profileService } from './services/profileService';
import Auth from './components/Auth';
import UserArea from './components/UserArea';
import TrialExpired from './components/TrialExpired';

const ACTIVE_LEAD_PHASES = [
    LeadPhase.NEW,
    LeadPhase.SIMULATION,
    LeadPhase.VISIT,
    LeadPhase.FOLLOW_UP
];

const SALES_CLOSED_PHASES = [
    LeadPhase.WAITING_PAYMENT,
    LeadPhase.DOCUMENTATION,
    LeadPhase.DELIVERY,
    LeadPhase.COMPLETED
];

interface UserAppProps {
    impersonatedUserId?: string;
}

const UserApp: React.FC<UserAppProps> = ({ impersonatedUserId }) => {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentView, setCurrentView] = useState<View>('dashboard');
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [focusedLeadId, setFocusedLeadId] = useState<string | null>(null);

    const loadData = async () => {
        const [vehiclesResult, leadsResult, profileResult] = await Promise.allSettled([
            vehicleService.getAll(impersonatedUserId),
            leadService.getAll(impersonatedUserId),
            profileService.getProfile(impersonatedUserId),
        ]);

        if (vehiclesResult.status === 'fulfilled') setVehicles(vehiclesResult.value);
        else console.error('Erro ao carregar veículos:', vehiclesResult.reason);

        if (leadsResult.status === 'fulfilled') setLeads(leadsResult.value);
        else console.error('Erro ao carregar leads:', leadsResult.reason);

        if (profileResult.status === 'fulfilled') setProfile(profileResult.value);
        else console.error('Erro ao carregar perfil:', profileResult.reason);
    };

    useEffect(() => {
        if (session) {
            loadData();
            // Trigger Automated Notifications Check (Fire and Forget)
            supabase.rpc('check_and_send_automated_notifications', { target_user_id: session.user.id })
                .then(({ error }: any) => { if (error) console.error('Notification Trigger Custom Error:', error); });
        }
    }, [session, impersonatedUserId]);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleViewLead = (leadId: string) => {
        setFocusedLeadId(leadId);
        setCurrentView('leads');
    };

    const addVehicle = async (v: Omit<Vehicle, 'id'>) => {
        try {
            // Create implementation might need adjustment for impersonation but for now let's assume admin won't create data as user often
            // Or we need to update service.create to accept userId. 
            // Current RLS allows inserting if it matches auth.uid OR admin.
            // But user_id column defaults to auth.uid(). Admin inserting -> user_id = admin_id.
            // Changing this is complex. Admin should probably just VIEW.
            const newVehicle = await vehicleService.create(v);
            setVehicles(prev => [newVehicle, ...prev]);
        } catch (error) {
            alert('Erro ao criar veículo');
            console.error(error);
        }
    };

    const updateVehicle = async (updated: Vehicle) => {
        try {
            const newVehicle = await vehicleService.update(updated);
            setVehicles(prev => prev.map(v => v.id === updated.id ? newVehicle : v));
        } catch (error) {
            alert('Erro ao atualizar veículo');
            console.error(error);
        }
    };

    const deleteVehicle = async (id: string) => {
        if (window.confirm("Remover veículo permanentemente?")) {
            try {
                await vehicleService.delete(id);
                setVehicles(prev => prev.filter(v => v.id !== id));
            } catch (error) {
                alert('Erro ao excluir veículo');
                console.error(error);
            }
        }
    };

    const handleSellVehicle = async (vehicleId: string, saleDetails: SaleDetails) => {
        try {
            await vehicleService.sell(vehicleId, saleDetails);

            setVehicles(prev => prev.map(v => {
                if (v.id === vehicleId) {
                    return {
                        ...v,
                        status: 'sold',
                        saleDetails: saleDetails
                    };
                }
                return v;
            }));

            if (saleDetails.buyerLeadId) {
                const leadToUpdate = leads.find(l => l.id === saleDetails.buyerLeadId);
                if (leadToUpdate) {
                    const now = new Date().toISOString();
                    const newPhase = LeadPhase.COMPLETED;
                    const updatedHistory = {
                        ...leadToUpdate.funnelHistory,
                        [newPhase]: now
                    };
                    const updatedLead = await leadService.update({
                        ...leadToUpdate,
                        phase: newPhase,
                        lastUpdate: now,
                        funnelHistory: updatedHistory
                    });
                    setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
                }
            }
        } catch (error) {
            alert('Erro ao registrar venda');
            console.error(error);
        }
    };

    const updateLead = async (updated: Lead) => {
        const oldLead = leads.find(l => l.id === updated.id);
        let newHistory = { ...updated.funnelHistory };
        const now = new Date().toISOString();

        if (oldLead && oldLead.phase !== updated.phase) {
            newHistory[updated.phase] = now;
            if (updated.phase === LeadPhase.DISQUALIFIED) {
                const createdTime = newHistory[LeadPhase.NEW];
                newHistory = {
                    [LeadPhase.NEW]: createdTime || now,
                    [LeadPhase.DISQUALIFIED]: now
                };
            }
        }

        const leadToSave = { ...updated, funnelHistory: newHistory };
        setLeads(prev => prev.map(l => l.id === updated.id ? leadToSave : l));

        try {
            const savedLead = await leadService.update(leadToSave);
            setLeads(prev => prev.map(l => l.id === updated.id ? savedLead : l));
        } catch (error) {
            console.error(error);
            alert('Erro ao atualizar lead. Recarregue a página.');
            if (oldLead) {
                setLeads(prev => prev.map(l => l.id === updated.id ? oldLead : l));
            }
        }
    };

    const addLead = async (l: any) => {
        try {
            const defaultPreferences = {
                tipos_veiculo: [],
                marcas: [],
                modelos: [],
                transmissao: [],
                motorizacao: [],
                valor_maximo: 0,
                possui_entrada: false,
                possui_troca: false
            };
            const leadWithHistory = {
                ...l,
                preferences: {
                    ...defaultPreferences,
                    ...(l.preferences || {})
                },
                tags: l.tags || [],
                notes: l.notes || '',
                funnelHistory: {
                    [LeadPhase.NEW]: new Date().toISOString(),
                    ...(l.funnelHistory || {})
                }
            };
            const newLead = await leadService.create(leadWithHistory);
            setLeads(prev => [newLead, ...prev]);
            return newLead;
        } catch (error) {
            alert('Erro ao criar lead');
            console.error(error);
            return null;
        }
    };

    const deleteLead = async (id: string) => {
        if (window.confirm("Remover lead permanentemente?")) {
            try {
                await leadService.delete(id);
                setLeads(prev => prev.filter(l => l.id !== id));
            } catch (error) {
                alert('Erro ao excluir lead');
                console.error(error);
            }
        }
    };

    if (loading) {
        return <div className="h-screen w-screen flex items-center justify-center bg-[#FAFAFA] text-emerald-500 font-bold">Carregando...</div>
    }

    if (!session) {
        return <Auth />
    }

    if (profile?.planStatus === 'expired' && !impersonatedUserId) {
        // Only show expired screen if NOT impersonating (Admins want to see the data anyway)
        return (
            <TrialExpired
                onUpgrade={(plan?: Plan) => {
                    const paymentLink = plan?.stripe_url || 'https://buy.stripe.com/dRm9AT0wEe5s93G0DY4ZG00';
                    const url = profile?.email
                        ? `${paymentLink}${paymentLink.includes('?') ? '&' : '?'}prefilled_email=${encodeURIComponent(profile.email)}`
                        : paymentLink;
                    window.open(url, '_blank');
                }}
                onLogout={() => supabase.auth.signOut()}
            />
        );
    }

    return (
        <div className="flex h-screen bg-[#FAFAFA] text-slate-800">
            <Sidebar
                currentView={currentView}
                onNavigate={setCurrentView}
                profile={profile}
                isImpersonating={!!impersonatedUserId}
            />

            <main className="flex-1 flex flex-col min-w-0 relative">
                <Header
                    currentView={currentView}
                    impersonatedUserId={impersonatedUserId}
                    onNavigate={setCurrentView}
                />
                {impersonatedUserId && (
                    <div className="bg-amber-100 text-amber-800 px-4 py-2 text-center text-sm font-semibold border-b border-amber-200">
                        ⚠️ Modo Admin: Visualizando como usuário {profile?.full_name || impersonatedUserId}
                    </div>
                )}
                <div className="flex-1 overflow-y-auto p-4 pb-28 lg:p-10 flex flex-col">
                    <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col animate-fadeUp">
                        {currentView === 'dashboard' && <Dashboard leads={leads} vehicles={vehicles} />}

                        {currentView === 'inventory' && (
                            <Inventory
                                vehicles={vehicles}
                                onAddVehicle={addVehicle}
                                onUpdateVehicle={updateVehicle}
                                onDeleteVehicle={deleteVehicle}
                                onSellVehicle={handleSellVehicle}
                                onAddLead={addLead}
                                onViewLead={handleViewLead}
                                leads={leads}
                                userEmail={profile?.email}
                                onDataChange={loadData}
                            />
                        )}

                        {currentView === 'leads' && (
                            <LeadManager
                                leads={leads}
                                phases={ACTIVE_LEAD_PHASES}
                                vehicles={vehicles}
                                onUpdateLead={updateLead}
                                onAddLead={addLead}
                                onDeleteLead={deleteLead}
                                focusedLeadId={focusedLeadId}
                                onClearFocus={() => setFocusedLeadId(null)}
                                userEmail={profile?.email}
                                onDataChange={loadData}
                            />
                        )}

                        {currentView === 'sales-closed' && (
                            <LeadManager
                                leads={leads}
                                phases={SALES_CLOSED_PHASES}
                                type="sales"
                                vehicles={vehicles}
                                onUpdateLead={updateLead}
                                onAddLead={addLead}
                                onDeleteLead={deleteLead}
                                userEmail={profile?.email}
                                onDataChange={loadData}
                            />
                        )}

                        {currentView === 'plans' && (
                            <UserArea
                                profile={profile}
                                onUpgrade={(plan: Plan) => {
                                    const paymentLink = plan.stripe_url || 'https://buy.stripe.com/dRm9AT0wEe5s93G0DY4ZG00';
                                    const url = profile?.email
                                        ? `${paymentLink}${paymentLink.includes('?') ? '&' : '?'}prefilled_email=${encodeURIComponent(profile.email)}`
                                        : paymentLink;
                                    window.open(url, '_blank');
                                }}
                                onProfileUpdate={loadData}
                            />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default UserApp;
