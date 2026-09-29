import * as XLSX from 'xlsx';
import { downloadBlob } from './format';

export interface ExportColumn<T> {
  header: string;
  accessor: (row: T) => string | number | null | undefined;
}

export const toMatrix = <T>(rows: T[], columns: ExportColumn<T>[]): (string | number)[][] => [
  columns.map((c) => c.header),
  ...rows.map((r) => columns.map((c) => c.accessor(r) ?? '')),
];

export function exportCsv<T>(filename: string, rows: T[], columns: ExportColumn<T>[]): void {
  const matrix = toMatrix(rows, columns);
  const csv = matrix
    .map((row) =>
      row
        .map((cell) => {
          const s = String(cell);
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(','),
    )
    .join('\n');
  downloadBlob(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }), `${filename}.csv`);
}

export function exportExcel<T>(filename: string, rows: T[], columns: ExportColumn<T>[]): void {
  const matrix = toMatrix(rows, columns);
  const sheet = XLSX.utils.aoa_to_sheet(matrix);
  sheet['!cols'] = columns.map((c) => ({ wch: Math.max(12, c.header.length + 4) }));
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, 'Export');
  const out = XLSX.write(book, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
  downloadBlob(new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${filename}.xlsx`);
}
