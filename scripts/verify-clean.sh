#!/usr/bin/env bash
set -euo pipefail

rm -rf node_modules dist .astro
CI=1 corepack pnpm install --frozen-lockfile
pnpm audit:lock
pnpm audit:source
pnpm check
pnpm build
pnpm audit:build
