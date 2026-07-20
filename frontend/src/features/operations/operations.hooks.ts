import { useQuery } from '@tanstack/react-query';
import { operationsService } from './operations.service';

export function useSystemHealth() {
  return useQuery({
    queryKey: ['system-health'],
    queryFn: () => operationsService.getHealth(),
    refetchInterval: 15000, // Query every 15s for live command center visibility
  });
}
