'use client';

import React from 'react';
import { Menu, Activity, LogOut } from 'lucide-react';
import { useUIStore } from '@/stores/ui.store';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { healthService } from '@/services/health.service';
import { queryKeys } from '@/lib/query/client';
import Link from 'next/link';

export default function AdminHeader() {
  const { toggleMobileSidebar } = useUIStore();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  // Poll backend health status silently
  const { data: health, status: healthQueryStatus } = useQuery({
    queryKey: queryKeys.health.status(),
    queryFn: healthService.getHealth,
    refetchInterval: 30000, // Poll every 30 seconds
    retry: 1,
  });

  const getHealthIndicator = () => {
    if (healthQueryStatus === 'pending') {
      return { color: 'bg-neutral-300', text: 'Checking Status' };
    }
    if (healthQueryStatus === 'error') {
      return { color: 'bg-red-500 animate-pulse', text: 'System Down' };
    }
    if (health?.status === 'ok') {
      return { color: 'bg-green-500', text: 'System Healthy' };
    }
    return { color: 'bg-yellow-500', text: 'System Degraded' };
  };

  const healthIndicator = getHealthIndicator();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-admin-border-soft bg-admin-surface px-4">
      {/* Left section: mobile trigger */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleMobileSidebar}
          className="rounded p-1.5 text-admin-text-secondary hover:bg-admin-surface-soft lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Right section: System health indicator and profile dropdown */}
      <div className="flex items-center gap-4">
        {/* Real-time Health Indicator */}
        <Link
          href="/admin/system/health"
          className="flex items-center gap-2 rounded-full border border-admin-border-soft bg-admin-surface-secondary px-3 py-1 text-xs font-medium text-admin-text-secondary hover:bg-admin-surface-soft transition-colors"
        >
          <span className={`h-1.5 w-1.5 rounded-full ${healthIndicator.color}`} />
          <span className="hidden sm:inline">{healthIndicator.text}</span>
        </Link>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-full border border-admin-border p-1 hover:bg-admin-surface-secondary transition-all"
            aria-expanded={dropdownOpen}
            aria-label="User menu"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-admin-primary-soft text-xs font-semibold text-admin-primary uppercase">
              {user?.firstName?.[0] || 'A'}
            </div>
            <div className="hidden text-left md:block pr-1.5">
              <p className="text-xs font-semibold text-admin-text-primary">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[9px] text-admin-text-muted capitalize">
                {user?.roles?.[0]?.replace('_', ' ') || 'Staff'}
              </p>
            </div>
          </button>

          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-admin-border bg-admin-surface p-1 shadow-md z-20">
                <div className="px-3 py-2 border-b border-admin-border-soft">
                  <p className="text-xs font-semibold text-admin-text-primary truncate">
                    {user?.email}
                  </p>
                  <p className="text-[10px] text-admin-text-muted mt-0.5">
                    User ID: {user?.id?.substring(0, 8)}...
                  </p>
                </div>
                <div className="py-1">
                  <Link
                    href="/admin/system/health"
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-admin-text-secondary hover:bg-admin-surface-soft transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Activity className="h-3.5 w-3.5" />
                    System Status
                  </Link>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-red-700 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
