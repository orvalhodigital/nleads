import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { profileService } from '../services/profileService';
import { Profile } from '../types';

const EMPRESA_ROLES = ['empresa', 'super_admin', 'admin'] as const;
const isEmpresaRole = (role?: string): boolean => EMPRESA_ROLES.includes(role as any);

export interface AuthContextType {
  session: Session | null;
  profile: Profile | null;
  teamMembers: Profile[];
  isEmpresa: boolean;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  impersonatedUserId: string | undefined;
  refreshProfile: () => Promise<Profile | null>;
  refreshTeamMembers: () => Promise<void>;
  profileRef: React.RefObject<Profile | null>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuthContext must be used within an AuthContextProvider');
  return context;
};

// Legacy compatibility export
export const useAuth = () => {
  const { session, profile, loading, impersonatedUserId, refreshProfile } = useAuthContext();
  return { session, profile, loading, impersonatedUserId, refreshProfile, error: null };
};

export const AuthContextProvider: React.FC<{
  children: React.ReactNode;
  impersonatedUserId?: string;
}> = ({ children, impersonatedUserId: propImpersonatedUserId }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const profileRef = useRef<Profile | null>(null);
  const [teamMembers, setTeamMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const impersonatedUserId = useMemo(() => {
    if (propImpersonatedUserId) return propImpersonatedUserId;
    const urlParams = new URLSearchParams(window.location.search);
    const paramId = urlParams.get('impersonate');
    if (!paramId) return undefined;
    const currentRole = profileRef.current?.role;
    if (currentRole === 'admin' || currentRole === 'super_admin') return paramId;
    return undefined;
  }, [propImpersonatedUserId, profile]);

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

  const isEmpresa = useMemo(() => isEmpresaRole(profile?.role), [profile?.role]);

  // Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (!session) {
        setProfile(null);
        profileRef.current = null;
        setTeamMembers([]);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      session,
      profile,
      teamMembers,
      isEmpresa,
      loading,
      setLoading,
      impersonatedUserId,
      refreshProfile,
      refreshTeamMembers,
      profileRef,
    }),
    [session, profile, teamMembers, isEmpresa, loading, impersonatedUserId, refreshProfile, refreshTeamMembers]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
