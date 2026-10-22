import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';

const require = createRequire(import.meta.url);
// Exercise the actual editor dependency, not a separate direct test-only parser.
const editorRequire = createRequire(require.resolve('codemirror-json-schema'));
const MarkdownIt = editorRequire('markdown-it');

test('schema editor Markdown preserves links, code, smartquotes and safe HTML defaults', () => {
  const markdown = new MarkdownIt({ linkify: true, typographer: true });
  const html = markdown.render('**Schema** `docker` https://example.invalid\n\n"quote" <script>alert(1)</script>');
  assert.match(html, /<strong>Schema<\/strong>/);
  assert.match(html, /<code>docker<\/code>/);
  assert.match(html, /href="https:\/\/example.invalid"/);
  assert.match(html, /“quote”/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>/);
});

test('patched inline HTML parser handles every unterminated-construct advisory variant', () => {
  const markdown = new MarkdownIt({ html: true });
  for (const opener of ['<!--', '<?x', '<!A', '<![CDATA[']) {
    const source = `x ${opener.repeat(8000)}`;
    assert.ok(markdown.render(source).startsWith('<p>x '));
  }
});
