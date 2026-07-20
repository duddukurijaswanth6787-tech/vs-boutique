import { useState, useCallback } from 'react';

// ponytail: generic bulk operation — calls the single-item mutation for each selected ID
// Uses allSettled so partial failures report which items succeeded vs failed

interface BulkResult {
  success: string[];
  failed: { id: string; error: string }[];
}

export function useBulkOperation(
  mutateFn: (id: string) => Promise<unknown>,
  onSuccess?: () => void,
) {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [result, setResult] = useState<BulkResult | null>(null);

  const execute = useCallback(async (ids: string[]) => {
    setIsRunning(true);
    setProgress(0);
    setTotal(ids.length);
    setResult(null);

    const settled = await Promise.allSettled(
      ids.map(async (id) => {
        await mutateFn(id);
        return id;
      }),
    );

    const success: string[] = [];
    const failed: { id: string; error: string }[] = [];

    settled.forEach((r) => {
      if (r.status === 'fulfilled') {
        success.push(r.value);
      } else {
        failed.push({ id: 'unknown', error: r.reason?.message || 'Unknown error' });
      }
    });

    setProgress(ids.length);
    setResult({ success, failed });
    setIsRunning(false);
    if (onSuccess) onSuccess();
  }, [mutateFn, onSuccess]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setProgress(0);
    setTotal(0);
    setResult(null);
  }, []);

  return { execute, isRunning, progress, total, result, reset };
}
