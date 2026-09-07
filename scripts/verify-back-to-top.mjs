import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
globalThis.window = { location: { hostname: 'localhost', href: 'http://localhost:8080/' } };
try {
  const { default: App } = await server.ssrLoadModule('/src/jsx/App.jsx');
  const markup = renderToStaticMarkup(createElement(App));
  assert.equal((markup.match(/aria-label="Back to top"/g) || []).length, 1);
  assert.ok(markup.includes('container_back_to_top'));
  assert.ok(!markup.includes('id="toTop"'));
  const { default: BackToTop } = await server.ssrLoadModule('@unctad-infovis/general-tools/components/BackToTop.jsx');
  for (const reduced of [false, true]) {
    let selected;
    let scrollOptions;
    window.matchMedia = () => ({ matches: reduced });
    window.appRef = {
      current: {
        querySelector: selector => {
          selected = selector;
          return {
            scrollIntoView: options => {
              scrollOptions = options;
            },
          };
        },
      },
    };
    const element = BackToTop({ selector: '.ar-hero' });
    element.props.children.props.onClick();
    assert.equal(selected, '.ar-hero');
    assert.deepEqual(scrollOptions, { behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  }
  console.log('PASS: one shared button; hero targeting and reduced-motion click behavior verified.');
} finally {
  await server.close();
}
