'use client';

import React, { useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import StaffSidebar from '@/components/layout/StaffSidebar';
import { PageLoader } from '@/components/feedback/FeedbackStates';
import { Toaster } from 'sonner';

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isInitializing } = useAuth();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    if (mounted && !isInitializing && !isAuthenticated) {
      router.push('/login');
    }
  }, [mounted, isInitializing, isAuthenticated, router]);

  if (!mounted || isInitializing) return <PageLoader />;
  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-50 text-neutral-900">
      <Toaster richColors position="top-right" />
      <StaffSidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 scrollbar-none">
          <div className="mx-auto max-w-7xl space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
