import { HttpStatus } from '@nestjs/common';

/**
 * Reusable formatted response payload built by controllers.
 */
export class ResponsePayload<T> {
  constructor(
    public readonly statusCode: number,
    public readonly message: string,
    public readonly data: T | null,
    public readonly customMeta?: Record<string, unknown>,
  ) {}
}

/**
 * Enterprise Global Response Builder.
 * Standardizes controller outputs before interceptor formatting.
 */
export class ResponseBuilder {
  /** Constructs a standard success ResponsePayload. */
  static success<T>(
    data: T,
    message = 'Request processed successfully',
    metadata?: Record<string, unknown>,
  ): ResponsePayload<T> {
    return new ResponsePayload(HttpStatus.OK, message, data, metadata);
  }

  /** Constructs a standard created ResponsePayload. */
  static created<T>(
    data: T,
    message = 'Resource created successfully',
    metadata?: Record<string, unknown>,
  ): ResponsePayload<T> {
    return new ResponsePayload(HttpStatus.CREATED, message, data, metadata);
  }

  /** Constructs a standard updated ResponsePayload. */
  static updated<T>(
    data: T,
    message = 'Resource updated successfully',
    metadata?: Record<string, unknown>,
  ): ResponsePayload<T> {
    return new ResponsePayload(HttpStatus.OK, message, data, metadata);
  }

  /** Constructs a standard deleted ResponsePayload. */
  static deleted(
    message = 'Resource deleted successfully',
    metadata?: Record<string, unknown>,
  ): ResponsePayload<null> {
    return new ResponsePayload(HttpStatus.OK, message, null, metadata);
  }
}
