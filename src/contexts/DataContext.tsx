import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { profileService } from '../services/profileService';
import { leadService } from '../services/leadService';
import { vehicleService } from '../services/vehicleService';
import { motorcycleService } from '../services/motorcycleService';
import { Profile, Lead, Vehicle, Motorcycle, SaleDetails } from '../types';
import { useToast } from './ToastContext';
import { validateLeadInput } from '../schemas/leadSchema';
import { validateVehicleInput } from '../schemas/vehicleSchema';

const EMPRESA_ROLES = ['empresa', 'super_admin', 'admin'] as const;
const isEmpresaRole = (role?: string): boolean => EMPRESA_ROLES.includes(role as any);

const getAdminContext = (p: Profile | null) => {
    const isEmpresa = isEmpresaRole(p?.role);
    const adminId: string | undefined = isEmpresa ? p?.id : p?.parent_id ?? undefined;
    return { isEmpresa, adminId };
};

interface DataContextType {
    session: Session | null;
    profile: Profile | null;
    leads: Lead[];
    vehicles: Vehicle[];
    motorcycles: Motorcycle[];
    teamMembers: Profile[];
    isEmpresa: boolean;
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
    const profileRef = useRef<Profile | null>(null);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [motorcycles, setMotorcycles] = useState<Motorcycle[]>([]);
    const [teamMembers, setTeamMembers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingLeads, setLoadingLeads] = useState(false);
    const [hasMoreLeads, setHasMoreLeads] = useState(true);
    const [page, setPage] = useState(0);
    const PAGE_SIZE = 5000;

    const { showToast } = useToast();

    const impersonatedUserId = useMemo(() => {
        // impersonatedUserId via prop vem do AdminApp — já protegido por verificação de role admin.
        if (propImpersonatedUserId) return propImpersonatedUserId;
        // Query param só é aceito se o perfil atual for admin/super_admin — lido da ref para evitar
        // dependência circular com o estado de profile ainda não carregado.
        const urlParams = new URLSearchParams(window.location.search);
        const paramId = urlParams.get('impersonate');
        if (!paramId) return undefined;
        const currentRole = profileRef.current?.role;
        if (currentRole === 'admin' || currentRole === 'super_admin') return paramId;
        return undefined;
    }, [propImpersonatedUserId]);

    const refreshProfile = useCallback(async (): Promise<Profile | null> => {
        try {
            const data = await profileService.getProfile(impersonatedUserId);
            setProfile(data);
            profileRef.current = data;
            return data;
        } catch (err) {
            console.error('Error refreshing profile:', err);
            return null;
        }
    }, [impersonatedUserId]);

