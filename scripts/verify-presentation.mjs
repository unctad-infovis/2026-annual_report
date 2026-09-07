import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { htmlToDOM } from 'html-react-parser';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const baseline = path.join(tmpdir(), 'annual-report-presentation-baseline.json');
globalThis.window = {
  location: { hostname: 'localhost', href: 'http://localhost:8080/' },
};
const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
});
try {
  const { default: App } = await server.ssrLoadModule('/src/jsx/App.jsx');
  const html = renderToStaticMarkup(createElement(App));
  const normalized = normalize(htmlToDOM(html));
  if (process.argv.includes('--capture')) {
    await writeFile(baseline, JSON.stringify(normalized));
    console.log(`Captured rendered DOM baseline: ${baseline}`);
  } else {
    assert.deepEqual(normalized, JSON.parse(await readFile(baseline, 'utf8')));
    console.log('PASS: rendered elements, attributes, content and order match the baseline.');
  }
} finally {
  await server.close();
}

function normalize(nodes) {
  return nodes.flatMap(node => {
    if (node.type === 'text') {
      const text = node.data.replace(/\s+/g, ' ').trim();
      return text ? [text] : [];
    }
    if (!node.name) return [];
    if (node.attribs?.class) node.attribs.class = node.attribs.class.split(/\s+/).join(' ');
    return [
      {
        tag: node.name,
        attrs: Object.fromEntries(Object.entries(node.attribs || {}).sort()),
        children: normalize(node.children || []),
      },
    ];
  });
}
