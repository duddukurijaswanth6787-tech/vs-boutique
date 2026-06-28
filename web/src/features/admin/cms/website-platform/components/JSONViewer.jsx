import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function JSONViewer({ jsonSchema, heading }) {
  const [copied, setCopied] = useState(false);
  const jsonString = JSON.stringify(jsonSchema, null, 2);

  const handleCopy = () => {
    if (!jsonString) return;
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-gray-150 rounded-3xl overflow-hidden bg-gray-50/50 text-left shadow-sm text-xs font-mono">
      <div className="bg-gray-100/50 border-b border-gray-150 px-4 py-2 flex items-center justify-between gap-4">
        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
          {heading || 'JSON Schema Config'}
        </span>
        <button
          onClick={handleCopy}
          className="p-1 text-gray-400 hover:text-gray-600 rounded transition-all"
        >
          {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
        </button>
      </div>
      <div className="p-4 overflow-x-auto max-h-60">
        <pre className="text-gray-700 leading-relaxed font-mono whitespace-pre text-[10px]">
          <code>{jsonString}</code>
        </pre>
      </div>
    </div>
  );
}
