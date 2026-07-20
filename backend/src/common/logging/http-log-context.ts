export const HTTP_LOG_CONTEXT_SYMBOL = Symbol('HttpLoggingContext');

export interface HttpLoggingContext {
  requestId: string;
  startTime: bigint;
  controller?: string;
  handler?: string;
  incomingLogged: boolean;
  errorLogged: boolean;
}
