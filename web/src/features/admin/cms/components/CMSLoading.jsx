import React from 'react';
import { Loader2 } from 'lucide-react';

export default function CMSLoading({ message = 'Loading workspace...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 w-full text-center">
      <Loader2 className="animate-spin text-primary mb-3" size={36} />
      <p className="text-sm font-semibold text-secondaryText">{message}</p>
    </div>
  );
}
