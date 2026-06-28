import React, { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';

export default function TerminalBlock({ command, heading, cwd = '~' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!command) return;
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-gray-800 rounded-3xl overflow-hidden bg-gray-950 text-left shadow-lg text-xs font-mono">
      {/* Terminal Titlebar */}
      <div className="bg-gray-900 px-4 py-2.5 flex items-center justify-between border-b border-gray-800">
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
          <span className="text-[10px] text-gray-500 font-bold ml-2 flex items-center gap-1.5 select-none">
            <Terminal size={12} /> {cwd}
          </span>
        </div>

        <button
          onClick={handleCopy}
          className="p-1 text-gray-400 hover:text-gray-100 hover:bg-gray-800 rounded transition-all"
          title="Copy Command"
        >
          {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
        </button>
      </div>

      {/* Terminal Content */}
      <div className="p-4 bg-gray-950 text-gray-200 overflow-x-auto">
        <div className="flex gap-2">
          <span className="text-primary select-none">$</span>
          <span className="whitespace-pre">{command}</span>
        </div>
      </div>
    </div>
  );
}
