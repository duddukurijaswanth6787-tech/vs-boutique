import { AsyncLocalStorage } from 'async_hooks';
import { RequestContext } from '../types';

/**
 * Storage instance to persist and retrieve request-specific metadata context (e.g. Correlation ID)
 * across the execution call stack without parameter passing.
 */
export const loggerContextStorage = new AsyncLocalStorage<RequestContext>();
