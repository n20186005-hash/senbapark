# 検証状況

## 実行できた検査

- `node scripts/audit-source.mjs`：合格
  - 依存関係・Node.js・pnpm の版が完全固定されていること
  - 公開 URL が `astro.config.mjs` の `site` 一か所だけにあること
  - 不正な外部スクリプト、プレースホルダー URL、ブラウザー拡張機能用プロトコル がないこと
  - 必須のローカル写真が存在すること
- JavaScript / TypeScript 構文監査：合格
  - Astro の frontmatter とクライアントスクリプトを抽出して構文解析
- `node --check`：設定ファイルと監査スクリプトで合格

## 現在の未完了項目

この実行環境では `registry.npmjs.org` の名前解決が失敗し、固定済みの pnpm 11.18.0 を Corepack が取得できませんでした。そのため、次の項目は実行できていません。

- 正規の `pnpm-lock.yaml` の生成
- `CI=1 corepack pnpm install --frozen-lockfile`
- `pnpm check`
- `pnpm build`
- `dist`、生成 sitemap、`lastmod`、生成 URL の監査

偽の lockfile や未検証のビルド結果を含めないため、`pnpm-lock.yaml` は意図的に作成していません。ネットワーク接続可能な Node.js 24.18.1 環境で、固定済み pnpm 11.18.0 を使って lockfile を生成し、`pnpm verify:clean` がすべて成功してから公開してください。
