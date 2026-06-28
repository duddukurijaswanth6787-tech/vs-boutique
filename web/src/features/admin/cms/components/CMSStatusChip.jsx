import React from 'react';
import { CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

export default function CMSStatusChip({ status = 'pending', label }) {
  const normalizedStatus = status.toLowerCase();

  const configs = {
    passed: {
      bg: 'bg-green-50 text-green-700 border-green-200',
      icon: CheckCircle2,
      text: label || 'Passed'
    },
    failed: {
      bg: 'bg-red-50 text-red-700 border-red-200',
      icon: XCircle,
      text: label || 'Failed'
    },
    pending: {
      bg: 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse',
      icon: AlertCircle,
      text: label || 'Pending'
    },
    running: {
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: RefreshCw,
      text: label || 'Running',
      spin: true
    }
  };

  const current = configs[normalizedStatus] || configs.pending;
  const Icon = current.icon;

  return (
    <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${current.bg}`}>
      <Icon size={14} className={current.spin ? 'animate-spin' : ''} />
      <span>{current.text}</span>
    </span>
  );
}
