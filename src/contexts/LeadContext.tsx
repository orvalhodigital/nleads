import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { leadService } from '../services/leadService';
import { Lead } from '../types';
import { withPreferenceDefaults } from '../lib/leadPreferenceDefaults';
import { validateLeadInput } from '../schemas/leadSchema';
import { isLimitedPlan } from '../lib/planAccess';
import { useAuthContext } from './AuthContext';
import { useToast } from './ToastContext';

const EMPRESA_ROLES = ['empresa', 'super_admin', 'admin'] as const;
const isEmpresaRole = (role?: string): boolean => EMPRESA_ROLES.includes(role as any);

const getAdminContext = (p: any | null) => {
  const isEmpresa = isEmpresaRole(p?.role);
  const adminId: string | undefined = isEmpresa ? p?.id : p?.parent_id ?? undefined;
  return { isEmpresa, adminId };
};

const PAGE_SIZE = 5000;

export interface LeadContextType {
  leads: Lead[];
  loadingLeads: boolean;
  hasMoreLeads: boolean;
  refreshLeads: () => Promise<void>;
  loadMoreLeads: () => Promise<void>;
  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'lastUpdate'>) => Promise<Lead>;
  updateLead: (lead: Lead) => Promise<Lead>;
  deleteLead: (id: string) => Promise<void>;
}

const LeadContext = createContext<LeadContextType>({} as LeadContextType);

export const useLeadContext = () => {
  const context = useContext(LeadContext);
  if (!context) throw new Error('useLeadContext must be used within a LeadContextProvider');
  return context;
};

export const LeadContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [hasMoreLeads, setHasMoreLeads] = useState(true);
  const [page, setPage] = useState(0);

  const { profileRef, impersonatedUserId } = useAuthContext();
  const { showToast } = useToast();

  const fetchLeads = useCallback(
    async (pageNum: number, append: boolean = false) => {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();
      if (!currentSession) return;

      setLoadingLeads(true);
      try {
        const p = profileRef.current;
        const { isEmpresa, adminId } = getAdminContext(p);
        let data = isEmpresa
          ? await leadService.list(undefined, adminId, true, PAGE_SIZE, pageNum * PAGE_SIZE)
          : await leadService.list(
              p?.id || impersonatedUserId,
              undefined,
              false,
              PAGE_SIZE,
              pageNum * PAGE_SIZE
            );

        data = data.map((lead) => ({
          ...lead,
          preferences: withPreferenceDefaults(lead.preferences),
        }));

        if (append) {
          setLeads((prev) => [...prev, ...data]);
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
    },
    [impersonatedUserId, profileRef, showToast]
  );

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

  const addLead = useCallback(
    async (leadData: Omit<Lead, 'id' | 'createdAt' | 'lastUpdate'>): Promise<Lead> => {
      const isFreePlan = isLimitedPlan(profileRef.current?.plan);
      if (isFreePlan && leads.length >= 10) {
        showToast('error', 'Limite do plano gratuito atingido (máximo 10 leads). Faça o upgrade para cadastrar mais.');
        throw new Error('Limite do plano atingido');
      }

      const errors = validateLeadInput(leadData);
      if (errors && errors.length > 0) {
        showToast('error', errors[0]);
        throw new Error(errors[0]);
      }

      try {
        const newLead = await leadService.create(leadData);
        setLeads((prev) => [newLead, ...prev]);
        showToast('success', 'Lead adicionado com sucesso!');
        return newLead;
      } catch (err) {
        showToast('error', 'Erro ao adicionar lead.');
        throw err;
      }
    },
    [leads.length, profileRef, showToast]
  );

  const updateLead = useCallback(
    async (leadData: Lead): Promise<Lead> => {
      const errors = validateLeadInput(leadData);
      if (errors && errors.length > 0) {
        showToast('error', errors[0]);
        throw new Error(errors[0]);
      }

      try {
        const updated = await leadService.update(leadData);
        setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
        showToast('success', 'Lead atualizado com sucesso!');
        return updated;
      } catch (err) {
        showToast('error', 'Erro ao atualizar lead.');
        throw err;
      }
    },
    [showToast]
  );

  const deleteLead = useCallback(
    async (id: string) => {
      try {
        await leadService.delete(id);
        setLeads((prev) => prev.filter((l) => l.id !== id));
        showToast('success', 'Lead excluído com sucesso!');
      } catch (err) {
        showToast('error', 'Erro ao excluir lead.');
      }
    },
    [showToast]
  );

  const value = useMemo(
    () => ({
      leads,
      loadingLeads,
      hasMoreLeads,
      refreshLeads,
      loadMoreLeads,
      addLead,
      updateLead,
      deleteLead,
    }),
    [leads, loadingLeads, hasMoreLeads, refreshLeads, loadMoreLeads, addLead, updateLead, deleteLead]
  );

  return <LeadContext.Provider value={value}>{children}</LeadContext.Provider>;
};
