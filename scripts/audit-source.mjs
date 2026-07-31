import { readFile, readdir, stat } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const packagePath = join(root, 'package.json');
const astroConfigPath = join(root, 'astro.config.mjs');
const packageJson = JSON.parse(await readFile(packagePath, 'utf8'));
const astroConfig = await readFile(astroConfigPath, 'utf8');
const failures = [];

const fail = (message) => failures.push(message);
const exactVersion = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const minimumVersion = /^>=(\d+)\.(\d+)\.(\d+)$/;
const packageManagerPattern = /^pnpm@\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const forbidden = [
  ['placeholder domain', new RegExp('example' + '\\.com', 'i')],
  ['local development host', new RegExp('local' + 'host', 'i')],
  ['browser-extension protocol', new RegExp('chrome' + '-extension:' + '\\/\\/', 'i')],
];

if (!packageManagerPattern.test(packageJson.packageManager ?? '')) {
  fail('packageManager must pin a complete pnpm version.');
}
if (!minimumVersion.test(packageJson.engines?.node ?? '')) {
  fail('engines.node must declare a complete minimum version.');
}
if (!exactVersion.test(packageJson.engines?.pnpm ?? '')) fail('engines.pnpm must be an exact version.');
if (`pnpm@${packageJson.engines?.pnpm}` !== packageJson.packageManager) {
  fail('engines.pnpm and packageManager must match.');
}
for (const section of ['dependencies', 'devDependencies']) {
  for (const [name, version] of Object.entries(packageJson[section] ?? {})) {
    if (!exactVersion.test(version)) fail(`${section}.${name} is not pinned exactly: ${version}`);
  }
}

const nodeVersion = (await readFile(join(root, '.node-version'), 'utf8')).trim();
const pinnedNode = nodeVersion.match(/^(\d+)\.(\d+)\.(\d+)$/);
const minimumNode = packageJson.engines?.node?.match(minimumVersion);
if (!pinnedNode) {
  fail('.node-version must pin a complete Node.js version.');
} else if (minimumNode) {
  const pinned = pinnedNode.slice(1).map(Number);
  const minimum = minimumNode.slice(1).map(Number);
  const satisfiesMinimum = pinned.some((part, index) =>
    part > minimum[index] && pinned.slice(0, index).every((value, prefixIndex) => value === minimum[prefixIndex])
  ) || pinned.every((part, index) => part === minimum[index]);
  if (!satisfiesMinimum) fail('.node-version must satisfy engines.node.');
}

const siteMatches = [...astroConfig.matchAll(/\bsite\s*:\s*['"](https:\/\/[^'"]+)['"]/g)];
if (siteMatches.length !== 1) fail('astro.config.mjs must contain exactly one HTTPS site setting.');
const configuredSite = siteMatches[0]?.[1];
if (configuredSite && forbidden.slice(0, 2).some(([, pattern]) => pattern.test(configuredSite))) fail('Configured site is a placeholder.');

const workspacePath = join(root, 'pnpm-workspace.yaml');
try {
  const workspace = await readFile(workspacePath, 'utf8');
  if (!/^packages:\s*\n(?:\s*-\s*['"]?\.['"]?\s*$)/m.test(workspace)) {
    fail("pnpm-workspace.yaml exists but does not include packages: ['.'].");
  }
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}

const ignoredDirectories = new Set(['.git', '.astro', 'dist', 'node_modules']);
const ignoredFiles = new Set(['pnpm-lock.yaml']);
const textExtensions = new Set(['.astro', '.css', '.js', '.json', '.jsonc', '.md', '.mjs', '.svg', '.ts', '.txt', '.yaml', '.yml']);
const externalScripts = [];
const configuredDomainOccurrences = [];

async function walk(directory) {
  for (const entry of await readdir(directory)) {
    if (ignoredDirectories.has(entry)) continue;
    const path = join(directory, entry);
    const info = await stat(path);
    if (info.isDirectory()) {
      await walk(path);
      continue;
    }
    if (ignoredFiles.has(entry) || !textExtensions.has(extname(entry))) continue;
    const rel = relative(root, path);
    const text = await readFile(path, 'utf8');
    for (const [label, pattern] of forbidden) {
      if (pattern.test(text)) fail(`${label} found in ${rel}`);
    }
    for (const match of text.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)) {
      externalScripts.push({ file: rel, src: match[1] });
    }
    if (configuredSite) {
      const host = new URL(configuredSite).host;
      if (text.includes(host)) configuredDomainOccurrences.push(rel);
    }
  }
}
await walk(root);

for (const script of externalScripts) {
  if (!/^https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-HXM22WWPKP$/.test(script.src)) {
    fail(`Unapproved external script in ${script.file}: ${script.src}`);
  }
}
if (externalScripts.length !== 1) fail(`Expected exactly one external GA4 script, found ${externalScripts.length}.`);
if (configuredDomainOccurrences.length !== 1 || configuredDomainOccurrences[0] !== 'astro.config.mjs') {
  fail(`Configured domain must occur only in astro.config.mjs; found in: ${configuredDomainOccurrences.join(', ') || '(none)'}`);
}

const requiredImages = ['senba-hero.webp', 'senba-sakura.webp', 'senba-sunset.webp', 'senba-walk.webp'];
for (const filename of requiredImages) {
  try {
    const image = await stat(join(root, 'public', 'images', filename));
    if (!image.isFile() || image.size < 10_000) fail(`Image is missing or unexpectedly small: ${filename}`);
  } catch {
    fail(`Required local image is missing: ${filename}`);
  }
}

if (failures.length) {
  console.error('Source audit failed:');
  for (const item of failures) console.error(`- ${item}`);
  process.exit(1);
}
console.log(`Source audit passed. Site origin: ${configuredSite}`);
