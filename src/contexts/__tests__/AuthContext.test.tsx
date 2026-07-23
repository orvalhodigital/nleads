import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AuthContextProvider, useAuthContext } from '../AuthContext';

vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
}));

vi.mock('../../services/profileService', () => ({
  profileService: {
    getProfile: vi.fn().mockResolvedValue(null),
    getTeamMembers: vi.fn().mockResolvedValue([]),
  },
}));

describe('AuthContext', () => {
  it('provides auth context state within AuthContextProvider', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContextProvider>{children}</AuthContextProvider>
    );

    let hookResult: any;
    await act(async () => {
      const { result } = renderHook(() => useAuthContext(), { wrapper });
      hookResult = result;
    });

    expect(hookResult.current.profile).toBeNull();
    expect(hookResult.current.session).toBeNull();
  });
});
