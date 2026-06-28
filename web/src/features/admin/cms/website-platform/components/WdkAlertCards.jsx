import React from 'react';
import { Info, AlertTriangle, Lightbulb } from 'lucide-react';

export function InfoCard({ heading, body }) {
  return (
    <div className="flex gap-3.5 p-5 bg-blue-50/50 border border-blue-100/50 rounded-3xl text-left text-xs">
      <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
      <div className="space-y-1">
        {heading && <h4 className="font-bold text-blue-800">{heading}</h4>}
        <p className="text-blue-700/85 leading-relaxed font-semibold">{body}</p>
      </div>
    </div>
  );
}

export function WarningCard({ heading, body }) {
  return (
    <div className="flex gap-3.5 p-5 bg-red-50/50 border border-red-100/50 rounded-3xl text-left text-xs">
      <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
      <div className="space-y-1">
        {heading && <h4 className="font-bold text-red-800">{heading}</h4>}
        <p className="text-red-700/85 leading-relaxed font-semibold">{body}</p>
      </div>
    </div>
  );
}

export function TipCard({ heading, body }) {
  return (
    <div className="flex gap-3.5 p-5 bg-amber-50/50 border border-amber-100/50 rounded-3xl text-left text-xs">
      <Lightbulb size={18} className="text-amber-500 shrink-0 mt-0.5" />
      <div className="space-y-1">
        {heading && <h4 className="font-bold text-amber-800">{heading}</h4>}
        <p className="text-amber-700/85 leading-relaxed font-semibold">{body}</p>
      </div>
    </div>
  );
}
