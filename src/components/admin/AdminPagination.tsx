import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AdminPaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onPageChange: (page: number) => void;
}

export function AdminPagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  hasPreviousPage,
  hasNextPage,
  onPreviousPage,
  onNextPage,
  onPageChange,
}: AdminPaginationProps) {
  if (totalPages === 0) return null;

  const startItem = currentPage * pageSize + 1;
  const endItem = Math.min((currentPage + 1) * pageSize, totalCount);

  return (
    <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 bg-slate-50">
      <div className="text-sm text-slate-600 font-medium">
        Mostrando <span className="font-bold">{startItem}</span> a{' '}
        <span className="font-bold">{endItem}</span> de{' '}
        <span className="font-bold">{totalCount}</span> resultados
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onPreviousPage}
          disabled={!hasPreviousPage}
          className="flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
        >
          <ChevronLeft size={16} />
          Anterior
        </button>

        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => onPageChange(idx)}
              className={`w-8 h-8 rounded-lg font-medium text-sm transition-colors ${
                currentPage === idx
                  ? 'bg-black text-white'
                  : 'border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        <button
          onClick={onNextPage}
          disabled={!hasNextPage}
          className="flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
        >
          Próximo
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
