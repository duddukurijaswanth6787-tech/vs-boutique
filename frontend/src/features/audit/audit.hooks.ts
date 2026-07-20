import { useQuery } from '@tanstack/react-query';
import { auditService } from './audit.service';
import { AuditLogQueryDto } from './audit.types';

export function useAuditLogs(query: AuditLogQueryDto) {
  return useQuery({
    queryKey: ['auditLogs', query],
    queryFn: () => auditService.getAuditLogs(query),
  });
}

export function useAuditLog(id: string) {
  return useQuery({
    queryKey: ['auditLog', id],
    queryFn: () => auditService.getAuditLogById(id),
    enabled: !!id,
  });
}
