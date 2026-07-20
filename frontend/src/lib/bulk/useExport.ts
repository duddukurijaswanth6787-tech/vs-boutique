import { useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';

// ponytail: reuse existing reports/export API — triggered from any Export button
// Creates a background export job; user views results in /admin/reports/exports

interface ExportOptions {
  entity: string;
  format?: 'CSV' | 'EXCEL';
  filters?: Record<string, string | number | boolean | undefined>;
  selectedIds?: string[];
}

export function useExport() {
  const [isExporting, setIsExporting] = useState(false);

  const triggerExport = async ({ entity, format = 'CSV', filters, selectedIds }: ExportOptions) => {
    setIsExporting(true);
    try {
      const response = await apiClient.post('/reports/export', {
        entity,
        format,
        filters,
        selectedIds,
      });
      toast.success(`Export started for ${entity}. Check Export Jobs page when complete.`);
      return response.data;
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'response' in (err as object) &&
              (err as { response?: { data?: { message?: string } } }).response?.data
                ?.message;
      toast.error(message || `Failed to start ${entity} export`);
      throw err;
    } finally {
      setIsExporting(false);
    }
  };

  return { triggerExport, isExporting };
}
