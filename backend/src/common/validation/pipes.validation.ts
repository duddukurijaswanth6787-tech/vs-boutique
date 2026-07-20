import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import { ValidationException } from '../exceptions';

const sanitizeHtmlLib = require('sanitize-html');

/**
 * Pipe that validates whether an incoming parameter is a valid UUID v4.
 * Throws a ValidationException on failure.
 */
@Injectable()
export class UUIDPipe implements PipeTransform {
  transform(value: unknown) {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (typeof value !== 'string' || !uuidRegex.test(value)) {
      throw new ValidationException(
        'Parameter must be a valid UUID v4',
        'INVALID_INPUT',
      );
    }
    return value;
  }
}

/**
 * Pipe that parses, validates, and normalizes query parameters for pagination.
 */
@Injectable()
export class PaginationPipe implements PipeTransform {
  transform(value: any) {
    if (!value || typeof value !== 'object') {
      return { page: 1, limit: 10, direction: 'asc' };
    }

    const page = Math.max(1, parseInt(value.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(value.limit, 10) || 10));
    const search =
      typeof value.search === 'string' ? value.search.trim() : undefined;
    const sort = typeof value.sort === 'string' ? value.sort.trim() : undefined;
    const direction = value.direction === 'desc' ? 'desc' : 'asc';

    return { page, limit, search, sort, direction };
  }
}

/**
 * Pipe that validates and parses sorting properties against an optional list of allowed fields.
 */
@Injectable()
export class SortingPipe implements PipeTransform {
  constructor(private readonly allowedFields?: string[]) {}

  transform(value: any) {
    if (!value || typeof value !== 'object') {
      return value;
    }

    if (value.sort && this.allowedFields) {
      const sortStr = String(value.sort);
      if (!this.allowedFields.includes(sortStr)) {
        throw new ValidationException(
          `Sorting by field '${sortStr}' is not allowed`,
          'INVALID_REQUEST',
        );
      }
    }
    return value;
  }
}

/**
 * Pipe that filters out unapproved parameters from query request payloads.
 */
@Injectable()
export class FilterPipe implements PipeTransform {
  constructor(private readonly allowedFilters: string[]) {}

  transform(value: any) {
    if (!value || typeof value !== 'object') {
      return value;
    }

    const filtered: Record<string, unknown> = {};
    for (const key of this.allowedFilters) {
      if (value[key] !== undefined) {
        filtered[key] = value[key];
      }
    }
    return filtered;
  }
}

/**
 * Pipe that trims leading and trailing whitespaces from all string body properties.
 */
@Injectable()
export class TrimPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata) {
    if (metadata.type !== 'body' || !value || typeof value !== 'object') {
      return value;
    }
    return this.trimObject(value);
  }

  private trimObject(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.trimObject(item));
    }
    const trimmed: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        trimmed[key] = value.trim();
      } else if (typeof value === 'object' && value !== null) {
        trimmed[key] = this.trimObject(value);
      } else {
        trimmed[key] = value;
      }
    }
    return trimmed;
  }
}

/**
 * Pipe that automatically sanitizes string inputs to prevent HTML and script injection (XSS attacks).
 */
@Injectable()
export class SanitizePipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata) {
    if (metadata.type !== 'body' || !value || typeof value !== 'object') {
      return value;
    }
    return this.sanitizeObject(value);
  }

  private sanitizeObject(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item));
    }
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        // ponytail: escape standard HTML tags recursively to prevent XSS payloads
        sanitized[key] = value
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')
          .replace(/\//g, '&#x2F;');
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
}

// ponytail: replaced hand-rolled regex sanitizer with maintained `sanitize-html`.
// Regex-based HTML sanitizers are bypassable (encoded URLs, nested mutations); the
// library parses to a DOM and applies an allowlist — the same safe-formatting intent,
// but actually safe. Same exported signature, so callers (SanitizeFieldsPipe, AI admin) are untouched.
const SAFE_TAGS = [
  'p',
  'b',
  'i',
  'u',
  'strong',
  'em',
  'ul',
  'ol',
  'li',
  'a',
  'br',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'blockquote',
  'span',
  'pre',
  'code',
];
const SAFE_ATTRS = ['href', 'title', 'class', 'id', 'target', 'rel'];

function sanitizeHtml(html: string): string {
  if (typeof html !== 'string') return '';
  return sanitizeHtmlLib(html, {
    allowedTags: SAFE_TAGS,
    allowedAttributes: { '*': SAFE_ATTRS },
    // disallow javascript: and data: URLs except images
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowProtocolRelative: false,
    disallowedTagsMode: 'completelyDiscard',
    transformTags: {
      a: sanitizeHtmlLib.simpleTransform('a', {
        rel: 'noopener noreferrer',
        target: '_blank',
      }),
    },
  });
}

/**
 * Pipe that sanitizes only specified body fields using allowlist-based HTML sanitization.
 * Use on controllers that accept rich text (CMS content, FAQ answers, etc.).
 */
@Injectable()
export class SanitizeFieldsPipe implements PipeTransform {
  constructor(private readonly fields: string[]) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    if (metadata.type !== 'body' || !value || typeof value !== 'object') {
      return value;
    }
    for (const field of this.fields) {
      if (typeof (value as any)[field] === 'string') {
        (value as any)[field] = sanitizeHtml((value as any)[field]);
      }
    }
    return value;
  }
}
