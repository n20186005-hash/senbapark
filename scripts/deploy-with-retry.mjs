// 带重试的 Cloudflare Workers 部署脚本。
// 用于规避 Cloudflare 控制 API 偶发 521/522/502 错误导致整条 CI 直接失败。
// 用法: node scripts/deploy-with-retry.mjs
import { spawnSync } from 'node:child_process';

const MAX_ATTEMPTS = 5;
const BASE_DELAY_MS = 15_000; // 首次退避 15s，指数增长

// 这些退出/网络错误属于可重试的瞬时故障，不应判定为代码问题。
const RETRYABLE_PATTERNS = [
  /521/,
  /522/,
  /502/,
  /503/,
  /504/,
  /malformed response/i,
  /Failed to connect/i,
  /ETIMEDOUT/,
  /ECONNRESET/,
  /network/i,
];

function isRetryable(output) {
  return RETRYABLE_PATTERNS.some((re) => re.test(output));
}

let attempt = 0;
while (attempt < MAX_ATTEMPTS) {
  attempt += 1;
  console.log(`\n=== wrangler deploy 尝试 ${attempt}/${MAX_ATTEMPTS} ===`);

  // --force 绕过 "validate Worker name" 这一步（正是 521 打挂的位置）。
  // 本地强制推送对静态站点安全；如需保留校验可去掉该参数。
  const result = spawnSync('npx', ['wrangler', 'deploy', '--force'], {
    stdio: 'inherit',
    // 让 wrangler 的彩色输出与子进程信号正常透传
    shell: process.platform === 'win32',
  });

  const out = (result.stdout?.toString() ?? '') + (result.stderr?.toString() ?? '');

  if (result.status === 0) {
    console.log(`\n✓ 部署成功（第 ${attempt} 次尝试）`);
    process.exit(0);
  }

  if (!isRetryable(out)) {
    console.error(`\n✘ 部署失败且错误不可重试，终止重试。`);
    process.exit(result.status ?? 1);
  }

  if (attempt < MAX_ATTEMPTS) {
    const delay = BASE_DELAY_MS * 2 ** (attempt - 1);
    console.warn(`⚠ 检测到 Cloudflare API 瞬时错误（521/522/502 等），${delay / 1000}s 后重试...`);
    await new Promise((r) => setTimeout(r, delay));
  }
}

console.error(`\n✘ 已重试 ${MAX_ATTEMPTS} 次仍失败，放弃部署。`);
process.exit(1);
