/**
 * Formats a number to Brazilian currency format (pt-BR)
 * Example: 50000 -> 50.000
 */
export const formatCurrency = (value: number | string): string => {
    if (value === undefined || value === null || value === '') return '';

    // If string, remove everything except digits
    const cleanValue = typeof value === 'string' ? value.replace(/\D/g, '') : value.toString();
    const numberValue = parseInt(cleanValue, 10);

    if (isNaN(numberValue)) return '';

    return numberValue.toLocaleString('pt-BR');
};

/**
 * Parses a formatted currency string back to a number
 * Example: "50.000" -> 50000
 */
export const parseCurrency = (value: string): number => {
    const cleanValue = value.replace(/\D/g, '');
    return cleanValue ? parseInt(cleanValue, 10) : 0;
};

/**
 * Handles the change event for a currency input
 */
export const handleCurrencyChange = (
    value: string,
    callback: (numericValue: number) => void
) => {
    const numericValue = parseCurrency(value);
    callback(numericValue);
};

/**
 * Formata um número para quilometragem (ex: 12500 -> 12.500)
 */
export const formatKM = (value: number | string): string => {
    if (value === undefined || value === null || value === '') return '';
    const cleanValue = typeof value === 'string' ? value.replace(/\D/g, '') : value.toString();
    const numberValue = parseInt(cleanValue, 10);
    if (isNaN(numberValue)) return '';
    return numberValue.toLocaleString('pt-BR');
};

/**
 * Converte string formatada de volta para número de KM
 */
export const parseKM = (value: string): number => {
    const cleanValue = value.replace(/\D/g, '');
    return cleanValue ? parseInt(cleanValue, 10) : 0;
};
