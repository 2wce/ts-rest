import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import test from 'node:test';

const app = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(app, 'dist/client');
const content = resolve(app, 'content/docs');
const escapeHtml = (text) =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const pages = (await readdir(content, { recursive: true })).filter((path) =>
  /\.mdx?$/.test(path),
);

for (const path of pages) {
  const slug = path.replace(/\.mdx?$/, '').replace(/(^|\/)index$/, '');
  test(`prerenders /${slug} with its content and metadata`, async () => {
    const markdown = await readFile(resolve(content, path), 'utf8');
    const title = markdown.match(/^title:\s*["']?(.+?)["']?\s*$/m)?.[1];
    const html = await readFile(resolve(output, slug, 'index.html'), 'utf8');
    assert.match(html, /<html/);
    assert.ok(title && html.includes(`<title>${escapeHtml(title)}</title>`));
    assert.match(html, /<article[ >]/);
    assert.ok(title && html.includes(title), `page title missing: ${title}`);
    if (markdown.includes('twoslash')) {
      assert.match(
        html,
        /twoslash-hover|twoslash-query-line|twoslash-popup-container/,
      );
      assert.match(html, /<pre[ >]/);
    }
  });
}

test('exports a static search index containing SDK documentation', async () => {
  const index = JSON.parse(
    await readFile(resolve(output, 'api/search.json'), 'utf8'),
  );
  assert.match(JSON.stringify(index), /contract|fetch/i);
});

test('exports a static 404 page with a link back to documentation', async () => {
  const html = await readFile(resolve(output, '404.html'), 'utf8');
  assert.match(html, /404 — Page not found/);
  assert.match(html, /Return to the docs/);
});
