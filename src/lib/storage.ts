/**
 * Helpers de localStorage com migração de chave.
 *
 * As chaves do sistema usavam o prefixo `otimizza_`. Durante o rebrand para
 * Orvalho (2026-07-20) passaram a usar `orvalho_`. Trocar o prefixo sem migrar
 * faria todo usuário existente perder o tema salvo e refazer o tour.
 *
 * `readMigrated` lê a chave nova e, se ela não existir, promove o valor da
 * chave antiga uma única vez. Depois que todos os usuários ativos tiverem
 * passado pelo sistema, o parâmetro `legacyKey` pode ser removido.
 */
export function readMigrated(key: string, legacyKey: string): string | null {
  try {
    const current = localStorage.getItem(key);
    if (current !== null) return current;

    const legacy = localStorage.getItem(legacyKey);
    if (legacy !== null) {
      localStorage.setItem(key, legacy);
      localStorage.removeItem(legacyKey);
      return legacy;
    }
    return null;
  } catch {
    // localStorage pode lançar em modo privado ou com cota estourada
    return null;
  }
}
