import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { profileService } from '../services/profileService';
import { leadService } from '../services/leadService';
import { vehicleService } from '../services/vehicleService';
import { motorcycleService } from '../services/motorcycleService';
import { Profile, Lead, Vehicle, Motorcycle, SaleDetails } from '../types';
import { useToast } from './ToastContext';

interface DataContextType {
    session: Session | null;
    profile: Profile | null;
    leads: Lead[];
    vehicles: Vehicle[];
    motorcycles: Motorcycle[];
    loading: boolean;
    loadingLeads: boolean;
    hasMoreLeads: boolean;
    impersonatedUserId: string | undefined;
    loadData: () => Promise<void>;
    refreshLeads: () => Promise<void>;
    loadMoreLeads: () => Promise<void>;
    refreshProfile: () => Promise<void>;
    refreshVehicles: () => Promise<void>;
    refreshMotorcycles: () => Promise<void>;
    addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'lastUpdate'>) => Promise<Lead>;
    updateLead: (lead: Lead) => Promise<Lead>;
    deleteLead: (id: string) => Promise<void>;
    addVehicle: (vehicle: Omit<Vehicle, 'id'>) => Promise<Vehicle>;
    updateVehicle: (vehicle: Vehicle) => Promise<Vehicle>;
    deleteVehicle: (id: string) => Promise<void>;
    handleSellVehicle: (id: string, details: SaleDetails) => Promise<void>;
    addMotorcycle: (moto: Omit<Motorcycle, 'id'>) => Promise<Motorcycle>;
    updateMotorcycle: (moto: Motorcycle) => Promise<Motorcycle>;
    deleteMotorcycle: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType>({} as DataContextType);

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) throw new Error('useData must be used within a DataProvider');
    return context;
};

// Compatibility Hooks
export const useAuth = () => {
    const { session, profile, loading, impersonatedUserId, refreshProfile } = useData();
    return { session, profile, loading, impersonatedUserId, refreshProfile, error: null };
};

export const useLeads = () => {
    const { leads, loadingLeads, hasMoreLeads, refreshLeads, loadMoreLeads, addLead, updateLead, deleteLead } = useData();
    return { leads, loadingLeads, hasMoreLeads, refreshLeads, loadMoreLeads, addLead, updateLead, deleteLead };
};

export const useInventory = () => {
    const { 
        vehicles, motorcycles, loading, refreshVehicles, refreshMotorcycles,
        addVehicle, updateVehicle, deleteVehicle, handleSellVehicle,
        addMotorcycle, updateMotorcycle, deleteMotorcycle 
    } = useData();
    return { 
        vehicles, motorcycles, loadingInventory: loading, refreshVehicles, refreshMotorcycles,
        addVehicle, updateVehicle, deleteVehicle, handleSellVehicle,
        addMotorcycle, updateMotorcycle, deleteMotorcycle 
    };
};

