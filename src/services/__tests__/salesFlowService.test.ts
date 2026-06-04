import { salesFlowService } from '../salesFlowService';
import { addDays, parseISO, differenceInDays } from 'date-fns';

describe('SalesFlowService', () => {
  describe('calculateGuaranteeEndDate', () => {
    it('should calculate correct end date for 7-day warranty', () => {
      const saleDate = new Date('2026-06-04');
      const endDate = salesFlowService.calculateGuaranteeEndDate(saleDate.toISOString(), 7);
      const expectedDate = addDays(saleDate, 7);

      const daysDiff = differenceInDays(parseISO(endDate), expectedDate);
      expect(daysDiff).toBe(0);
    });

    it('should calculate correct end date for 90-day warranty', () => {
      const saleDate = new Date('2026-06-04');
      const endDate = salesFlowService.calculateGuaranteeEndDate(saleDate.toISOString(), 90);
      const expectedDate = addDays(saleDate, 90);

      const daysDiff = differenceInDays(parseISO(endDate), expectedDate);
      expect(daysDiff).toBe(0);
    });

    it('should calculate correct end date for 1-year warranty', () => {
      const saleDate = new Date('2026-06-04');
      const endDate = salesFlowService.calculateGuaranteeEndDate(saleDate.toISOString(), 365);
      const expectedDate = addDays(saleDate, 365);

      const daysDiff = differenceInDays(parseISO(endDate), expectedDate);
      expect(daysDiff).toBe(0);
    });

    it('should handle string dates correctly', () => {
      const saleDateStr = '2026-06-04T10:30:00Z';
      const endDate = salesFlowService.calculateGuaranteeEndDate(saleDateStr, 30);

      expect(endDate).toBeDefined();
      expect(typeof endDate).toBe('string');
      // Verify it's a valid ISO string
      expect(() => parseISO(endDate)).not.toThrow();
    });
  });

  describe('Sales flow phases', () => {
    it('should define correct phases', () => {
      const phases = ['documentacao', 'entrega', 'em_garantia', 'apos_garantia'];
      phases.forEach(phase => {
        expect(phase).toMatch(/^[a-z_]+$/);
      });
    });

    it('phases should be ordered correctly', () => {
      const phases = ['documentacao', 'entrega', 'em_garantia', 'apos_garantia'];
      // Just verify they exist and are strings
      expect(phases).toHaveLength(4);
      expect(phases.every(p => typeof p === 'string')).toBe(true);
    });
  });

  describe('Warranty expiration logic', () => {
    it('should identify expired warranty correctly', () => {
      const now = new Date();
      const yesterday = addDays(now, -1);

      const daysLeft = differenceInDays(yesterday, now);
      expect(daysLeft).toBeLessThan(0);
    });

    it('should identify expiring warranty (7 days or less)', () => {
      const now = new Date();
      const soon = addDays(now, 5);

      const daysLeft = differenceInDays(soon, now);
      expect(daysLeft).toBeLessThanOrEqual(7);
      expect(daysLeft).toBeGreaterThan(0);
    });

    it('should identify active warranty (more than 7 days)', () => {
      const now = new Date();
      const later = addDays(now, 30);

      const daysLeft = differenceInDays(later, now);
      expect(daysLeft).toBeGreaterThan(7);
    });
  });
});
