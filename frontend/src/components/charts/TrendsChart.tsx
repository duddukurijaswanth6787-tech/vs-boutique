'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { EmptyState } from '@/components/feedback/FeedbackStates';

interface TrendsChartProps {
  data: { label: string; cancellations: number; refunds: number }[];
}

// ponytail: lazy-loaded recharts bar chart for cancellation/refund trends
export default function TrendsChart({ data }: TrendsChartProps) {
  if (data.length === 0) {
    return <EmptyState title="No Trend Data" description="No cancellations or refunds recorded in the last 12 months." />;
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
        <XAxis dataKey="label" stroke="#a3a3a3" fontSize={11} tickLine={false} />
        <YAxis stroke="#a3a3a3" fontSize={11} tickLine={false} />
        <ChartTooltip contentStyle={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px' }} />
        <Legend />
        <Bar dataKey="cancellations" fill="#ef4444" name="Cancellations" />
        <Bar dataKey="refunds" fill="#f59e0b" name="Refunds" />
      </BarChart>
    </ResponsiveContainer>
  );
}
