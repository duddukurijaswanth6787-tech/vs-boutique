import React from 'react';
import { CMSPage } from '../../components';

export default function UploadWebsite() {
  return (
    <CMSPage 
      title="Upload Website codebase"
      description="Submit externally generated website codebases via ZIP archive or connect directly to a GitHub repository branch."
      isPlaceholder={true}
      emptyTitle="No Upload Tasks In Progress"
      emptyDescription="Select a manifest-compliant static code archive to upload to the secure sandbox for evaluation."
      emptyActionText="Import Website Codebase"
    />
  );
}
