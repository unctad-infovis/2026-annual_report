import assert from 'node:assert/strict';
import { htmlToDOM } from 'html-react-parser';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

globalThis.window = { location: { hostname: 'localhost', href: 'http://localhost:8080/' } };
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
const flatten = nodes => nodes.flatMap(node => [node, ...flatten(node.children || [])]);
const hasClass = (node, name) => node.attribs?.class?.split(' ').includes(name);
try {
  const { default: App } = await server.ssrLoadModule('/src/jsx/App.jsx');
  const nodes = flatten(htmlToDOM(renderToStaticMarkup(createElement(App))));
  assert.equal(nodes.filter(node => hasClass(node, 'ar-publications')).length, 1);
  const cards = nodes.filter(node => hasClass(node, 'ar-pubcard'));
  assert.equal(cards.length, 9);
  assert.equal(new Set(cards.map(node => node.attribs.href)).size, 9);
  const strips = nodes.filter(node => hasClass(node, 'ar-pub-strip'));
  assert.equal(strips.length, 1);
  assert.equal(strips[0].attribs.tabindex, '0');
  const buttons = nodes.filter(node => hasClass(node, 'ar-publications-arrow'));
  assert.equal(buttons.length, 2);
  assert.deepEqual(
    buttons.map(node => node.attribs['aria-label']),
    ['Previous publications', 'Next publications'],
  );
  for (const button of buttons) {
    assert.equal(button.name, 'button');
    assert.equal(button.attribs['aria-controls'], strips[0].attribs.id);
    assert.ok(flatten([button]).some(node => node.name === 'svg' && node.attribs['aria-hidden'] === 'true'));
    assert.ok(!flatten([button]).some(node => node.type === 'text' && node.data.trim()));
  }
  console.log('PASS: one publication strip, nine unique cards and two named icon-only controls.');
} finally {
  await server.close();
}
