import React, { useState } from 'react';
import { Copy, Check, MessageSquare } from 'lucide-react';

export default function PromptBlock({ promptData }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!promptData?.prompt) return;
    navigator.clipboard.writeText(promptData.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!promptData) return null;

  return (
    <div className="border border-gray-100 rounded-3xl p-6 bg-white space-y-4 shadow-sm text-left">
      <div className="flex items-start justify-between gap-4 border-b border-gray-50 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
              <MessageSquare size={16} className="text-primary" /> {promptData.title}
            </h3>
            <span className="px-2 py-0.5 text-[9px] font-bold bg-gray-50 text-gray-400 rounded-md uppercase border border-gray-100">
              {promptData.category}
            </span>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">{promptData.description}</p>
        </div>

        <button
          onClick={handleCopy}
          className="p-2 border border-gray-200 hover:border-primary hover:bg-primary/5 text-gray-500 hover:text-primary rounded-xl transition-all duration-200 flex items-center gap-1 text-xs font-bold shrink-0"
        >
          {copied ? (
            <>
              <Check size={14} className="text-emerald-500" /> Copied
            </>
          ) : (
            <>
              <Copy size={14} /> Copy Prompt
            </>
          )}
        </button>
      </div>

      {/* Prompt Body */}
      <div className="p-4 bg-gray-50/50 rounded-2xl font-mono text-[11px] text-gray-700 border border-gray-100 leading-relaxed whitespace-pre-wrap">
        {promptData.prompt}
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 text-[10px] text-gray-500 font-bold">
        {promptData.variables && Object.keys(promptData.variables).length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Variable Bindings</span>
            <div className="space-y-1">
              {Object.keys(promptData.variables).map(v => (
                <div key={v} className="flex justify-between p-1 bg-gray-50/20 border border-gray-100/50 rounded-lg px-2 py-1.5">
                  <span className="font-mono text-gray-400">{v}</span>
                  <span className="text-gray-700">{promptData.variables[v]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Recommended Engines</span>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {promptData.supportedAIModels.map(model => (
              <span key={model} className="px-2.5 py-1 bg-primary/5 text-primary rounded-md border border-primary/10">
                {model}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
