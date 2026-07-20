// ponytail: thin wrapper over sanitize-html with allowlist config.
// Import in services to sanitize user-controlled text before persistence.
// Safe tags preserve legitimate formatting; scripts/event-handlers/unsafe URLs stripped.
import sanitizeHtmlLib from 'sanitize-html';

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

/** Sanitize rich-text content: allowlist-based, preserves safe formatting. */
export function sanitizeRichText(html: string): string {
  if (typeof html !== 'string') return '';
  return sanitizeHtmlLib(html, {
    allowedTags: SAFE_TAGS,
    allowedAttributes: { '*': SAFE_ATTRS },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowProtocolRelative: false,
    disallowedTagsMode: 'discard',
    transformTags: {
      a: sanitizeHtmlLib.simpleTransform('a', {
        rel: 'noopener noreferrer',
        target: '_blank',
      }),
    },
  });
}

/** Strip all HTML tags from plain-text fields (titles, names, descriptions). */
export function sanitizePlainText(text: string): string {
  if (typeof text !== 'string') return '';
  return sanitizeHtmlLib(text, {
    allowedTags: [],
    allowedAttributes: {},
  });
}

/** Sanitize an object's string fields in-place. */
export function sanitizeFields<T extends Record<string, unknown>>(
  obj: T,
  fields: Array<keyof T>,
  mode: 'plain' | 'rich' = 'plain',
): T {
  const sanitizer = mode === 'rich' ? sanitizeRichText : sanitizePlainText;
  for (const field of fields) {
    if (typeof obj[field] === 'string') {
      (obj[field] as unknown as string) = sanitizer(obj[field]);
    }
  }
  return obj;
}
