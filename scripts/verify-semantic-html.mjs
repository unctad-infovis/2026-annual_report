import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { htmlToDOM } from 'html-react-parser';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const phrasing = new Set(['p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'b', 'strong', 'em', 'i', 'small', 'label', 'button']);
const blocks = new Set([
  'p',
  'div',
  'section',
  'article',
  'aside',
  'nav',
  'main',
  'header',
  'footer',
  'ul',
  'ol',
  'li',
  'figure',
  'figcaption',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'blockquote',
  'table',
  'hr',
]);
const baseline = path.join(tmpdir(), 'annual-report-semantic-html.json');
globalThis.window = { location: { hostname: 'localhost', href: 'http://localhost:8080/' } };
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { default: App } = await server.ssrLoadModule('/src/jsx/App.jsx');
  const html = renderToStaticMarkup(createElement(App));
  // Preserve invalid nesting for inspection instead of letting an HTML parser repair it.
  const xml = html.replace(/<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)\b([^>]*?)(?<!\/)>/g, '<$1$2/>');
  const nodes = htmlToDOM(xml, { xmlMode: true });
  const issues = [];
  function normalize(node, ancestors = []) {
    if (node.type === 'text') return node.data.replace(/\s+/g, ' ').trim() || [];
    if (!node.name) return [];
    const constrained = ancestors.some(parent => phrasing.has(parent.name));
    if (blocks.has(node.name) && constrained) issues.push(`${ancestors.map(parent => parent.name).join(' > ')} > ${node.name}`);
    if (['a', 'button'].includes(node.name) && ancestors.some(parent => ['a', 'button'].includes(parent.name)))
      issues.push('Nested interactive element');
    if (node.name === 'li' && !['ul', 'ol', 'menu'].includes(ancestors.at(-1)?.name)) issues.push('List item outside a list');
    const children = (node.children || []).flatMap(child => normalize(child, [...ancestors, node]));
    if (node.name === 'p' && constrained && !Object.keys(node.attribs || {}).length) return children;
    return [{ tag: node.name, attrs: Object.fromEntries(Object.entries(node.attribs || {}).sort()), children }];
  }
  const normalized = nodes.flatMap(node => normalize(node));
  if (process.argv.includes('--capture')) {
    await writeFile(baseline, JSON.stringify(normalized));
    console.log(`Captured baseline; ${issues.length} invalid nesting occurrences.`);
    console.log([...new Set(issues)].join('\n'));
  } else {
    assert.deepEqual(issues, [], 'Invalid report HTML nesting');
    if (!process.argv.includes('--check')) {
      assert.deepEqual(
        canonical(normalized),
        canonical(JSON.parse(await readFile(baseline, 'utf8'))),
        'Only approved semantic wrappers may change',
      );
    }
    console.log('PASS: no violations in the rendered HTML nesting checks.');
    if (!process.argv.includes('--check')) console.log('PASS: content, attributes and order preserved except approved semantic wrappers.');
  }
} finally {
  await server.close();
}

function canonical(nodes, inFlag = false) {
  return nodes.flatMap(node => {
    if (typeof node === 'string') return [node];
    const flag = inFlag || node.attrs.class?.split(' ').includes('ar-flag');
    const children = canonical(node.children, flag);
    if (flag && node.attrs.class === 'ar-flag-description') return children;
    const attrs = { ...node.attrs };
    if (flag && ['ar-flag-title', 'ar-flag-content'].includes(attrs.class)) delete attrs.class;
    const tag = flag && ['div', 'h4', 'p', 'span'].includes(node.tag) ? 'flag-content' : node.tag;
    return [{ tag, attrs, children }];
  });
}
