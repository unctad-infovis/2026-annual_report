import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const dist = path.resolve('dist');
const indexPath = path.join(dist, 'index.html');

const html = await readFile(indexPath, 'utf8');

await writeFile(indexPath, html.replaceAll('href="/', 'href="./').replaceAll('src="/', 'src="./'));
