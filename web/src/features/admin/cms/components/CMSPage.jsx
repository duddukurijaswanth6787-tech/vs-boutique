import React from 'react';
import CMSWorkspace from './CMSWorkspace';
import CMSEmptyState from './CMSEmptyState';
import CMSBadge from './CMSBadge';

export default function CMSPage({
  title,
  description,
  actions,
  isPlaceholder = false,
  comingSoon = true,
  emptyTitle,
  emptyDescription,
  emptyActionText,
  onEmptyAction,
  children
}) {
  const defaultActions = (
    <div className="flex items-center space-x-2">
      {comingSoon && <CMSBadge variant="accent">Coming Soon</CMSBadge>}
      {actions}
    </div>
  );

  return (
    <CMSWorkspace
      title={title}
      description={description}
      actions={defaultActions}
      showToolbar={isPlaceholder}
      searchPlaceholder={`Search ${title}...`}
    >
      {isPlaceholder ? (
        <CMSEmptyState
          title={emptyTitle || `No ${title} Configured`}
          description={emptyDescription || `Manage and verify ${title} parameters inside the platform workspace.`}
          actionText={emptyActionText || `Configure ${title}`}
          onAction={onEmptyAction || (() => alert(`Configure ${title} clicked`))}
        />
      ) : (
        children
      )}
    </CMSWorkspace>
  );
}
