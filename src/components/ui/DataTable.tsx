import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { exportCsv, exportExcel, type ExportColumn } from '@/utils/export';
import { Button } from './Button';
import { EmptyState } from './Card';
import { TableSkeleton } from './Skeleton';
import { Select } from './Input';
import type { Page } from '@/types';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  filterOptions?: { value: string; label: string }[];
  filterFn?: (row: T, value: string) => boolean;
  render?: (row: T) => ReactNode;
  exportAccessor?: (row: T) => string | number | null | undefined;
  className?: string;
  headerClassName?: string;
  hideBelow?: 'sm' | 'md' | 'lg';
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data?: Page<T>;
  rows?: T[];
  loading?: boolean;
  error?: string | null;
  search?: string;
  onSearchChange?: (v: string) => void;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  onSortChange?: (sortBy: string, sortDir: 'asc' | 'desc') => void;
  filters?: Record<string, string>;
  onFiltersChange?: (f: Record<string, string>) => void;
  page: number; // current 0-based page index
  pageSize: number;
  onPageChange: (p: number) => void;
  onPageSizeChange?: (s: number) => void;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyAction?: ReactNode;
  exportName?: string;
  exportColumns?: ExportColumn<T>[];
  onRowClick?: (row: T) => void;
  toolbarExtra?: ReactNode;
  refresh: () => void;
}

const hideClass: Record<string, string> = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
};

