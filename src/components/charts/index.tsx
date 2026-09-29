import { useId } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { MonthlyPoint, StatusSlice } from '@/types';
import { APPLICATION_STATUS_LABELS } from '@/utils/constants';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#94a3b8',
  SUBMITTED: '#1D9BF0',
  DOCUMENTS_PENDING: '#F59E0B',
  APPOINTMENT_BOOKED: '#0EA5E9',
  PAYMENT_PENDING: '#F97316',
  UNDER_VERIFICATION: '#0F4C81',
  APPROVED: '#22C55E',
  REJECTED: '#EF4444',
  PASSPORT_ISSUED: '#15803D',
};

const tooltipStyle = {
  backgroundColor: 'rgba(15,23,42,0.92)',
  border: 'none',
  borderRadius: '10px',
  color: '#F1F5F9',
  fontSize: '12px',
  padding: '10px 12px',
};

export function MonthlyApplicationsChart({ data, height = 280 }: { data: MonthlyPoint[]; height?: number }) {
  const id = useId();
  return (
    <div style={{ height }} className="w-full" role="img" aria-label="Monthly applications bar chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id={`bar-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1D9BF0" />
              <stop offset="100%" stopColor="#0F4C81" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(29,155,240,0.08)' }} />
          <Bar dataKey="applications" name="Applications" fill={`url(#bar-${id})`} radius={[6, 6, 0, 0]} maxBarSize={42} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StatusDistributionChart({ data, height = 280 }: { data: StatusSlice[]; height?: number }) {
  const pieData = data.map((d) => ({
    name: APPLICATION_STATUS_LABELS[d.status] ?? d.status,
    value: d.count,
    color: STATUS_COLORS[d.status] ?? '#94a3b8',
  }));
  const total = pieData.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-sm text-slate-400">
        No application data yet
      </div>
    );
  }

  return (
    <div style={{ height }} className="w-full" role="img" aria-label="Application status distribution donut chart">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData}
            dataKey="value"
            nameKey="name"
            innerRadius="55%"
            outerRadius="80%"
            paddingAngle={2}
            strokeWidth={0}
          >
            {pieData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11 }} iconSize={9} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ApprovalTrendChart({ data, height = 260 }: { data: MonthlyPoint[]; height?: number }) {
  return (
    <div style={{ height }} className="w-full" role="img" aria-label="Approval trend area chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id="areaApproved" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22C55E" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="areaRejected" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EF4444" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Area type="monotone" dataKey="approved" name="Approved" stroke="#22C55E" strokeWidth={2} fill="url(#areaApproved)" />
          <Area type="monotone" dataKey="rejected" name="Rejected" stroke="#EF4444" strokeWidth={2} fill="url(#areaRejected)" />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
