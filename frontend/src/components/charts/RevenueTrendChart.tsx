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

interface RevenueTrendChartProps {
  data: { name: string; sales: number }[];
}

// ponytail: lazy-loaded recharts area chart for revenue trends
export default function RevenueTrendChart({ data }: RevenueTrendChartProps) {
  if (data.length === 0) {
    return <EmptyState title="No Sales Data" description="No revenue data available for the selected period." />;
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
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
          tickFormatter={(v) => `₹${v}`}
        />
        <ChartTooltip
          formatter={(val: unknown) => [formatCurrency(val as number), 'Sales']}
          contentStyle={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px' }}
        />
        <Area
          type="monotone"
          dataKey="sales"
          stroke="#8B5A6B"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorSales)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