    const fetchLeads = useCallback(async (pageNum: number, append: boolean = false) => {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!currentSession) return;

        setLoadingLeads(true);
        try {
            const p = profileRef.current;
            const { isEmpresa, adminId } = getAdminContext(p);
            let data = isEmpresa
                ? await leadService.list(undefined, adminId, true, PAGE_SIZE, pageNum * PAGE_SIZE)
                : await leadService.list(p?.id || impersonatedUserId, undefined, false, PAGE_SIZE, pageNum * PAGE_SIZE);

            // Evitar telas brancas garantindo arrays mínimos em preferences
            data = data.map(lead => ({
                ...lead,
                preferences: {
                    marcas: [],
                    modelos: [],
                    tipos_veiculo: [],
                    carro_transmissao: [],
                    carro_motorizacao: [],
                    transmissao: [],
                    motorizacao: [],
                    marcas_moto: [],
                    modelos_moto: [],
                    tipos_moto: [],
                    moto_transmissao: [],
                    moto_motorizacao: [],
                    ...(lead.preferences || {})
                }
            }));

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
            const { adminId } = getAdminContext(profileRef.current);
            const data = await vehicleService.getAll(undefined, adminId);
            setVehicles(data);
        } catch (err) {
            console.error('Error loading vehicles:', err);
        }
    }, []);

    const refreshMotorcycles = useCallback(async () => {
        try {
            const { adminId } = getAdminContext(profileRef.current);
            const data = await motorcycleService.getAll(undefined, adminId);
            setMotorcycles(data);
        } catch (err) {
            console.error('Error loading motorcycles:', err);
        }
    }, []);

    const refreshTeamMembers = useCallback(async () => {
        const p = profileRef.current;
        if (!p || !isEmpresaRole(p.role)) return;
        try {
            const members = await profileService.getTeamMembers(p.id);
            setTeamMembers(members);
        } catch (err) {
            console.error('Error loading team members:', err);
        }
    }, []);

    const loadData = useCallback(async (showLoader = true) => {
        if (showLoader) setLoading(true);

        // Uma tentativa completa de carregamento, com timeout de 15s.
        const attemptLoad = () => Promise.race([
            (async () => {
                await refreshProfile();
                setPage(0);
                await Promise.allSettled([
                    fetchLeads(0, false),
                    refreshVehicles(),
                    refreshMotorcycles(),
                    refreshTeamMembers(),
                ]);
            })(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Carregamento expirou. Verifique sua conexão e credenciais Supabase.')), 15000)
            ),
        ]);

        try {
            try {
                await attemptLoad();
            } catch (firstErr) {
                // Retry único após breve espera — resiliência a falhas transitórias de rede.
                console.warn('loadData: 1ª tentativa falhou, tentando novamente...', firstErr);
                await new Promise(r => setTimeout(r, 1500));
                await attemptLoad();
            }
        } catch (err) {
            console.error('loadData error:', err);
            showToast('error', (err as Error).message || 'Erro ao carregar dados. Verifique sua conexão e credenciais Supabase em .env.local');
        } finally {
            if (showLoader) setLoading(false);
        }
    }, [refreshProfile, fetchLeads, refreshVehicles, refreshMotorcycles, refreshTeamMembers, showToast]);

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

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setSession(session);
            if (!session) {
                setProfile(null);
                profileRef.current = null;
                setLeads([]);
                setVehicles([]);
                setMotorcycles([]);
                setTeamMembers([]);
                setLoading(false);
            } else {
                const shouldShowLoader = !profileRef.current && event === 'SIGNED_IN';
                loadData(shouldShowLoader);
            }
        });

        return () => subscription.unsubscribe();
    }, [loadData]);

    const isEmpresa = isEmpresaRole(profile?.role);

    // Actions
    const addLead = useCallback(async (leadData: Lead) => {
        const p = profileRef.current;
        const isFreePlan = !p?.plan || p.plan === 'free' || p.plan === 'trial';
        if (isFreePlan && leads.length >= 50) {
            showToast('error', 'Limite do plano Free atingido (máximo 50 leads). Faça upgrade para Pro!');
            throw new Error('PLAN_LIMIT_REACHED');
        }
        const validationError = validateLeadInput(leadData);
        if (validationError) {
            showToast('error', validationError);
            throw new Error('VALIDATION_ERROR');
        }
        try {
            const { adminId } = getAdminContext(p);
            const enriched = {
                ...leadData,
                user_id: leadData.user_id || p?.id,
                admin_id: leadData.admin_id || adminId || null,
            };
            let newLead = await leadService.create(enriched);
            
            // Garantir os defaults antes de ir pro state
            newLead = {
                ...newLead,
                preferences: {
                    marcas: [], modelos: [], tipos_veiculo: [], carro_transmissao: [], carro_motorizacao: [],
                    transmissao: [], motorizacao: [], marcas_moto: [], modelos_moto: [], tipos_moto: [],
                    moto_transmissao: [], moto_motorizacao: [], ...(newLead.preferences || {})
                }
            };
            
            setLeads((prev: Lead[]) => [newLead, ...prev]);
            showToast('success', 'Lead cadastrado com sucesso!');
            return newLead;
        } catch (err) {
            console.error('Error adding lead:', err);
            showToast('error', 'Erro ao cadastrar lead. Verifique os dados e tente novamente.');
            throw err;
        }
    }, [showToast, leads]);

    const updateLead = useCallback(async (leadData: Lead) => {
        try {
            let updated = await leadService.update(leadData);
            
            updated = {
                ...updated,
                preferences: {
                    marcas: [], modelos: [], tipos_veiculo: [], carro_transmissao: [], carro_motorizacao: [],
                    transmissao: [], motorizacao: [], marcas_moto: [], modelos_moto: [], tipos_moto: [],
                    moto_transmissao: [], moto_motorizacao: [], ...(updated.preferences || {})
                }
            };
            
            setLeads((prev: Lead[]) => prev.map((l: Lead) => l.id === updated.id ? updated : l));
            showToast('success', 'Lead atualizado com sucesso!');
            return updated;
        } catch (err) {
            console.error('Error updating lead:', err);
            showToast('error', 'Erro ao atualizar lead.');
            throw err;
        }
    }, [showToast]);

    const deleteLead = useCallback(async (id: string) => {
        try {
            await leadService.delete(id);
            setLeads((prev: Lead[]) => prev.filter((l: Lead) => l.id !== id));
        } catch (err) {
            console.error('Error deleting lead:', err);
            showToast('error', 'Erro ao excluir lead.');
            throw err;
        }
    }, [showToast]);

    const addVehicle = useCallback(async (vehicleData: Omit<Vehicle, 'id'>) => {
        const p = profileRef.current;
        const isFreePlan = !p?.plan || p.plan === 'free' || p.plan === 'trial';
        if (isFreePlan && (vehicles.length + motorcycles.length) >= 10) {
            showToast('error', 'Limite do plano Free atingido (máximo 10 veículos). Faça upgrade para Pro!');
            throw new Error('PLAN_LIMIT_REACHED');
        }
        const vehicleValidationError = validateVehicleInput(vehicleData);
        if (vehicleValidationError) {
            showToast('error', vehicleValidationError);
            throw new Error('VALIDATION_ERROR');
        }
        try {
            const { adminId } = getAdminContext(p);
            const res = await vehicleService.create(vehicleData, p?.id || impersonatedUserId, adminId);
            setVehicles((prev: Vehicle[]) => [res, ...prev]);
            return res;
        } catch (err) {
            console.error('Error adding vehicle:', err);
            showToast('error', 'Erro ao cadastrar veículo.');
            throw err;
        }
    }, [impersonatedUserId, vehicles, motorcycles, showToast]);

    const updateVehicle = useCallback(async (vehicleData: Vehicle) => {
        try {
            const res = await vehicleService.update(vehicleData);
            setVehicles((prev: Vehicle[]) => prev.map((v: Vehicle) => v.id === res.id ? res : v));
            return res;
        } catch (err) {
            console.error('Error updating vehicle:', err);
            showToast('error', 'Erro ao atualizar veículo.');
            throw err;
        }
    }, [showToast]);

    const deleteVehicle = useCallback(async (id: string) => {
        try {
            await vehicleService.delete(id);
            setVehicles((prev: Vehicle[]) => prev.filter((v: Vehicle) => v.id !== id));
        } catch (err) {
            console.error('Error deleting vehicle:', err);
            showToast('error', 'Erro ao excluir veículo.');
            throw err;
        }
    }, [showToast]);

    const handleSellVehicle = useCallback(async (id: string, details: SaleDetails) => {
        try {
            await vehicleService.sell(id, details);
            await refreshVehicles();
        } catch (err) {
            console.error('Error selling vehicle:', err);
            showToast('error', 'Erro ao registrar a venda.');
            throw err;
        }
    }, [refreshVehicles, showToast]);

    const addMotorcycle = useCallback(async (motoData: Omit<Motorcycle, 'id'>) => {
        const p = profileRef.current;
        const isFreePlan = !p?.plan || p.plan === 'free' || p.plan === 'trial';
        if (isFreePlan && (vehicles.length + motorcycles.length) >= 10) {
            showToast('error', 'Limite do plano Free atingido (máximo 10 veículos). Faça upgrade para Pro!');
            throw new Error('PLAN_LIMIT_REACHED');
        }
        const motoValidationError = validateVehicleInput(motoData);
        if (motoValidationError) {
            showToast('error', motoValidationError);
            throw new Error('VALIDATION_ERROR');
        }
        try {
            const { adminId } = getAdminContext(p);
            const res = await motorcycleService.create(motoData, p?.id || impersonatedUserId, adminId);
            setMotorcycles((prev: Motorcycle[]) => [res, ...prev]);
            return res;
        } catch (err) {
            console.error('Error adding motorcycle:', err);
            showToast('error', 'Erro ao cadastrar moto.');
            throw err;
        }
    }, [impersonatedUserId, vehicles, motorcycles, showToast]);

    const updateMotorcycle = useCallback(async (motoData: Motorcycle) => {
        try {
            const res = await motorcycleService.update(motoData);
            setMotorcycles((prev: Motorcycle[]) => prev.map((m: Motorcycle) => m.id === res.id ? res : m));
            return res;
        } catch (err) {
            console.error('Error updating motorcycle:', err);
            showToast('error', 'Erro ao atualizar moto.');
            throw err;
        }
    }, [showToast]);

    const deleteMotorcycle = useCallback(async (id: string) => {
        try {
            await motorcycleService.delete(id);
            setMotorcycles((prev: Motorcycle[]) => prev.filter((m: Motorcycle) => m.id !== id));
        } catch (err) {
            console.error('Error deleting motorcycle:', err);
            showToast('error', 'Erro ao excluir moto.');
            throw err;
        }
    }, [showToast]);

    const value = useMemo(() => ({
        session,
        profile,
        leads,
        vehicles,
        motorcycles,
        teamMembers,
        isEmpresa,
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
        session, profile, leads, vehicles, motorcycles, teamMembers, isEmpresa,
        loading, loadingLeads, hasMoreLeads, impersonatedUserId,
        loadData, refreshLeads, loadMoreLeads, refreshProfile, refreshVehicles, refreshMotorcycles
    ]);

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};
