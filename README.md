# 千波公園・千波湖ガイド

Astro、Tailwind CSS、TypeScript で構築し、Cloudflare Workers へ配備する単一ページの観光ガイドです。データベース、ログイン、CMS は使用しません。

## 動作環境

- Node.js 22.12.0以上（`.node-version` では24.18.1を推奨）
- pnpm 11.18.0
- Astro 7.1.6
- TypeScript 6.0.3

Node.js の最低対応版は `engines`、推奨版は `.node-version` で管理し、pnpm は `engines` と `packageManager` で固定しています。

> **検証上の注意:** 現在の成果物は、作業環境の npm レジストリ接続障害により正規の `pnpm-lock.yaml` を生成できていません。未検証の lockfile は同梱していません。公開前に `VERIFICATION.md` の手順と状態を確認してください。

## 開発

```bash
corepack enable
CI=1 corepack pnpm install --frozen-lockfile
pnpm dev
```

## 検査とビルド

```bash
pnpm audit:lock
pnpm audit:source
pnpm check
pnpm build
pnpm audit:build
```

クリーン環境で一括確認する場合は、次を実行します。

```bash
pnpm verify:clean
```

## Cloudflare Workers へ配備

```bash
pnpm deploy
```

`wrangler.jsonc` は Astro Cloudflare アダプターの Worker 出力、静的アセットの `ASSETS` バインディング、Node.js 互換フラグを明示しています。初回は Wrangler の案内に従って Cloudflare へログインしてください。

## URL の設定

公開 URL は `astro.config.mjs` の `site` 一か所だけで管理します。canonical、Open Graph、JSON-LD、robots.txt、sitemap はこの値から派生します。

## 端末内機能

- 行程リストは `localStorage` にのみ保存します。
- 記念カードの写真と文字は Canvas で端末内処理し、サーバーへ送信しません。

## 写真

公開画像は千波湖・千波公園の実写をローカル保存したものです。素材と CC0 1.0 の確認先は `PHOTO_SOURCES.md` に記録しています。
