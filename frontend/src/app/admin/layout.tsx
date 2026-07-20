'use client';

import React, { useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import AdminSidebar from '@/components/layout/AdminSidebar';
import AdminHeader from '@/components/layout/AdminHeader';
import { PageLoader } from '@/components/feedback/FeedbackStates';
import { Toaster } from 'sonner';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isInitializing } = useAuth();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    // If not initializing and user is not authenticated, redirect to login
    if (mounted && !isInitializing && !isAuthenticated) {
      router.push('/login');
    }
  }, [mounted, isInitializing, isAuthenticated, router]);

  // Render full screen loader while session is bootstrapping or hydrating
  if (!mounted || isInitializing) {
    return <PageLoader />;
  }

  // Prevent flash of protected UI if user is not authorized
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-50 text-neutral-900 admin-root">
      <Toaster richColors position="top-right" />
      {/* Sidebar Panel */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top Sticky Header */}
        <AdminHeader />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-6 scrollbar-none">
          <div className="mx-auto max-w-7xl space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
