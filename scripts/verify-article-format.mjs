import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { evaluate } from '@mdx-js/mdx';
import { createElement } from 'react';
import * as runtime from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';
import { formatArticle } from './format-article.mjs';

const cases = [
  '<p>Hello <strong>world</strong>{" "}again.</p>',
  '<div><span>A</span>{" "}<span>B</span></div>',
  '<a {...{href:"https://example.org/?a=1&b=2",className:"link"}}><svg /><span>Icon</span>{"\\nExplore more videos"}</a>',
  '<p>{"A & B < C {value} *test* _data_ [note]"}</p>',
];
const render = async source =>
  renderToStaticMarkup(createElement((await evaluate(source, runtime)).default))
    .replace(/>\n+</g, '><')
    .trim();
for (const sample of cases) assert.equal(await render(await formatArticle(sample)), await render(sample));
const article = await readFile(new URL('../src/Article.mdx', import.meta.url), 'utf8');
assert.equal(await formatArticle(article), article);
console.log('PASS: inline spacing, leading-newline text, escaped characters, attributes and repeat formatting.');
