'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  Home,
  Package,
  User,
  LogOut,
  Star,
  Phone,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/staff/dashboard', icon: Home },
  { label: 'Packing Queue', href: '/staff/packing', icon: Package },
  { label: 'Warehouse', href: '/staff/warehouse', icon: Star },
  { label: 'Support', href: '/staff/support', icon: Phone },
  { label: 'Profile', href: '/staff/profile', icon: User },
];

export default function StaffSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <aside className="flex flex-col w-64 bg-white border-r border-neutral-200/60 shrink-0">
      <div className="p-5 border-b border-neutral-100">
        <h2 className="text-sm font-bold text-neutral-900">Staff Panel</h2>
        <p className="text-[10px] text-neutral-400 mt-0.5">Operational workspace</p>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                isActive
                  ? 'bg-[#7A1C30]/10 text-[#7A1C30]'
                  : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-neutral-100">
        <button
          onClick={() => logout()}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-neutral-500 hover:text-red-600 hover:bg-red-50 transition-colors w-full"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Logout
        </button>
      </div>
    </aside>
  );
}
