'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight, X, LogOut } from 'lucide-react';
import { adminNavigation } from '@/config/navigation';
import { useUIStore } from '@/stores/ui.store';
import { useAuth } from '@/hooks/useAuth';
import { canAccessRoute } from '@/lib/permissions/rules';

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const {
    sidebarCollapsed,
    mobileSidebarOpen,
    toggleSidebar,
    setMobileSidebarOpen,
  } = useUIStore();

  const handleLinkClick = () => {
    setMobileSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-neutral-900/50 lg:hidden transition-opacity"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Main Sidebar Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[#3E1624] bg-[#2D0B16] transition-all duration-300 lg:static
          ${sidebarCollapsed ? 'w-16' : 'w-64'}
          ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Brand / Logo Header */}
        <div className="flex h-20 items-center justify-between px-5 border-b border-[#3E1624]">
          {!sidebarCollapsed ? (
            <div className="flex flex-col">
              <span className="text-[15px] font-bold tracking-[0.1em] text-[#C5A880] font-serif leading-tight">VASANTHI</span>
              <span className="text-[9px] tracking-[0.25em] text-[#C5A880]/80 font-sans font-light leading-none">DESIGNERS</span>
            </div>
          ) : (
            <span className="text-sm font-black tracking-tighter text-[#C5A880] font-serif">
              VD
            </span>
          )}
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="rounded p-1 text-neutral-400 hover:bg-[#3E1624] lg:hidden"
            aria-label="Close mobile sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Navigation Groups */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-6 scrollbar-none">
          {adminNavigation.map((group) => {
            // Filter items by current user permissions
            const visibleItems = group.items.filter((item) => canAccessRoute(user, item));
            if (visibleItems.length === 0) return null;

            // ponytail: compare path portion only (strip query params), then match search params for tabbed nav items
            const bestMatch = visibleItems.reduce<(typeof visibleItems)[0] | null>((best, candidate) => {
              const candidatePath = candidate.href.split('?')[0];
              const matches = pathname === candidatePath || pathname.startsWith(candidatePath + '/');
              if (!matches) return best;
              const candidateQuery = candidate.href.includes('?') ? candidate.href.split('?')[1] : null;
              if (candidateQuery) {
                const currentSearch = typeof window !== 'undefined' ? window.location.search : '';
                const candidateParams = new URLSearchParams(candidateQuery);
                const currentParams = new URLSearchParams(currentSearch);
                const allMatch = [...candidateParams.entries()].every(
                  ([key, val]) => currentParams.get(key) === val
                );
                if (!allMatch) return best;
              }
              if (!best) return candidate;
              return candidate.href.length > best.href.length ? candidate : best;
            }, null);

            return (
              <div key={group.group} className="space-y-1.5">
                {!sidebarCollapsed && (
                  <h4 className="px-3 text-[11px] font-bold tracking-[1px] text-[#B99AA6] uppercase">
                    {group.group}
                  </h4>
                )}
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const isActive = item === bestMatch;
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.id}
                        href={item.implemented ? item.href : '#'}
                        onClick={item.implemented ? handleLinkClick : undefined}
                        className={`flex items-center gap-3 h-11 py-3.5 px-4 text-xs font-semibold transition-all duration-200 group relative border-l-4 border-transparent
                          ${isActive 
                            ? 'bg-[#8A1538] text-white border-l-[#F8C8D8] rounded-[10px] shadow-[0_4px_12px_rgba(138,21,56,0.25)]' 
                            : 'text-[#E7D6DC] hover:bg-[#5A1B2E] hover:text-white'
                          }
                          ${!item.implemented ? 'opacity-45 cursor-not-allowed' : ''}
                        `}
                      >
                        <Icon className={`h-4 w-4 shrink-0 transition-colors duration-200 ${isActive ? 'text-white' : 'text-[#D5BEC6] group-hover:text-white'}`} />
                        {!sidebarCollapsed && (
                          <span className="truncate">{item.title}</span>
                        )}
                        {!item.implemented && !sidebarCollapsed && (
                          <span className="ml-auto text-[8px] bg-[#3E1624] text-neutral-400 px-1.5 py-0.5 rounded uppercase font-semibold">
                            Phase 2
                          </span>
                        )}
                        {/* Collapsed tooltip */}
                        {sidebarCollapsed && (
                          <div className="absolute left-14 z-50 rounded-md bg-[#2D0B16] border border-[#3E1624] px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            {item.title} {!item.implemented && '(Phase 2)'}
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="border-t border-[#3E1624] p-3">
          <button
            onClick={() => logout()}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-950/30 transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
          {/* Collapse toggle (desktop only) */}
          <button
            onClick={toggleSidebar}
            className="mt-2 hidden w-full lg:flex items-center justify-center rounded-md p-1.5 text-neutral-400 hover:bg-[#3E1624] hover:text-white transition-colors"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
