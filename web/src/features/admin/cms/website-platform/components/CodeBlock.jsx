import React, { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';

export default function CodeBlock({ codeBlocks = [], heading }) {
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const activeBlock = codeBlocks[activeTab] || null;

  const handleCopy = () => {
    if (!activeBlock) return;
    navigator.clipboard.writeText(activeBlock.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (codeBlocks.length === 0) return null;

  return (
    <div className="border border-gray-800 rounded-3xl overflow-hidden bg-gray-950 text-left shadow-lg text-xs font-mono">
      {/* Code Header tabs */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {codeBlocks.map((block, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveTab(idx)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-tight transition-all uppercase shrink-0 ${
                activeTab === idx 
                  ? 'bg-gray-800 text-gray-100' 
                  : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/40'
              }`}
            >
              {block.label || block.language}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopy}
            className="p-1.5 text-gray-400 hover:text-gray-100 hover:bg-gray-800 rounded-xl transition-all"
            title="Copy Code"
          >
            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 text-gray-400 hover:text-gray-100 hover:bg-gray-800 rounded-xl transition-all"
            title={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Code Viewer content */}
      <div className={`p-5 overflow-x-auto relative transition-all duration-300 ${expanded ? 'max-h-none' : 'max-h-60'}`}>
        <pre className="text-gray-300 leading-relaxed overflow-x-auto whitespace-pre">
          <code>
            {activeBlock?.code.split('\n').map((line, i) => (
              <div key={i} className="flex gap-4">
                <span className="text-gray-600 w-6 text-right shrink-0 select-none">{i + 1}</span>
                <span>{line}</span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
