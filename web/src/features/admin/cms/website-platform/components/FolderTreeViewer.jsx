import React from 'react';
import { Folder, FileText } from 'lucide-react';

export default function FolderTreeViewer({ treeData = [], heading }) {
  return (
    <div className="border border-gray-100 rounded-3xl p-5 bg-gray-50/20 text-left space-y-3 font-mono text-xs shadow-sm">
      {heading && (
        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest pb-2 border-b border-gray-50">
          {heading}
        </div>
      )}
      <div className="space-y-1.5 pt-2">
        {treeData.map((node, i) => (
          <div 
            key={i} 
            className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors py-0.5"
            style={{ paddingLeft: `${node.indent * 16}px` }}
          >
            {node.type === 'folder' ? (
              <Folder size={14} className="text-amber-500 fill-amber-100/50 shrink-0" />
            ) : (
              <FileText size={14} className="text-blue-500 shrink-0" />
            )}
            <span className={node.type === 'folder' ? 'font-bold' : ''}>
              {node.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
