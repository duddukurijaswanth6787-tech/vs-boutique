import { QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes default stale time
      retry: (failureCount, error: unknown) => {
        // Do not retry authorization or client validation/not found exceptions
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status && [400, 401, 403, 404, 422].includes(status)) {
          return false;
        }
        return failureCount < 2; // Retry transient network glitches at most twice
      },
    },
    mutations: {
      onError: (error: unknown) => {
        // ponytail: global mutation error toast — hooks can override with their own onError
        toast.error(getApiErrorMessage(error));
      },
    },
  },
});

// Centralized Query Key Factories
export const queryKeys = {
  auth: {
    me: () => ['auth', 'me'] as const,
  },
  dashboard: {
    summary: () => ['dashboard', 'summary'] as const,
    salesChart: (period?: string) => ['dashboard', 'salesChart', period || 'monthly'] as const,
  },
  health: {
    status: () => ['system', 'health'] as const,
  },
};
