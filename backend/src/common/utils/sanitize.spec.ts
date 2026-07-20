import {
  sanitizePlainText,
  sanitizeRichText,
  sanitizeFields,
} from './sanitize';

describe('sanitizePlainText', () => {
  it('strips all HTML tags', () => {
    expect(sanitizePlainText('<script>alert("xss")</script>hello')).toBe(
      'hello',
    );
    expect(sanitizePlainText('<b>bold</b> text')).toBe('bold text');
    expect(sanitizePlainText('<img src=x onerror=alert(1)>')).toBe('');
  });

  it('strips event handlers', () => {
    expect(sanitizePlainText('<div onmouseover="alert(1)">hover</div>')).toBe(
      'hover',
    );
    expect(sanitizePlainText('<a href="javascript:alert(1)">click</a>')).toBe(
      'click',
    );
  });

  it('handles nested/broken HTML', () => {
    expect(sanitizePlainText('<b><i>deep</b></i>')).toBe('deep');
    const broken = sanitizePlainText(
      '<<script>script>alert(1)<</script>/script>',
    );
    expect(broken).not.toContain('<script');
    expect(broken).not.toContain('alert(1)');
  });

  it('passes plain text through unchanged', () => {
    expect(sanitizePlainText('Hello World')).toBe('Hello World');
    expect(sanitizePlainText('')).toBe('');
    expect(sanitizePlainText('price: $10.99')).toBe('price: $10.99');
  });

  it('handles non-string input', () => {
    expect(sanitizePlainText(null as unknown as string)).toBe('');
    expect(sanitizePlainText(undefined as unknown as string)).toBe('');
    expect(sanitizePlainText(123 as unknown as string)).toBe('');
  });

  it('strips SVG and object tags', () => {
    expect(
      sanitizePlainText('<svg onload="alert(1)"><circle r="10"/></svg>'),
    ).toBe('');
    expect(sanitizePlainText('<object data="evil.swf"></object>')).toBe('');
    expect(sanitizePlainText('<iframe src="evil.html"></iframe>')).toBe('');
  });
});

describe('sanitizeRichText', () => {
  it('preserves safe formatting tags', () => {
    expect(sanitizeRichText('<b>bold</b>')).toBe('<b>bold</b>');
    expect(sanitizeRichText('<i>italic</i>')).toBe('<i>italic</i>');
    expect(sanitizeRichText('<p>para</p>')).toBe('<p>para</p>');
    const linkResult = sanitizeRichText(
      '<a href="https://example.com">link</a>',
    );
    expect(linkResult).toContain('href="https://example.com"');
    expect(linkResult).toContain('target="_blank"');
    expect(linkResult).toContain('rel="noopener noreferrer"');
  });

  it('strips script tags and content', () => {
    expect(sanitizeRichText('<script>alert("xss")</script>hello')).toBe(
      'hello',
    );
    expect(
      sanitizeRichText('<p>safe</p><script>evil()</script><p>more</p>'),
    ).toBe('<p>safe</p><p>more</p>');
  });

  it('strips event handlers from allowed tags', () => {
    expect(sanitizeRichText('<b onclick="alert(1)">text</b>')).toBe(
      '<b>text</b>',
    );
    expect(sanitizeRichText('<p onmouseover="evil()">content</p>')).toBe(
      '<p>content</p>',
    );
  });

  it('blocks javascript: URLs', () => {
    const result = sanitizeRichText('<a href="javascript:alert(1)">click</a>');
    expect(result).not.toContain('javascript:');
    expect(result).toContain('click');
  });

  it('blocks data: URLs', () => {
    const result = sanitizeRichText(
      '<a href="data:text/html,<script>alert(1)</script>">click</a>',
    );
    expect(result).not.toContain('data:');
    expect(result).toContain('click');
  });

  it('allows http/https/mailto/tel schemes', () => {
    expect(
      sanitizeRichText('<a href="https://example.com">https</a>'),
    ).toContain('https://example.com');
    expect(
      sanitizeRichText('<a href="mailto:user@test.com">email</a>'),
    ).toContain('mailto:user@test.com');
    expect(sanitizeRichText('<a href="tel:+1234567890">call</a>')).toContain(
      'tel:+1234567890',
    );
  });

  it('strips disallowed tags (iframe, object, embed, form)', () => {
    expect(sanitizeRichText('<iframe src="evil"></iframe>')).toBe('');
    expect(sanitizeRichText('<object data="evil.swf"></object>')).toBe('');
    expect(sanitizeRichText('<embed src="evil.swf">')).toBe('');
    expect(sanitizeRichText('<form action="evil">input</form>')).toBe('input');
  });

  it('handles non-string input', () => {
    expect(sanitizeRichText(null as unknown as string)).toBe('');
    expect(sanitizeRichText(undefined as unknown as string)).toBe('');
  });

  it('preserves safe list tags', () => {
    expect(sanitizeRichText('<ul><li>item</li></ul>')).toBe(
      '<ul><li>item</li></ul>',
    );
    expect(sanitizeRichText('<ol><li>one</li><li>two</li></ol>')).toBe(
      '<ol><li>one</li><li>two</li></ol>',
    );
  });
});

describe('sanitizeFields', () => {
  it('sanitizes specified fields in plain mode', () => {
    const obj = {
      title: '<script>alert(1)</script>Hello',
      description: '<b>bold</b> text',
      other: '<script>untouched</script>',
    };
    sanitizeFields(obj, ['title', 'description'], 'plain');
    expect(obj.title).toBe('Hello');
    expect(obj.description).toBe('bold text');
    expect(obj.other).toBe('<script>untouched</script>');
  });

  it('sanitizes specified fields in rich mode', () => {
    const obj = {
      title: '<script>alert(1)</script>Hello',
      content: '<p>safe</p><script>evil()</script>',
    };
    sanitizeFields(obj, ['title', 'content'], 'rich');
    expect(obj.title).toBe('Hello');
    expect(obj.content).toBe('<p>safe</p>');
  });

  it('handles missing fields gracefully', () => {
    const obj = { title: 'hello' };
    expect(() =>
      sanitizeFields(obj, ['title', 'nonexistent'] as any),
    ).not.toThrow();
    expect(obj.title).toBe('hello');
  });

  it('handles null/undefined field values', () => {
    const obj = { title: null, description: undefined, name: 'test' } as any;
    expect(() =>
      sanitizeFields(obj, ['title', 'description', 'name']),
    ).not.toThrow();
    expect(obj.name).toBe('test');
  });
});
