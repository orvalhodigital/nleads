import { describe, it, expect, vi, beforeEach } from 'vitest';
import { leadService } from '../leadService';
import { supabase } from '../../lib/supabaseClient';
import { LeadPhase, LeadTemperature } from '../../types';

vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
    },
  },
  handleSupabaseResponse: vi.fn((result) => {
    if (result.error) throw result.error;
    return result.data;
  }),
}));

describe('leadService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('queries leads table and maps rows correctly', async () => {
      const mockLeadRow = {
        id: 'lead-1',
        name: 'Maria Silva',
        phone: '11999998888',
        email: 'maria@test.com',
        phase: 'Novo Lead',
        temperature: 'Quente',
        created_at: '2026-07-23T10:00:00Z',
        last_update: '2026-07-23T10:00:00Z',
        interesse_carro: true,
      };

      const selectMock = vi.fn().mockReturnThis();
      const orderMock = vi.fn().mockReturnThis();
      const rangeMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockResolvedValue({ data: [mockLeadRow], error: null });

      (supabase.from as any).mockReturnValue({
        select: selectMock,
        order: orderMock,
        range: rangeMock,
        eq: eqMock,
      });

      const leads = await leadService.list();

      expect(supabase.from).toHaveBeenCalledWith('leads');
      expect(leads).toHaveLength(1);
      expect(leads[0].id).toBe('lead-1');
      expect(leads[0].name).toBe('Maria Silva');
      expect(leads[0].phase).toBe(LeadPhase.NEW);
      expect(leads[0].temperature).toBe(LeadTemperature.HOT);
    });
  });

  describe('findDuplicateByPhone', () => {
    it('returns null if no phone is provided', async () => {
      const result = await leadService.findDuplicateByPhone('admin-1', '');
      expect(result).toBeNull();
    });
  });
});
