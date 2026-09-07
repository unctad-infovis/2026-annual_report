import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import postcss from 'postcss';

const read = file => readFile(new URL(`../${file}`, import.meta.url), 'utf8');
const [demo, builtDemo, html, motion] = await Promise.all(
  ['public/demo.css', 'dist/demo.css', 'dist/index.html', 'src/styles/foundations/ReducedMotion.css'].map(read),
);
const styleManifest = await read('src/styles/index.css');
const reportSourceStyles = await Promise.all(
  [...styleManifest.matchAll(/@import ['"](.+?)['"]/g)].map(([, source]) => read(`src/styles/${source.replace('./', '')}`)),
);
postcss.parse(reportSourceStyles.join('\n')).walkRules(rule => {
  if (rule.selector.includes('html')) {
    rule.walkDecls('scroll-behavior', () => assert.fail('Page-level scrolling leaked into report CSS'));
  }
});
assert.equal(builtDemo, demo);
assert.match(demo, /scroll-behavior: smooth/);
assert.match(demo, /prefers-reduced-motion: reduce/);
assert.match(demo, /scroll-behavior: auto/);
assert.ok(html.includes('href="./demo.css"'));
assert.ok(motion.includes('#app-root-2026-annual_report .annual-report-app div.container_back_to_top'));
assert.ok(!motion.includes('.app div.container_back_to_top'));
postcss.parse(reportSourceStyles.join('\n')).walkRules(rule => {
  assert.ok(
    (rule.parent?.type === 'atrule' && /keyframes$/i.test(rule.parent.name)) ||
      rule.selectors.every(selector => selector.startsWith('#app-root-2026-annual_report ')),
    `Unscoped report selector: ${rule.selector}`,
  );
});
console.log('PASS: demo scrolling CSS is separate and every report selector is scoped to the unique embed root.');
