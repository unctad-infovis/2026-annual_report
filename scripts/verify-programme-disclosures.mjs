import assert from 'node:assert/strict';
import { htmlToDOM } from 'html-react-parser';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

globalThis.window = { location: { hostname: 'localhost', href: 'http://localhost:8080/' } };
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
const hasClass = (node, name) => node.attribs?.class?.split(' ').includes(name);
const descendants = nodes => nodes.flatMap(node => [node, ...descendants(node.children || [])]);
const textContent = node => (node.type === 'text' ? node.data : (node.children || []).map(textContent).join(''));
try {
  const { default: App } = await server.ssrLoadModule('/src/jsx/App.jsx');
  const nodes = descendants(htmlToDOM(renderToStaticMarkup(createElement(App))));
  const cards = nodes.filter(node => hasClass(node, 'ar-flag'));
  assert.equal(cards.length, 3);
  const names = ['ASYCUDA Customs automation', 'DMFAS Debt management', 'EMPRETEC Entrepreneurship'];
  cards.forEach((card, index) => {
    const children = descendants(card.children || []);
    const controls = children.filter(node => node.name === 'button');
    assert.equal(controls.length, 1);
    const [trigger] = controls;
    assert.equal(trigger.attribs.type, 'button');
    assert.equal(trigger.attribs['aria-expanded'], 'false');
    const target = nodes.filter(node => node.attribs?.id === trigger.attribs['aria-controls']);
    assert.equal(target.length, 1);
    const [details] = target;
    assert.equal(details.parent, card);
    assert.equal(details.attribs['aria-hidden'], 'true');
    assert.ok(Object.hasOwn(details.attribs, 'inert'));
    const label = trigger.attribs['aria-labelledby']
      .split(' ')
      .map(id => {
        const matches = nodes.filter(node => node.attribs?.id === id);
        assert.equal(matches.length, 1);
        return textContent(matches[0]).trim();
      })
      .join(' ');
    assert.equal(label, names[index]);
    assert.equal(children.find(node => hasClass(node, 'ar-ftag')).parent, card);
    assert.equal(children.find(node => hasClass(node, 'ar-fcue')).attribs['aria-hidden'], 'true');
  });
  console.log(
    'PASS: three native disclosure controls, concise labels, unique panel links, collapsed visibility and sibling detail panels.',
  );
} finally {
  await server.close();
}
