import React from 'react';
import CMSHeader from './CMSHeader';
import CMSToolbar from './CMSToolbar';

export default function CMSWorkspace({ 
  title, 
  description, 
  actions, 
  showToolbar = false, 
  searchPlaceholder = 'Search...', 
  searchValue, 
  onSearchChange,
  toolbarChildren,
  children 
}) {
  return (
    <div className="w-full min-h-screen text-gray-900 pb-12 animate-fade-in">
      <CMSHeader 
        title={title} 
        description={description} 
        actions={actions} 
      />
      
      {showToolbar && (
        <CMSToolbar 
          searchPlaceholder={searchPlaceholder} 
          searchValue={searchValue}
          onSearchChange={onSearchChange}
        >
          {toolbarChildren}
        </CMSToolbar>
      )}
      
      <div className="w-full bg-white rounded-3xl border border-gray-100 shadow-soft p-6 md:p-8">
        {children}
      </div>
    </div>
  );
}
