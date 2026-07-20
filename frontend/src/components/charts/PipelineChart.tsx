'use client';

import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { EmptyState } from '@/components/feedback/FeedbackStates';

interface PipelineChartProps {
  data: { name: string; Count: number }[];
}

// ponytail: lazy-loaded recharts bar chart for order pipeline status
export default function PipelineChart({ data }: PipelineChartProps) {
  if (data.length === 0) {
    return <EmptyState title="No Pipeline Data" description="No order status data available." />;
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
        <XAxis dataKey="name" stroke="#a3a3a3" fontSize={10} tickLine={false} />
        <YAxis stroke="#a3a3a3" fontSize={10} tickLine={false} allowDecimals={false} />
        <Tooltip cursor={{ fill: '#fafafa' }} />
        <Bar dataKey="Count" fill="#8B5A6B" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
