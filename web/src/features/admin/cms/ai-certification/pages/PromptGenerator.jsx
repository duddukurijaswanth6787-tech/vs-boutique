import React from 'react';
import { CMSPage } from '../../components';

export default function PromptGenerator() {
  return (
    <CMSPage 
      title="Prompt Generator (Fix Assistant)"
      description="Automatically translate validation failures into detailed correction instructions for external AI generators."
      isPlaceholder={true}
      emptyTitle="No Correction Prompts Available"
      emptyDescription="Select a failed validation report to auto-generate a fix instructions payload for your AI builders."
      emptyActionText="Select Audit Report"
    />
  );
}
