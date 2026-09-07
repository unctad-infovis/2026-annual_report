import { spawnSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createProcessor } from '@mdx-js/mdx';
import { Parser } from 'acorn';
import jsx from 'acorn-jsx';

const parser = Parser.extend(jsx());
const quote = value => JSON.stringify(value).replaceAll('<', '\\u003c');

function attributes(properties, source) {
  return properties
    .map(property => {
      if (property.type === 'SpreadElement') return `{...${source.slice(property.argument.start, property.argument.end)}}`;
      const name = property.key.name || property.key.value;
      if (property.computed || property.method || property.kind !== 'init') throw new Error('Unsupported JSX attribute object');
      const value = property.value;
      if (value.type === 'Literal' && typeof value.value === 'string' && !/["&<>\r\n]/.test(value.value)) return `${name}="${value.value}"`;
      if (value.type === 'Literal' && value.value === true) return name;
      return `${name}={${source.slice(value.start, value.end)}}`;
    })
    .join(' ');
}

function simplifySpreads(source) {
  const tree = createProcessor().parse(source);
  const edits = new Map();
  function walk(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'mdxJsxExpressionAttribute') {
      const spread = node.data?.estree?.body?.[0]?.expression?.properties?.[0];
      if (spread?.argument?.type === 'ObjectExpression') {
        edits.set(node.position.start.offset, { end: node.position.end.offset, text: attributes(spread.argument.properties, source) });
        return;
      }
    }
    if (node.type === 'JSXSpreadAttribute' && node.argument.type === 'ObjectExpression') {
      edits.set(node.start, { end: node.end, text: attributes(node.argument.properties, source) });
      return;
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(walk);
      else if (value && typeof value === 'object') walk(value);
    }
  }
  walk(tree);
  for (const [start, edit] of [...edits].sort(([a], [b]) => b - a)) source = source.slice(0, start) + edit.text + source.slice(edit.end);
  return source;
}

export async function formatArticle(source) {
  source = simplifySpreads(source);
  let tree;
  const processor = createProcessor({
    rehypePlugins: [
      () => node => {
        tree = structuredClone(node);
      },
    ],
  });
  await processor.run(processor.parse(source));
  const esm = [];
  function render(node) {
    if (node.type === 'mdxjsEsm') {
      esm.push(node.value);
      return '';
    }
    if (node.type === 'text') return node.value === ' ' ? '{String.fromCharCode(32)}' : `{${quote(node.value)}}`;
    if (node.type === 'mdxFlowExpression' || node.type === 'mdxTextExpression') {
      if (node.data?.estree?.body?.[0]?.expression?.value === ' ') return '{String.fromCharCode(32)}';
      return `{${node.value}}`;
    }
    if (node.type === 'root') return node.children.map(render).join('');
    const name = node.name ?? node.tagName;
    if (!name && node.name !== null) throw new Error(`Unsupported MDX node: ${node.type}`);
    const attrs =
      node.attributes
        ?.map(attribute => {
          if (attribute.type === 'mdxJsxExpressionAttribute') return `{${attribute.value}}`;
          if (attribute.value === null) return attribute.name;
          if (typeof attribute.value === 'string')
            return `${attribute.name}="${attribute.value.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}"`;
          return `${attribute.name}={${attribute.value.value}}`;
        })
        .join(' ') || '';
    if (node.type === 'element' && Object.keys(node.properties || {}).length) throw new Error('Unexpected generated element attributes');
    const open = `<${name || ''}${attrs ? ` ${attrs}` : ''}`;
    if (['img', 'input', 'br', 'hr', 'source', 'meta', 'link', 'area', 'wbr'].includes(name)) return `${open} />`;
    return `${open}>${(node.children || []).map(render).join('')}</${name || ''}>`;
  }
  const body = render(tree);
  const input = `${esm.join('\n\n')}\nconst ArticlePresentation = () => (<>${body}</>);\n`;
  const biome = fileURLToPath(import.meta.resolve('@biomejs/biome/bin/biome'));
  const result = spawnSync(process.execPath, [biome, 'format', '--stdin-file-path=Article.jsx'], {
    input,
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
  });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
  const formatted = result.stdout;
  const program = parser.parse(formatted, { ecmaVersion: 'latest', sourceType: 'module' });
  const declaration = program.body.at(-1);
  const fragment = declaration.declarations[0].init.body;
  let content = formatted.slice(fragment.openingFragment.end, fragment.closingFragment.start);
  content = content.replace(/^ {4}/gm, '').trim();
  // Keep inline spacing explicit, but discard formatting whitespace between block elements.
  content = content.replace(/\{(["'])((?:\\n|\\r|\\t| )+)\1\}/g, (match, _quote, value) => (value.includes('\\n') ? '\n' : match));
  const escapeText = value =>
    value
      .replace(/([\\`*_[\]#!])/g, '\\$1')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('{', '&#123;')
      .replaceAll('}', '&#125;');
  content = content.replace(
    /<([a-z][\w-]*)([^<>]*?)>\s*\{\s*("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')\s*\}\s*<\/\1>/g,
    (_, tag, attrs, literal) => {
      const text = parser.parseExpressionAt(literal, 0, { ecmaVersion: 'latest' }).value;
      return `<${tag}${attrs}>${escapeText(text.replace(/[\t\r\n ]+/g, ' '))}</${tag}>`;
    },
  );
  content = content.replace(/\b([\w:-]+)=\{("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')\}/g, (_, name, literal) => {
    const value = parser.parseExpressionAt(literal, 0, { ecmaVersion: 'latest' }).value;
    return `${name}="${value.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}"`;
  });
  content = content.replace(/<([A-Za-z][\w.]*)((?:\s[^<>]*?)?)><\/\1>/g, '<$1$2 />');
  content = content.replace(/\n[ \t]*\n/g, '\n');
  content = content.replace(/\n[ \t]*\n(?:[ \t]*\n)+/g, '\n\n');
  const statements = program.body.slice(0, -1);
  const imports = statements.filter(node => node.type === 'ImportDeclaration');
  const exports = statements.filter(node => node.type !== 'ImportDeclaration');
  const header = [...imports, ...exports].map(node => formatted.slice(node.start, node.end)).join('\n\n');
  const output = `${header}\n\n${content.trim()}\n`;
  const spacedOutput = output.replaceAll('{String.fromCharCode(32)}', "{' '}");
  const validator = createProcessor();
  await validator.run(validator.parse(spacedOutput));
  return spacedOutput;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const file = new URL('../src/Article.mdx', import.meta.url);
  await writeFile(file, await formatArticle(await readFile(file, 'utf8')));
}
