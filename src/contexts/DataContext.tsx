import React, { createContext, useContext, useEffect, useCallback, useMemo, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { Profile, Lead, Vehicle, Motorcycle, SaleDetails } from '../types';
import { AuthContextProvider, useAuthContext, useAuth } from './AuthContext';
import { InventoryContextProvider, useInventoryContext } from './InventoryContext';
import { LeadContextProvider, useLeadContext } from './LeadContext';
import { useToast } from './ToastContext';

export { useAuth };

export interface DataContextType {
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
  refreshProfile: () => Promise<Profile | null>;
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

const DataContextAggregator: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuthContext();
  const inventory = useInventoryContext();
  const lead = useLeadContext();
  const { showToast } = useToast();
  const loadedSessionUserRef = useRef<string | null>(null);

  const loadData = useCallback(
    async (showLoader = true) => {
      if (showLoader) auth.setLoading(true);

      const attemptLoad = () =>
        Promise.race([
          (async () => {
            await auth.refreshProfile();
            await Promise.allSettled([
              lead.refreshLeads(),
              inventory.refreshVehicles(),
              inventory.refreshMotorcycles(),
              auth.refreshTeamMembers(),
            ]);
          })(),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error('Carregamento expirou. Verifique sua conexão e credenciais.')),
              15000
            )
          ),
        ]);

      try {
        try {
          await attemptLoad();
        } catch (firstErr) {
          console.warn('loadData: 1ª tentativa falhou, tentando novamente...', firstErr);
          await new Promise((r) => setTimeout(r, 1500));
          await attemptLoad();
        }
      } catch (err) {
        console.error('loadData error:', err);
        showToast(
          'error',
          (err as Error).message || 'Erro ao carregar dados. Verifique sua conexão.'
        );
      } finally {
        if (showLoader) auth.setLoading(false);
      }
    },
    [auth, inventory, lead, showToast]
  );

  // Initial data fetch when session becomes active
  useEffect(() => {
    const currentUserId = auth.session?.user?.id || null;
    if (!auth.session) {
      loadedSessionUserRef.current = null;
      auth.setLoading(false);
      return;
    }

    if (loadedSessionUserRef.current !== currentUserId) {
      loadedSessionUserRef.current = currentUserId;
      loadData(true);
    }
  }, [auth.session, loadData]);

  const value: DataContextType = useMemo(
    () => ({
      session: auth.session,
      profile: auth.profile,
      teamMembers: auth.teamMembers,
      isEmpresa: auth.isEmpresa,
      loading: auth.loading,
      impersonatedUserId: auth.impersonatedUserId,
      refreshProfile: auth.refreshProfile,
      vehicles: inventory.vehicles,
      motorcycles: inventory.motorcycles,
      refreshVehicles: inventory.refreshVehicles,
      refreshMotorcycles: inventory.refreshMotorcycles,
      addVehicle: inventory.addVehicle,
      updateVehicle: inventory.updateVehicle,
      deleteVehicle: inventory.deleteVehicle,
      handleSellVehicle: inventory.handleSellVehicle,
      addMotorcycle: inventory.addMotorcycle,
      updateMotorcycle: inventory.updateMotorcycle,
      deleteMotorcycle: inventory.deleteMotorcycle,
      leads: lead.leads,
      loadingLeads: lead.loadingLeads,
      hasMoreLeads: lead.hasMoreLeads,
      refreshLeads: lead.refreshLeads,
      loadMoreLeads: lead.loadMoreLeads,
      addLead: lead.addLead,
      updateLead: lead.updateLead,
      deleteLead: lead.deleteLead,
      loadData,
    }),
    [auth, inventory, lead, loadData]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const DataProvider: React.FC<{
  children: React.ReactNode;
  impersonatedUserId?: string;
}> = ({ children, impersonatedUserId }) => {
  return (
    <AuthContextProvider impersonatedUserId={impersonatedUserId}>
      <InventoryContextProvider>
        <LeadContextProvider>
          <DataContextAggregator>{children}</DataContextAggregator>
        </LeadContextProvider>
      </InventoryContextProvider>
    </AuthContextProvider>
  );
};