export function DataTable<T extends { id: string }>({
  columns,
  data: pageData,
  rows: directRows,
  loading,
  error,
  search,
  onSearchChange,
  sortBy,
  sortDir,
  onSortChange,
  filters = {},
  onFiltersChange,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  emptyTitle = 'No records found',
  emptyMessage = 'Try adjusting your search or filters.',
  emptyAction,
  exportName = 'export',
  exportColumns,
  onRowClick,
  toolbarExtra,
  refresh,
}: DataTableProps<T>) {
  const [showFilters, setShowFilters] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState(search ?? '');

  const rows = directRows ?? pageData?.content ?? [];
  const totalElements = directRows ? rows.length : (pageData?.totalElements ?? 0);
  const totalPages = directRows ? 1 : (pageData?.totalPages ?? 1);

  // Debounce controlled search input to the parent's handler.
  useEffect(() => {
    if (!onSearchChange) return;
    const t = window.setTimeout(() => {
      if ((search ?? '') !== debouncedSearch) setDebouncedSearch(search ?? '');
    }, 0);
    return () => window.clearTimeout(t);
  }, [search, debouncedSearch, onSearchChange]);
  useEffect(() => {
    if (!onSearchChange) return;
    if (debouncedSearch === (search ?? '')) return;
    const t = window.setTimeout(() => onSearchChange(debouncedSearch), 350);
    return () => window.clearTimeout(t);
  }, [debouncedSearch, search, onSearchChange]);

  const localFiltered = useMemo(() => {
    if (directRows) {
      let out = [...directRows];
      const s = (filters.__localSearch ?? '').toLowerCase();
      if (s) {
        out = out.filter((r) =>
          columns.some((c) => String((r as Record<string, unknown>)[c.key] ?? '').toLowerCase().includes(s)),
        );
      }
      for (const col of columns) {
        const val = filters[col.key];
        if (col.filterable && val) {
          out = out.filter((r) =>
            col.filterFn ? col.filterFn(r, val) : String((r as Record<string, unknown>)[col.key]) === val,
          );
        }
      }
      return out;
    }
    return rows;
  }, [directRows, filters, columns]);

  const displayRows = directRows ? localFiltered : rows;

  const activeFilterCount = columns.filter((c) => c.filterable && filters[c.key]).length;

  const handleSort = (key: string): void => {
    if (!onSortChange) return;
    if (sortBy === key) {
      onSortChange(key, sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(key, 'asc');
    }
  };

  const doExport = (kind: 'csv' | 'excel'): void => {
    const cols: ExportColumn<T>[] = exportColumns ?? columns.map((c) => ({
      header: c.header,
      accessor: (row: T) => (c.exportAccessor ? c.exportAccessor(row) : (row as Record<string, unknown>)[c.key] as string | number),
    }));
    const source = directRows ? localFiltered : pageData?.content ?? [];
    if (kind === 'csv') exportCsv(exportName, source, cols);
    else exportExcel(exportName, source, cols);
  };


  return (
    <div className="card overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 dark:border-slate-800 px-4 py-3">
        {onSearchChange !== undefined || directRows ? (
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 icon text-slate-400 text-[20px]">search</span>
            <input
              type="search"
              value={directRows ? (filters.__localSearch ?? '') : (search ?? '')}
              onChange={(e) =>
                directRows
                  ? onFiltersChange?.({ ...filters, __localSearch: e.target.value })
                  : onSearchChange?.(e.target.value)
            }
              placeholder="Search…"
              aria-label="Search table"
              className="input-base pl-10 h-9 py-1.5"
            />
          </div>
        ) : null}

        {columns.some((c) => c.filterable) && (
          <Button variant="outline" size="sm" leftIcon={<span className="icon text-[16px]">filter_list</span>} onClick={() => setShowFilters((v) => !v)}>
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 rounded-full bg-primary-600 px-1.5 py-px text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </Button>
        )}

        <div className="ml-auto flex items-center gap-2">
          {toolbarExtra}
          <Button variant="ghost" size="sm" onClick={refresh} aria-label="Refresh data" title="Refresh">
            <span className="icon text-[18px]">refresh</span>
          </Button>
          <Button variant="outline" size="sm" leftIcon={<span className="icon text-[16px]">description</span>} onClick={() => doExport('csv')}>
            CSV
          </Button>
          <Button variant="outline" size="sm" leftIcon={<span className="icon text-[16px]">grid_on</span>} onClick={() => doExport('excel')}>
            Excel
          </Button>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-4 py-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {columns.filter((c) => c.filterable).map((c) => (
              <Select
                key={c.key}
                label={c.header}
                value={filters[c.key] ?? ''}
                onChange={(e) => onFiltersChange?.({ ...filters, [c.key]: e.target.value })}
                options={[{ value: '', label: `All ${c.header.toLowerCase()}` }, ...(c.filterOptions ?? [])]}
              />
            ))}
          </div>
          {activeFilterCount > 0 && (
            <button
              onClick={() => onFiltersChange?.({})}
              className="mt-3 text-xs font-medium text-danger-500 hover:text-danger-600"
            >
              Clear all filters
            </button>
          )}
        </motion.div>
      )}

      {/* Table */}
      {loading ? (
        <TableSkeleton cols={Math.min(columns.length, 6)} rows={pageSize >= 10 ? 8 : 4} />
      ) : error ? (
        <div className="px-6 py-12 text-center">
          <span className="icon text-[40px] text-danger-500">cloud_off</span>
          <p className="mt-3 text-sm font-medium text-ink-light dark:text-ink-dark">Failed to load data</p>
          <p className="mt-1 text-xs text-slate-500">{error}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={refresh} leftIcon={<span className="icon text-[16px]">refresh</span>}>
            Retry
          </Button>
        </div>
      ) : displayRows.length === 0 ? (
        <EmptyState title={emptyTitle} message={emptyMessage} action={emptyAction} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
                {columns.map((c) => (
                  <th
                    key={c.key}
                    scope="col"
                    className={cn(
                      'whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400',
                      c.sortable && 'cursor-pointer select-none hover:text-primary-600 dark:hover:text-secondary-400',
                      c.hideBelow && hideClass[c.hideBelow],
                      c.headerClassName,
                    )}
                    onClick={c.sortable ? () => handleSort(c.key) : undefined}
                    aria-sort={sortBy === c.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                  >
                    <span className="inline-flex items-center gap-1">
                      {c.header}
                      {c.sortable && (
                        <span className={cn('icon text-[14px] transition-opacity', sortBy === c.key ? 'opacity-100 text-secondary-500' : 'opacity-30')}>
                          {sortBy === c.key ? (sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                        </span>
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {displayRows.map((row, idx) => (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.02, 0.2), duration: 0.2 }}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'bg-white dark:bg-slate-900 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50',
                    onRowClick && 'cursor-pointer',
                  )}
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={cn('px-4 py-3 text-slate-600 dark:text-slate-300', c.hideBelow && hideClass[c.hideBelow], c.className)}
                    >
                      {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? '—')}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination footer */}
      {!loading && !error && displayRows.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800 px-4 py-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Showing <span className="font-semibold text-ink-light dark:text-ink-dark">{totalElements === 0 ? 0 : page * pageSize + 1}</span>
            –<span className="font-semibold text-ink-light dark:text-ink-dark">{Math.min((page + 1) * pageSize, totalElements)}</span> of{' '}
            <span className="font-semibold text-ink-light dark:text-ink-dark">{totalElements}</span>
          </p>
          <div className="flex items-center gap-1">
            {onPageSizeChange && (
              <Select
                aria-label="Rows per page"
                value={String(pageSize)}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                options={[10, 20, 50].map((n) => ({ value: String(n), label: `${n} / page` }))}
                containerClassName="w-32"
                className="h-8 py-1 text-xs"
              />
            )}
            <Button variant="outline" size="icon" disabled={page === 0} onClick={() => onPageChange(page - 1)} aria-label="Previous page">
              <span className="icon text-[18px]">chevron_left</span>
            </Button>
            <span className="px-3 text-xs font-medium text-slate-600 dark:text-slate-300 tabular-nums">
              {page + 1} / {Math.max(1, totalPages)}
            </span>
            <Button variant="outline" size="icon" disabled={page + 1 >= totalPages} onClick={() => onPageChange(page + 1)} aria-label="Next page">
              <span className="icon text-[18px]">chevron_right</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
