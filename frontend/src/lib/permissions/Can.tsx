'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { hasPermission, hasAnyPermission } from './rules';

interface CanProps {
  permission: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function Can({ permission, fallback = null, children }: CanProps) {
  const { user } = useAuth();
  if (hasPermission(user, permission)) {
    return <>{children}</>;
  }
  return <>{fallback}</>;
}

interface CanAnyProps {
  permissions: string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function CanAny({ permissions, fallback = null, children }: CanAnyProps) {
  const { user } = useAuth();
  if (hasAnyPermission(user, permissions)) {
    return <>{children}</>;
  }
  return <>{fallback}</>;
}

export function usePermission() {
  const { user } = useAuth();
  return {
    can: (permission: string) => hasPermission(user, permission),
    canAny: (permissions: string[]) => hasAnyPermission(user, permissions),
  };
}
