import React from 'react';
import { CMSPage } from '../../components';

export default function AIAgentsConfig() {
  return (
    <CMSPage 
      title="AI Agents configuration"
      description="Configure target agents (SEO Auditor, Security Specialist, Accessibility Reviewer) and customize their prompt context guidelines."
      isPlaceholder={true}
      emptyTitle="No Agent Overrides Configured"
      emptyDescription="Verify and update context guidelines for the validation specialists to inspect template code."
      emptyActionText="Configure Agent Profiles"
    />
  );
}
