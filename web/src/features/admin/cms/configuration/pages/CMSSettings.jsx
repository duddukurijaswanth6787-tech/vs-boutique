import React from 'react';
import { CMSPage } from '../../components';

export default function CMSSettings() {
  return (
    <CMSPage 
      title="CMS Settings"
      description="Configure workspace parameters including AI API Keys (OpenAI, Anthropic, Gemini), SMTP servers, and AWS S3 storage buckets."
      isPlaceholder={true}
      emptyTitle="Settings Locked"
      emptyDescription="Global system settings can only be managed by authorized Super Admins. Adjust configurations dynamically."
      emptyActionText="Save Configurations"
    />
  );
}
