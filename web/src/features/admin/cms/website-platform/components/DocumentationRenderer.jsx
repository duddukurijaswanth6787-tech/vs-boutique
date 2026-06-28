import React from 'react';
import CodeBlock from './CodeBlock';
import PromptBlock from './PromptBlock';
import TerminalBlock from './TerminalBlock';
import FolderTreeViewer from './FolderTreeViewer';
import JSONViewer from './JSONViewer';
import APIExampleCard from './APIExampleCard';
import { InfoCard, WarningCard, TipCard } from './WdkAlertCards';

export default function DocumentationRenderer({ section, onDownloadStarter }) {
  if (!section) return null;

  switch (section.type) {
    case 'text':
      return (
        <div className="space-y-2 text-left">
          {section.heading && (
            <h2 className="text-sm font-bold text-gray-800 border-l-2 border-primary pl-2.5">
              {section.heading}
            </h2>
          )}
          <p className="text-xs text-gray-500 leading-relaxed font-semibold">
            {section.body}
          </p>
        </div>
      );
    case 'info':
      return <InfoCard heading={section.heading} body={section.body} />;
    case 'warning':
      return <WarningCard heading={section.heading} body={section.body} />;
    case 'tip':
      return <TipCard heading={section.heading} body={section.body} />;
    case 'terminal':
      return <TerminalBlock command={section.command} cwd={section.cwd} heading={section.heading} />;
    case 'code':
      return <CodeBlock codeBlocks={section.codeBlocks} heading={section.heading} />;
    case 'prompt':
      return <PromptBlock promptData={section.promptData} />;
    case 'json':
      return <JSONViewer jsonSchema={section.jsonSchema} heading={section.heading} />;
    case 'api':
      return <APIExampleCard apiData={section.apiData} heading={section.heading} />;
    case 'folder':
      return <FolderTreeViewer treeData={section.treeData} heading={section.heading} />;
    case 'starter':
      return (
        <div className="space-y-4 text-left">
          {section.heading && (
            <h2 className="text-sm font-bold text-gray-800 border-l-2 border-primary pl-2.5">
              {section.heading}
            </h2>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {section.startersList?.map((starter, idx) => (
              <div key={idx} className="p-4 border border-gray-100 rounded-3xl hover:border-primary/20 hover:shadow-sm transition-all duration-200 space-y-3 bg-white">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-bold text-gray-800">{starter.name}</h4>
                    <span className="text-[10px] text-gray-400 font-bold">{starter.category}</span>
                  </div>
                  <span className="px-2 py-0.5 text-[8px] font-bold bg-gray-50 text-primary border border-gray-100 rounded-md uppercase">
                    {starter.tier}
                  </span>
                </div>
                
                <div className="text-[10px] text-gray-500 space-y-1">
                  <div className="font-bold flex flex-wrap gap-1">
                    {starter.features.map(f => (
                      <span key={f} className="bg-gray-50 px-1.5 py-0.5 rounded text-[8px]">{f}</span>
                    ))}
                  </div>
                  <div className="pt-2 text-[9px] text-gray-400">Compatibility: <span className="text-gray-700 font-bold">{starter.compatibility}</span></div>
                  <div className="text-[9px] text-gray-400">Required: <span className="text-primary font-bold">{starter.requiredModules.join(', ')}</span></div>
                </div>

                <button 
                  onClick={() => onDownloadStarter && onDownloadStarter(starter.name)}
                  className="w-full mt-3 flex items-center justify-center gap-1.5 py-2 bg-gray-50 hover:bg-primary hover:text-white transition-all rounded-xl text-[10px] font-bold text-gray-600 border border-gray-150/40"
                >
                  Download Boilerplate
                </button>
              </div>
            ))}
          </div>
        </div>
      );
    default:
      return null;
  }
}
