import { guaranteeService } from '../guaranteeService';

describe('GuaranteeService', () => {
  describe('getPredefinedConfigs', () => {
    it('should return 4 predefined warranty options', () => {
      const configs = guaranteeService.getPredefinedConfigs();
      expect(configs).toHaveLength(4);
    });

    it('should have correct warranty types', () => {
      const configs = guaranteeService.getPredefinedConfigs();
      const types = configs.map(c => c.type);
      expect(types).toEqual(['7dias', '90dias', '180dias', '1ano']);
    });

    it('should have correct days_warranty values', () => {
      const configs = guaranteeService.getPredefinedConfigs();
      const byType = Object.fromEntries(configs.map(c => [c.type, c.days_warranty]));

      expect(byType['7dias']).toBe(7);
      expect(byType['90dias']).toBe(90);
      expect(byType['180dias']).toBe(180);
      expect(byType['1ano']).toBe(365);
    });

    it('should have refund and return policies', () => {
      const configs = guaranteeService.getPredefinedConfigs();

      configs.forEach(config => {
        expect(config.name).toBeDefined();
        expect(config.description).toBeDefined();
        if (config.conditions) {
          expect(config.conditions.refundPolicy).toBeDefined();
          expect(config.conditions.returnDays).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('Warranty types', () => {
    it('7-day warranty should be for right of withdrawal', () => {
      const configs = guaranteeService.getPredefinedConfigs();
      const sevenDay = configs.find(c => c.type === '7dias');

      expect(sevenDay?.name).toContain('Arrependimento');
      expect(sevenDay?.days_warranty).toBe(7);
    });

    it('90-day warranty should be legal warranty', () => {
      const configs = guaranteeService.getPredefinedConfigs();
      const ninetyDay = configs.find(c => c.type === '90dias');

      expect(ninetyDay?.name).toContain('Legal');
      expect(ninetyDay?.days_warranty).toBe(90);
    });

    it('should have increasing coverage period', () => {
      const configs = guaranteeService.getPredefinedConfigs();
      const sorted = configs.sort((a, b) => (a.days_warranty || 0) - (b.days_warranty || 0));

      expect(sorted[0].days_warranty).toBeLessThan(sorted[1].days_warranty!);
      expect(sorted[1].days_warranty).toBeLessThan(sorted[2].days_warranty!);
    });
  });
});
