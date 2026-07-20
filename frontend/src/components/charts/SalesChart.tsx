'use client';

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  CartesianGrid,
} from 'recharts';
import { EmptyState } from '@/components/feedback/FeedbackStates';

const formatCurrency = (val: number = 0) => {
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(1)}k`;
  return `₹${val.toLocaleString()}`;
};

interface SalesChartProps {
  data: { name: string; revenue: number }[];
}

// ponytail: isolated chart component — lazy-loaded via next/dynamic to keep recharts out of main bundle
export default function SalesChart({ data }: SalesChartProps) {
  if (data.length === 0) {
    return (
      <EmptyState
        title="No Sales Data Available"
        description="Check back later once order transactions have been recorded."
      />
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8B5A6B" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#8B5A6B" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
        <XAxis dataKey="name" stroke="#a3a3a3" fontSize={11} tickLine={false} />
        <YAxis
          stroke="#a3a3a3"
          fontSize={11}
          tickLine={false}
          tickFormatter={(v) => `₹${v / 1000}k`}
        />
        <ChartTooltip
          formatter={(val: unknown) => [formatCurrency(val as number), 'Revenue']}
          contentStyle={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px' }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#8B5A6B"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorRevenue)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
