import { readFile, readdir, stat } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const dist = join(root, 'dist');
const publicOutput = join(dist, 'client');
const astroConfig = await readFile(join(root, 'astro.config.mjs'), 'utf8');
const siteMatch = astroConfig.match(/\bsite\s*:\s*['"](https:\/\/[^'"]+)['"]/);
if (!siteMatch) throw new Error('Cannot read the Astro site setting.');
const origin = new URL(siteMatch[1]).origin;
const failures = [];
const sitemapFiles = [];
const forbidden = [
  ['placeholder domain', new RegExp('example' + '\\.com', 'i')],
  ['local development host', new RegExp('local' + 'host', 'i')],
  ['browser-extension protocol', new RegExp('chrome' + '-extension:' + '\\/\\/', 'i')],
];
const scanExtensions = new Set(['.css', '.html', '.js', '.json', '.map', '.txt', '.xml']);

async function walk(directory) {
  for (const entry of await readdir(directory)) {
    const path = join(directory, entry);
    const info = await stat(path);
    if (info.isDirectory()) {
      await walk(path);
      continue;
    }
    if (/^sitemap.*\.xml$/i.test(entry)) sitemapFiles.push(path);
    if (!scanExtensions.has(extname(entry))) continue;
    const text = await readFile(path, 'utf8');
    for (const [label, pattern] of forbidden) {
      if (pattern.test(text)) failures.push(`${label} found in ${path.slice(root.length + 1)}`);
    }
  }
}

try {
  await walk(publicOutput);
} catch (error) {
  if (error?.code === 'ENOENT') {
    console.error('Build audit failed: dist/client does not exist. Run pnpm build first.');
    process.exit(1);
  }
  throw error;
}

if (!sitemapFiles.length) failures.push('No generated sitemap XML was found.');
for (const sitemapPath of sitemapFiles) {
  const xml = await readFile(sitemapPath, 'utf8');
  if (/<lastmod\b/i.test(xml)) failures.push(`Unexpected lastmod in ${sitemapPath.slice(root.length + 1)}`);
  for (const [, loc] of xml.matchAll(/<loc>([^<]+)<\/loc>/gi)) {
    let url;
    try { url = new URL(loc); } catch { failures.push(`Invalid sitemap URL: ${loc}`); continue; }
    if (url.origin !== origin) failures.push(`Sitemap URL uses the wrong origin: ${loc}`);
  }
}

if (failures.length) {
  console.error('Build audit failed:');
  for (const item of failures) console.error(`- ${item}`);
  process.exit(1);
}
console.log(`Build audit passed. ${sitemapFiles.length} sitemap file(s) use ${origin} and contain no lastmod.`);
