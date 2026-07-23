import { describe, it, expect, vi, beforeEach } from 'vitest';
import { vehicleService } from '../vehicleService';
import { supabase } from '../../lib/supabaseClient';

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

describe('vehicleService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('queries vehicles table and maps rows correctly', async () => {
      const mockVehicleRow = {
        id: 'veh-1',
        brand: 'Toyota',
        model: 'Corolla',
        version: 'XEi 2.0',
        year: 2022,
        model_year: 2023,
        price: 120000,
        cost_price: 100000,
        mileage: 35000,
        color: 'Preto',
        fuel_type: 'Flex',
        transmission: 'Automático',
        status: 'Disponível',
        created_at: '2026-07-23T10:00:00Z',
      };

      const selectMock = vi.fn().mockReturnThis();
      const orderMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockResolvedValue({ data: [mockVehicleRow], error: null });

      (supabase.from as any).mockReturnValue({
        select: selectMock,
        order: orderMock,
        eq: eqMock,
      });

      const vehicles = await vehicleService.getAll();

      expect(supabase.from).toHaveBeenCalledWith('vehicles');
      expect(vehicles).toHaveLength(1);
      expect(vehicles[0].id).toBe('veh-1');
      expect(vehicles[0].brand).toBe('Toyota');
      expect(vehicles[0].model).toBe('Corolla');
      expect(vehicles[0].price).toBe(120000);
    });
  });
});
