import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface UseAdminTableOptions {
  pageSize?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export function useAdminTable(
  table: string,
  selectQuery: string,
  options: UseAdminTableOptions = {}
) {
  const { pageSize = 50, orderBy = 'created_at', orderDirection = 'desc' } = options;

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const from = currentPage * pageSize;
      const to = from + pageSize - 1;

      // Fetch data with pagination
      const { data: result, count, error: err } = await supabase
        .from(table)
        .select(selectQuery, { count: 'exact' })
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
  }, [table, selectQuery, currentPage, pageSize, orderBy, orderDirection]);

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
