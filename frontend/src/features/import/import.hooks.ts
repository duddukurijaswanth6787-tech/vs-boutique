import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { importService } from './import.service';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

export const importKeys = {
  all: ['import'] as const,
  history: () => [...importKeys.all, 'history'] as const,
};

export function useImportPreview() {
  return useMutation({
    mutationFn: ({ entity, file }: { entity: string; file: File }) =>
      importService.preview(entity, file),
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err) || 'Failed to preview import');
    },
  });
}

export function useImportConfirm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entity, rows }: { entity: string; rows: Record<string, unknown>[] }) =>
      importService.confirm(entity, rows),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...importKeys.all] });
      toast.success('Import completed');
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err) || 'Import failed');
    },
  });
}

export function useImportHistory() {
  return useQuery({
    queryKey: importKeys.history(),
    queryFn: () => importService.getHistory(),
  });
}
