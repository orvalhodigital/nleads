import { describe, it, expect } from 'vitest';
import { formatCurrency, parseCurrency, formatKM, parseKM } from '../formatters';

describe('formatters utility', () => {
    describe('formatCurrency', () => {
        it('formats numbers to pt-BR formatted string', () => {
            expect(formatCurrency(50000)).toBe('50.000');
            expect(formatCurrency(0)).toBe('0');
        });

        it('handles null/undefined/empty gracefully', () => {
            expect(formatCurrency(null as any)).toBe('');
            expect(formatCurrency(undefined as any)).toBe('');
        });
    });

    describe('parseCurrency', () => {
        it('parses formatted currency strings back to numeric values', () => {
            expect(parseCurrency('R$ 50.000')).toBe(50000);
            expect(parseCurrency('15000')).toBe(15000);
        });
    });

    describe('formatKM', () => {
        it('formats numbers to pt-BR KM string', () => {
            expect(formatKM(45000)).toBe('45.000');
        });
    });

    describe('parseKM', () => {
        it('parses formatted KM strings back to numeric values', () => {
            expect(parseKM('45.000 km')).toBe(45000);
        });
    });
});
