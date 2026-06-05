import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface UseAdminTableOptions {
  pageSize?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  /**
   * Termo de busca (server-side). Quando preenchido, filtra usando ILIKE
   * nas colunas indicadas em `searchColumns`. A busca reseta para a 1ª página.
   */
  search?: string;
  /** Colunas onde a busca ILIKE será aplicada (ex: ['full_name', 'email']). */
  searchColumns?: string[];
}

export function useAdminTable(
  table: string,
  selectQuery: string,
  options: UseAdminTableOptions = {}
) {
  const {
    pageSize = 50,
    orderBy = 'created_at',
    orderDirection = 'desc',
    search = '',
    searchColumns = [],
  } = options;

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const searchKey = search.trim();
  const columnsKey = searchColumns.join(',');

  // Sempre que a busca muda, volta para a primeira página
  useEffect(() => {
    setCurrentPage(0);
  }, [searchKey, columnsKey]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const from = currentPage * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from(table)
        .select(selectQuery, { count: 'exact' });

      // Busca server-side via ILIKE em uma ou mais colunas
      if (searchKey && searchColumns.length > 0) {
        const orFilter = searchColumns
          .map((col) => `${col}.ilike.%${searchKey}%`)
          .join(',');
        query = query.or(orFilter);
      }

      const { data: result, count, error: err } = await query
        .order(orderBy, { ascending: orderDirection === 'asc' })
        .range(from, to);

      if (err) throw err;

      setData(result || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error(`Error fetching ${table}:`, err);
      setError(`Erro ao carregar dados. Tente novamente.`);
    } finally {
      setLoading(false);
    }
  }, [table, selectQuery, currentPage, pageSize, orderBy, orderDirection, searchKey, columnsKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNextPage = currentPage < totalPages - 1;
  const hasPreviousPage = currentPage > 0;

  return {
    data,
    loading,
    error,
    currentPage,
    totalPages,
    totalCount,
    pageSize,
    hasNextPage,
    hasPreviousPage,
    setCurrentPage,
    refetch: fetchData,
    goToNextPage: () => setCurrentPage(p => p + 1),
    goToPreviousPage: () => setCurrentPage(p => Math.max(0, p - 1)),
  };
}
