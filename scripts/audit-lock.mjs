import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const packageJson = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
let lock;

try {
  lock = await readFile(join(root, 'pnpm-lock.yaml'), 'utf8');
} catch (error) {
  if (error?.code === 'ENOENT') {
    console.error('Lockfile audit failed: pnpm-lock.yaml is missing. Generate it with the pinned pnpm version and commit it before release.');
    process.exit(1);
  }
  throw error;
}

const failures = [];
if (!/^lockfileVersion:\s*['"]?\d+(?:\.\d+)?['"]?\s*$/m.test(lock)) {
  failures.push('pnpm-lock.yaml has no valid lockfileVersion.');
}
if (!/^importers:\s*$/m.test(lock) || !/^\s{2}\.\:\s*$/m.test(lock)) {
  failures.push("pnpm-lock.yaml must contain the root importer '.'.");
}

for (const section of ['dependencies', 'devDependencies']) {
  for (const [name, version] of Object.entries(packageJson[section] ?? {})) {
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedVersion = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const packagePattern = new RegExp(`(?:^|\\n)\\s{6}["']?${escapedName}["']?:\\s*\\n(?:[\\s\\S]{0,260}?)\\s{8}specifier:\\s*["']?${escapedVersion}["']?\\s*(?:\\n|$)`);
    if (!packagePattern.test(lock)) failures.push(`Root importer does not pin ${name} to ${version}.`);
  }
}

if (failures.length) {
  console.error('Lockfile audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Lockfile audit passed. Root importer matches package.json exact versions.');
