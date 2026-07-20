import { HttpException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';

/**
 * Reusable abstract Base Exception class.
 * All enterprise platform exceptions inherit from this class.
 */
export abstract class BaseException extends HttpException {
  /** High-level categorized error code. */
  public readonly errorCode: string;
  /** ISO timestamp recording when the exception was instantiated. */
  public readonly timestamp: string;
  /** Operational metadata associated with the exception. */
  public readonly metadata: Record<string, unknown>;

  constructor(
    message: string,
    errorCode: string,
    status: HttpStatus,
    metadata: Record<string, unknown> = {},
  ) {
    super(message, status);
    this.errorCode = errorCode;
    this.timestamp = new Date().toISOString();
    this.metadata = metadata;
  }
}

/**
 * Exceptions thrown when business rules are violated.
 */
export class BusinessException extends BaseException {
  constructor(
    message: string,
    errorCode: string,
    metadata?: Record<string, unknown>,
  ) {
    super(message, errorCode, HttpStatus.UNPROCESSABLE_ENTITY, metadata);
  }
}

/**
 * Exceptions thrown during input validation failures.
 */
export class ValidationException extends BaseException {
  constructor(
    message: string,
    errorCode: string,
    metadata?: Record<string, unknown>,
  ) {
    super(message, errorCode, HttpStatus.BAD_REQUEST, metadata);
  }
}

/**
 * Exceptions thrown during database operations.
 */
export class DatabaseException extends BaseException {
  constructor(
    message: string,
    errorCode: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    metadata?: Record<string, unknown>,
  ) {
    super(message, errorCode, status, metadata);
  }
}

/**
 * Exceptions thrown during infrastructure service integrations (caching, queuing, mailers).
 */
export class InfrastructureException extends BaseException {
  constructor(
    message: string,
    errorCode: string,
    metadata?: Record<string, unknown>,
  ) {
    super(message, errorCode, HttpStatus.INTERNAL_SERVER_ERROR, metadata);
  }
}

/**
 * Exceptions thrown during third-party external API requests (e.g. payment/shipping providers).
 */
export class ExternalApiException extends BaseException {
  constructor(
    message: string,
    errorCode: string,
    status: HttpStatus = HttpStatus.BAD_GATEWAY,
    metadata?: Record<string, unknown>,
  ) {
    super(message, errorCode, status, metadata);
  }
}

/**
 * Placeholder exception thrown during authentication operations (credentials challenges).
 */
export class AuthenticationException extends BaseException {
  constructor(
    message: string,
    errorCode: string,
    metadata?: Record<string, unknown>,
  ) {
    super(message, errorCode, HttpStatus.UNAUTHORIZED, metadata);
  }
}

/**
 * Placeholder exception thrown during authorization/permission challenges.
 */
export class AuthorizationException extends BaseException {
  constructor(
    message: string,
    errorCode: string,
    metadata?: Record<string, unknown>,
  ) {
    super(message, errorCode, HttpStatus.FORBIDDEN, metadata);
  }
}

/**
 * Placeholder exception thrown during file upload operations.
 */
export class FileUploadException extends BaseException {
  constructor(
    message: string,
    errorCode: string,
    metadata?: Record<string, unknown>,
  ) {
    super(message, errorCode, HttpStatus.BAD_REQUEST, metadata);
  }
}

/**
 * Placeholder exception thrown during payment transactions.
 */
export class PaymentException extends BaseException {
  constructor(
    message: string,
    errorCode: string,
    metadata?: Record<string, unknown>,
  ) {
    super(message, errorCode, HttpStatus.PAYMENT_REQUIRED, metadata);
  }
}

/**
 * Placeholder exception thrown during shipping integrations.
 */
export class ShippingException extends BaseException {
  constructor(
    message: string,
    errorCode: string,
    metadata?: Record<string, unknown>,
  ) {
    super(message, errorCode, HttpStatus.BAD_REQUEST, metadata);
  }
}

/**
 * Exceptions thrown during object-storage operations (S3/local filesystem).
 */
export class StorageException extends BaseException {
  constructor(
    message: string,
    errorCode: string,
    metadata?: Record<string, unknown>,
  ) {
    super(message, errorCode, HttpStatus.INTERNAL_SERVER_ERROR, metadata);
  }
}

/**
 * Exceptions thrown when the AI/RAG provider is unreachable or fails.
 */
export class AiUnavailableException extends BaseException {
  constructor(
    message: string,
    errorCode: string = 'AI_UNAVAILABLE',
    metadata?: Record<string, unknown>,
  ) {
    super(message, errorCode, HttpStatus.SERVICE_UNAVAILABLE, metadata);
  }
}

/**
 * Mapper responsible for translating low-level framework, database, and library errors
 * into typed BaseException instances.
 */
export class GlobalExceptionMapper {
  /**
   * Maps an unknown exception to a BaseException.
   */
  static map(exception: unknown): BaseException {
    if (exception instanceof BaseException) {
      return exception;
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const err = exception;
      switch (err.code) {
        case 'P2002': {
          const target = (err.meta?.target as string[]) || [];
          return new DatabaseException(
            `Duplicate entry field violation: (${target.join(', ')})`,
            'DATABASE_CONSTRAINT',
            HttpStatus.CONFLICT,
            { target },
          );
        }
        case 'P2025': {
          return new DatabaseException(
            (err.meta?.cause as string) || 'Database record not found',
            'DATABASE_RECORD_NOT_FOUND',
            HttpStatus.NOT_FOUND,
          );
        }
        case 'P2003': {
          return new DatabaseException(
            'Foreign key constraint failed',
            'DATABASE_CONSTRAINT',
            HttpStatus.BAD_REQUEST,
          );
        }
        case 'P2021': {
          return new DatabaseException(
            'Database schema error: required table does not exist',
            'DATABASE_SCHEMA_MISMATCH',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
        case 'P2022': {
          return new DatabaseException(
            'Database schema error: required column does not exist',
            'DATABASE_SCHEMA_MISMATCH',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
        default: {
          return new DatabaseException(
            `Database operation failed: ${err.message}`,
            'DATABASE_CONNECTION',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      }
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      let message = exception.message;
      let errorCode = 'SYSTEM_001';
      let metadata: Record<string, unknown> = {};

      if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, unknown>;
        const msgVal = resObj['message'];
        if (Array.isArray(msgVal)) {
          message = msgVal.join(', ');
          errorCode = 'INVALID_INPUT';
          metadata = { validationErrors: msgVal };
          return new ValidationException(message, errorCode, metadata);
        } else if (typeof msgVal === 'string') {
          message = msgVal;
        }
      }

      if (status === HttpStatus.UNAUTHORIZED) {
        return new AuthenticationException(message, 'AUTH_001', metadata);
      }
      if (status === HttpStatus.FORBIDDEN) {
        return new AuthorizationException(message, 'AUTH_002', metadata);
      }
      if (status === HttpStatus.NOT_FOUND) {
        return new DatabaseException(
          message,
          'DATABASE_RECORD_NOT_FOUND',
          HttpStatus.NOT_FOUND,
          metadata,
        );
      }

      return new BusinessException(message, errorCode, metadata);
    }

    if (exception instanceof Error) {
      // ponytail: never expose raw Error.message in production — it can leak internals
      const isProduction = process.env.NODE_ENV === 'production';
      const safeMessage = isProduction
        ? 'An internal error occurred'
        : exception.message;
      return new BusinessException(safeMessage, 'SYSTEM_001');
    }

    return new BusinessException('An unexpected error occurred', 'SYSTEM_001');
  }
}
