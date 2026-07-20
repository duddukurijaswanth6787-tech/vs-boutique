'use client';

import React from 'react';
import { X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { BulkOperationResult } from '@/features/bulk/bulk.types';

// ponytail: floating bar for bulk operations — shows count, action buttons, progress, result

interface BulkAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

interface BulkActionBarProps {
  selectedCount: number;
  actions: BulkAction[];
  onClear: () => void;
  isRunning?: boolean;
  progress?: number;
  total?: number;
  result?: BulkOperationResult | null;
}

export default function BulkActionBar({
  selectedCount,
  actions,
  onClear,
  isRunning,
  progress,
  total,
  result,
}: BulkActionBarProps) {
  if (selectedCount === 0 && !result) return null;

  return (
    <div className="sticky bottom-4 z-40 flex items-center justify-between gap-4 rounded-2xl bg-neutral-900 px-5 py-3 text-white shadow-lg border border-neutral-700">
      <div className="flex items-center gap-3">
        {result ? (
          <div className="flex items-center gap-2 text-xs">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            <span>{result.success.length} succeeded</span>
            {result.failed.length > 0 && (
              <span className="flex items-center gap-1 text-red-300">
                <AlertCircle className="h-3.5 w-3.5" /> {result.failed.length} failed
              </span>
            )}
            <button onClick={onClear} className="ml-2 text-xs text-neutral-400 hover:text-white underline">
              Dismiss
            </button>
          </div>
        ) : (
          <>
            <span className="text-sm font-semibold">
              {selectedCount} selected
            </span>
            {isRunning && (
              <div className="flex items-center gap-2 text-xs text-neutral-300">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {progress}/{total}
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        {!result && !isRunning && (
          <>
            {actions.map((action) => (
              <button
                key={action.label}
                onClick={action.onClick}
                disabled={isRunning}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  action.variant === 'danger'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-white hover:bg-neutral-100 text-neutral-900'
                } disabled:opacity-50`}
              >
                {action.label}
              </button>
            ))}
            <button
              onClick={onClear}
              className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition"
              aria-label="Clear selection"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
