import { SanitizeFieldsPipe, SanitizePipe } from './pipes.validation';

describe('SanitizeFieldsPipe', () => {
  const pipe = new SanitizeFieldsPipe(['content', 'answer']);

  const meta = { type: 'body' as const, metatype: Object, data: '' };

  it('passes through non-body metadata', () => {
    const val = { content: '<script>alert(1)</script>' };
    expect(pipe.transform(val, { ...meta, type: 'query' })).toEqual(val);
  });

  it('passes through non-object values', () => {
    expect(pipe.transform('string', meta)).toBe('string');
    expect(pipe.transform(null, meta)).toBeNull();
  });

  it('strips script tags and content', () => {
    const result = pipe.transform(
      { content: '<p>Hello</p><script>alert(1)</script>' },
      meta,
    ) as Record<string, string>;
    expect(result.content).toBe('<p>Hello</p>');
    expect(result.content).not.toContain('script');
  });

  it('strips iframe tags', () => {
    const result = pipe.transform(
      { content: '<iframe src="evil.com"></iframe><p>Safe</p>' },
      meta,
    ) as Record<string, string>;
    expect(result.content).toBe('<p>Safe</p>');
  });

  it('removes event handler attributes', () => {
    const result = pipe.transform(
      { content: '<p onclick="alert(1)">Text</p>' },
      meta,
    ) as Record<string, string>;
    expect(result.content).not.toContain('onclick');
    expect(result.content).toContain('<p');
    expect(result.content).toContain('Text');
  });

  it('removes javascript: URLs in href', () => {
    const result = pipe.transform(
      { content: '<a href="javascript:alert(1)">Link</a>' },
      meta,
    ) as Record<string, string>;
    expect(result.content).not.toContain('javascript:');
  });

  it('removes style attributes with expressions', () => {
    const result = pipe.transform(
      { content: '<p style="background:url(javascript:alert(1))">Text</p>' },
      meta,
    ) as Record<string, string>;
    expect(result.content).not.toContain('style');
  });

  it('preserves safe tags: p, b, i, strong, em, ul, li, a, br, h1-h6', () => {
    const input =
      '<p><b>Bold</b> <i>Italic</i> <strong>Strong</strong> <em>Em</em></p><ul><li>Item</li></ul><a href="https://example.com">Link</a><br/><h1>Heading</h1>';
    const result = pipe.transform({ content: input }, meta) as Record<
      string,
      string
    >;
    expect(result.content).toContain('<p>');
    expect(result.content).toContain('<b>');
    expect(result.content).toContain('<i>');
    expect(result.content).toContain('<strong>');
    expect(result.content).toContain('<em>');
    expect(result.content).toContain('<ul>');
    expect(result.content).toContain('<li>');
    expect(result.content).toContain('<a');
    expect(result.content).toContain('href');
    expect(result.content).toContain('<h1>');
  });

  it('preserves safe href attributes', () => {
    const result = pipe.transform(
      { content: '<a href="https://example.com" title="Test">Link</a>' },
      meta,
    ) as Record<string, string>;
    expect(result.content).toContain('href="https://example.com"');
    expect(result.content).toContain('title="Test"');
  });

  it('only sanitizes specified fields', () => {
    const result = pipe.transform(
      { content: '<script>bad</script>', name: '<script>ok</script>' },
      meta,
    ) as Record<string, string>;
    expect(result.content).not.toContain('script');
    // name is NOT in the sanitize list, so it passes through unchanged
    expect(result.name).toContain('script');
  });

  it('handles nested script tags', () => {
    const result = pipe.transform(
      { content: '<scr<script>ipt>alert(1)</scr</script>ipt>' },
      meta,
    ) as Record<string, string>;
    expect(result.content).not.toContain('alert');
  });

  it('strips SVG payloads', () => {
    const result = pipe.transform(
      { content: '<svg onload="alert(1)"><circle/></svg>' },
      meta,
    ) as Record<string, string>;
    expect(result.content).not.toContain('onload');
  });

  it('strips style tags and content', () => {
    const result = pipe.transform(
      { content: '<style>body{background:red}</style><p>Text</p>' },
      meta,
    ) as Record<string, string>;
    expect(result.content).not.toContain('style');
    expect(result.content).toContain('Text');
  });

  it('removes HTML comments', () => {
    const result = pipe.transform(
      { content: '<!-- comment --><p>Text</p>' },
      meta,
    ) as Record<string, string>;
    expect(result.content).not.toContain('comment');
    expect(result.content).toContain('Text');
  });
});

describe('SanitizePipe', () => {
  const pipe = new SanitizePipe();
  const meta = { type: 'body' as const, metatype: Object, data: '' };

  it('escapes all HTML in all string fields', () => {
    const result = pipe.transform(
      { name: '<b>Bold</b>', description: '<script>bad</script>' },
      meta,
    ) as Record<string, string>;
    expect(result.name).toContain('&lt;b&gt;');
    expect(result.description).toContain('&lt;script&gt;');
  });
});
