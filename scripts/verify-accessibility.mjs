import assert from 'node:assert/strict';
import { htmlToDOM } from 'html-react-parser';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

globalThis.window = { location: { hostname: 'localhost', href: 'http://localhost:8080/' } };
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
const flatten = nodes => nodes.flatMap(node => [node, ...flatten(node.children || [])]);
const hasClass = (node, cls) => node.attribs?.class?.split(' ').includes(cls);
const text = node => (node.type === 'text' ? node.data : (node.children || []).map(text).join(''));
try {
  const { default: App } = await server.ssrLoadModule('/src/jsx/App.jsx');
  const nodes = flatten(htmlToDOM(renderToStaticMarkup(createElement(App))));
  const byId = id => nodes.find(node => node.attribs?.id === id);
  const ids = nodes.filter(node => node.attribs?.id).map(node => node.attribs.id);
  assert.equal(new Set(ids).size, ids.length, 'IDs must be unique');
  assert.ok(nodes.find(node => hasClass(node, 'ar-skip-link')).attribs.href === '#ar-main');
  assert.equal(byId('ar-main').attribs.tabindex, '-1');
  const statisticCards = flatten([byId('glance')]).filter(node => hasClass(node, 'ar-gt'));
  assert.equal(statisticCards.length, 8);
  statisticCards.forEach(node => {
    assert.equal(node.attribs.tabindex, '0');
    assert.equal(node.attribs.role, 'group');
    assert.ok(node.attribs['aria-label']);
  });
  const allYear = nodes.find(node => hasClass(node, 'ar-m-a-item') && text(node).includes('ALL YEAR'));
  assert.equal(allYear.attribs.tabindex, '0');
  assert.ok(text(byId(allYear.attribs['aria-labelledby'])).includes('Rapid response'));
  assert.equal(byId('glance').attribs['aria-labelledby'], 'ar-glance-title');
  assert.equal(text(byId('ar-glance-title')), 'UNCTAD 2025 in numbers');
  nodes
    .filter(node => /^h[1-6]$/.test(node.name || ''))
    .forEach(node => {
      assert.ok(text(node).trim(), `Heading ${node.attribs?.id || node.name} must not be empty`);
    });
  assert.equal(text(byId('project-map-title')), 'Projects around the world');
  nodes
    .filter(node => node.name === 'img')
    .forEach(node => {
      assert.ok(Object.hasOwn(node.attribs, 'alt'));
    });
  nodes
    .filter(node => node.name === 'button')
    .forEach(node => {
      const label =
        node.attribs['aria-label'] ||
        node.attribs['aria-labelledby']
          ?.split(' ')
          .map(id => text(byId(id)))
          .join(' ') ||
        text(node);
      assert.ok(label.trim(), 'Buttons need an accessible name');
      if (node.attribs['aria-controls']) assert.ok(byId(node.attribs['aria-controls']));
    });
  const donors = nodes.filter(node => hasClass(node, 'ar-dn-leg'));
  assert.equal(donors.length, 4);
  donors.forEach(node => {
    assert.equal(node.name, 'button');
  });
  assert.equal(byId('dnCenter').attribs['aria-live'], 'polite');
  assert.equal(byId('tcMapSvg'), undefined);
  assert.equal(byId('project-country-search').attribs.role, 'combobox');
  assert.equal(nodes.filter(node => hasClass(node, 'ar-project-map')).length, 1);
  const counters = nodes.filter(node => hasClass(node, 'ar-cnt'));
  assert.ok(counters.length > 0, 'Expected at least one rolling-number element');
  counters.forEach(node => {
    assert.equal(node.attribs['aria-hidden'], 'true');
    const siblings = node.parent.children.filter(child => child.type !== 'text');
    const final = siblings[siblings.indexOf(node) + 1];
    assert.ok(hasClass(final, 'ar-sr-only'));
    assert.equal(Number(text(final).replaceAll(',', '').trim()), Number(node.attribs['data-to']));
  });
  console.log('PASS: names, unique IDs, skip target, donor controls, map/search semantics and stable accessible counter values.');
} finally {
  await server.close();
}
