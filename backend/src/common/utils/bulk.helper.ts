import { BulkOperationResult } from '@common/dto/bulk.dto';
import { ValidationException } from '@common/exceptions';

type AsyncOperation = (id: string) => Promise<any>;

export async function runBulkOperation(
  ids: string[],
  actionMap: Record<string, AsyncOperation>,
  action: string,
): Promise<BulkOperationResult> {
  const fn = actionMap[action];
  if (!fn)
    throw new ValidationException(
      `Unsupported bulk action: ${action}`,
      'BULK_UNSUPPORTED_ACTION',
    );

  const results = await Promise.allSettled(
    ids.map(async (id) => {
      await fn(id);
      return { id };
    }),
  );

  const success: { id: string }[] = [];
  const failed: { id: string; error: string }[] = [];

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status === 'fulfilled') {
      success.push(r.value);
    } else {
      failed.push({ id: ids[i], error: r.reason?.message ?? String(r.reason) });
    }
  }

  return {
    success,
    failed,
    totalProcessed: ids.length,
    successCount: success.length,
    failureCount: failed.length,
  };
}