export const DataProvider: React.FC<{ children: React.ReactNode; impersonatedUserId?: string }> = ({ 
    children, 
    impersonatedUserId: propImpersonatedUserId 
}) => {
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [motorcycles, setMotorcycles] = useState<Motorcycle[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingLeads, setLoadingLeads] = useState(false);
    const [hasMoreLeads, setHasMoreLeads] = useState(true);
    const [page, setPage] = useState(0);
    const PAGE_SIZE = 50;

    const { showToast } = useToast();

    // Determine impersonated ID (prop or URL)
    const impersonatedUserId = useMemo(() => {
        if (propImpersonatedUserId) return propImpersonatedUserId;
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('impersonate') || undefined;
    }, [propImpersonatedUserId]);

    const refreshProfile = useCallback(async () => {
        try {
            const data = await profileService.getProfile(impersonatedUserId);
            setProfile(data);
        } catch (err) {
            console.error('Error refreshing profile:', err);
        }
    }, [impersonatedUserId]);

    const fetchLeads = useCallback(async (pageNum: number, append: boolean = false) => {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!currentSession) return;

        setLoadingLeads(true);
        try {
            const data = await leadService.list(impersonatedUserId, PAGE_SIZE, pageNum * PAGE_SIZE);
            if (append) {
                setLeads(prev => [...prev, ...data]);
            } else {
                setLeads(data);
            }
            setHasMoreLeads(data.length === PAGE_SIZE);
        } catch (err) {
            console.error('Error loading leads:', err);
            showToast('error', 'Erro ao carregar leads.');
        } finally {
            setLoadingLeads(false);
        }
    }, [impersonatedUserId, showToast]);

    const refreshLeads = useCallback(async () => {
        setPage(0);
        await fetchLeads(0, false);
    }, [fetchLeads]);

    const loadMoreLeads = useCallback(async () => {
        if (loadingLeads || !hasMoreLeads) return;
        const nextPage = page + 1;
        setPage(nextPage);
        await fetchLeads(nextPage, true);
    }, [page, loadingLeads, hasMoreLeads, fetchLeads]);

    const refreshVehicles = useCallback(async () => {
        try {
            const data = await vehicleService.getAll(impersonatedUserId);
            setVehicles(data);
        } catch (err) {
            console.error('Error loading vehicles:', err);
        }
    }, [impersonatedUserId]);

    const refreshMotorcycles = useCallback(async () => {
        try {
            const data = await motorcycleService.getAll(impersonatedUserId);
            setMotorcycles(data);
        } catch (err) {
            console.error('Error loading motorcycles:', err);
        }
    }, [impersonatedUserId]);

    const loadData = useCallback(async () => {
        setLoading(true);
        await Promise.allSettled([
            refreshProfile(),
            refreshLeads(),
            refreshVehicles(),
            refreshMotorcycles()
        ]);
        setLoading(false);
    }, [refreshProfile, refreshLeads, refreshVehicles, refreshMotorcycles]);

    // Auth Listeners
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) {
                loadData();
            } else {
                setLoading(false);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (!session) {
                setProfile(null);
                setLeads([]);
                setVehicles([]);
                setMotorcycles([]);
                setLoading(false);
            } else {
                loadData();
            }
        });

        return () => subscription.unsubscribe();
    }, [loadData]);

    // Actions
    const addLead = async (leadData: any) => {
        const newLead = await leadService.create(leadData);
        setLeads(prev => [newLead, ...prev]);
        return newLead;
    };

    const updateLead = async (leadData: Lead) => {
        const updated = await leadService.update(leadData);
        setLeads(prev => prev.map(l => l.id === updated.id ? updated : l));
        return updated;
    };

    const deleteLead = async (id: string) => {
        await leadService.delete(id);
        setLeads(prev => prev.filter(l => l.id !== id));
    };

    const addVehicle = async (vehicleData: any) => {
        const res = await vehicleService.create(vehicleData);
        setVehicles(prev => [res, ...prev]);
        return res;
    };

    const updateVehicle = async (vehicleData: Vehicle) => {
        const res = await vehicleService.update(vehicleData);
        setVehicles(prev => prev.map(v => v.id === res.id ? res : v));
        return res;
    };

    const deleteVehicle = async (id: string) => {
        await vehicleService.delete(id);
        setVehicles(prev => prev.filter(v => v.id !== id));
    };

    const handleSellVehicle = async (id: string, details: SaleDetails) => {
        await vehicleService.sell(id, details);
        await refreshVehicles();
    };

    const addMotorcycle = async (motoData: any) => {
        const res = await motorcycleService.create(motoData);
        setMotorcycles(prev => [res, ...prev]);
        return res;
    };

    const updateMotorcycle = async (motoData: Motorcycle) => {
        const res = await motorcycleService.update(motoData);
        setMotorcycles(prev => prev.map(m => m.id === res.id ? res : m));
        return res;
    };

    const deleteMotorcycle = async (id: string) => {
        await motorcycleService.delete(id);
        setMotorcycles(prev => prev.filter(m => m.id !== id));
    };

    const value = useMemo(() => ({
        session,
        profile,
        leads,
        vehicles,
        motorcycles,
        loading,
        loadingLeads,
        hasMoreLeads,
        impersonatedUserId,
        loadData,
        refreshLeads,
        loadMoreLeads,
        refreshProfile,
        refreshVehicles,
        refreshMotorcycles,
        addLead,
        updateLead,
        deleteLead,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        handleSellVehicle,
        addMotorcycle,
        updateMotorcycle,
        deleteMotorcycle
    }), [
        session, profile, leads, vehicles, motorcycles, loading, loadingLeads, hasMoreLeads, impersonatedUserId,
        loadData, refreshLeads, loadMoreLeads, refreshProfile, refreshVehicles, refreshMotorcycles
    ]);

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};
