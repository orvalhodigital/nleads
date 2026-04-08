import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { leadService } from '../services/leadService';
import { vehicleService } from '../services/vehicleService';
import { profileService } from '../services/profileService';
import { motorcycleService } from '../services/motorcycleService';
import { useToast } from './ToastContext';
import { ToastType } from '../components/ui/Toast';
import { Lead, Vehicle, Profile, LeadPhase, SaleDetails, Motorcycle } from '../types';

interface DataContextType {
    session: any;
    profile: Profile | null;
    leads: Lead[];
    vehicles: Vehicle[];
    loading: boolean;
    loadData: () => Promise<void>;
    showToast: (type: ToastType, message: string) => void;
    addVehicle: (v: Omit<Vehicle, 'id'>) => Promise<void>;
    updateVehicle: (v: Vehicle) => Promise<void>;
    deleteVehicle: (id: string) => Promise<void>;
    handleSellVehicle: (id: string, details: SaleDetails) => Promise<void>;
    addLead: (l: Omit<Lead, 'id' | 'createdAt' | 'lastUpdate' | 'funnelHistory'>) => Promise<Lead | null>;
    updateLead: (l: Lead) => Promise<void>;
    deleteLead: (id: string) => Promise<void>;
    motorcycles: Motorcycle[];
    refreshProfile: () => Promise<void>;
    impersonatedUserId?: string;
}

const DataContext = createContext<DataContextType>({} as DataContextType);

export const useData = () => useContext(DataContext);

export const DataProvider: React.FC<{ children: React.ReactNode; impersonatedUserId?: string }> = ({ children, impersonatedUserId }) => {
    const { showToast } = useToast();
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [motorcycles, setMotorcycles] = useState<Motorcycle[]>([]);
    const [profile, setProfile] = useState<Profile | null>(null);

    const loadData = async () => {
        // Using allSettled so a failure in one service (e.g. RLS error on vehicles)
        // never prevents the profile or other data from loading.
        const [vehiclesResult, leadsResult, profileResult, motorcyclesResult] = await Promise.allSettled([
            vehicleService.getAll(impersonatedUserId),
            leadService.getAll(impersonatedUserId),
            profileService.getProfile(impersonatedUserId),
            motorcycleService.getAll(impersonatedUserId),
        ]);

        if (vehiclesResult.status === 'fulfilled') setVehicles(vehiclesResult.value);
        else console.error('Erro ao carregar veículos:', vehiclesResult.reason);

        if (leadsResult.status === 'fulfilled') setLeads(leadsResult.value);
        else console.error('Erro ao carregar leads:', leadsResult.reason);

        if (profileResult.status === 'fulfilled') setProfile(profileResult.value);
        else console.error('Erro ao carregar perfil:', profileResult.reason);

        if (motorcyclesResult.status === 'fulfilled') setMotorcycles(motorcyclesResult.value);
        else console.error('Erro ao carregar motos:', motorcyclesResult.reason);
    };

    useEffect(() => {
        if (session) {
            loadData();
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


    // Actions
    const addVehicle = async (v: Omit<Vehicle, 'id'>) => {
        try {
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
        // Optimistic Update
        setLeads(prev => prev.map(l => l.id === updated.id ? leadToSave : l));

        try {
            const savedLead = await leadService.update(leadToSave);
            setLeads(prev => prev.map(l => l.id === updated.id ? savedLead : l));
        } catch (error: any) {
            console.error('Update lead failed:', error);
            alert(`Erro ao atualizar lead: ${error.message || 'Erro desconhecido'}. Recarregue a página.`);
            if (oldLead) {
                setLeads(prev => prev.map(l => l.id === updated.id ? oldLead : l));
            }
        }
    };

    const addLead = async (l: Omit<Lead, 'id' | 'createdAt' | 'lastUpdate' | 'funnelHistory'>) => {
        try {
            const leadWithHistory = {
                ...l,
                funnelHistory: {
                    [LeadPhase.NEW]: new Date().toISOString()
                }
            };
            const newLead = await leadService.create(leadWithHistory as any);
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

    const refreshProfile = async () => {
        try {
            const profileData = await profileService.getProfile(impersonatedUserId);
            setProfile(profileData);
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
        }
    };

    return (
        <DataContext.Provider value={{
            session,
            profile,
            leads,
            vehicles,
            motorcycles,
            loading,
            loadData,
            showToast,
            addVehicle,
            updateVehicle,
            deleteVehicle,
            handleSellVehicle,
            addLead,
            updateLead,
            deleteLead,
            refreshProfile,
            impersonatedUserId
        }}>
            {children}
        </DataContext.Provider>
    );
};
