import { format, formatDistanceToNowStrict, parseISO, isValid } from 'date-fns';

export const formatDate = (iso?: string | null, pattern = 'dd MMM yyyy'): string => {
  if (!iso) return '—';
  const d = typeof iso === 'string' ? parseISO(iso) : iso;
  return isValid(d) ? format(d, pattern) : '—';
};

export const formatDateTime = (iso?: string | null): string =>
  formatDate(iso, 'dd MMM yyyy · hh:mm a');

export const formatRelative = (iso?: string | null): string => {
  if (!iso) return '—';
  const d = typeof iso === 'string' ? parseISO(iso) : iso;
  return isValid(d) ? `${formatDistanceToNowStrict(d)} ago` : '—';
};

export const formatCurrency = (amount: number, currency = 'INR'): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);

export const formatNumber = (n: number): string => new Intl.NumberFormat('en-IN').format(n);

export const formatFileSize = (kb: number): string =>
  kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;

export const initials = (name: string): string =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

export const titleCase = (s: string): string =>
  s
    .toLowerCase()
    .split(/[\s_]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

export const maskPhone = (p: string): string =>
  p.length >= 4 ? `${'•'.repeat(Math.max(0, p.length - 4))}${p.slice(-4)}` : p;

export const isValidIndianPhone = (p: string): boolean => /^[6-9]\d{9}$/.test(p.replace(/\s|-/g, ''));

export const downloadBlob = (data: Blob, filename: string): void => {
  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};
