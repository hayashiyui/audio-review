# Astro サイト実装ガイド（本プロジェクト版）  
## **高速・拡張自在**なオーディオレビューサイトの整備手順  
（2025‑09‑13 時点 / Astro v5 系）

---

## 0. 概要（このリポジトリの実態）

- **スタック**: Astro v5 + MDX + React Islands + Tailwind CSS v4  
- **検索**: Pagefind（`postbuild` でインデックス生成、`SearchModal.astro` でUI）  
- **記事管理**: Content Collections（`reviews`, `columns`）+ MDX  
- **画像**: `src/assets/images/{hero,contents}` を使用（静的配布物は `public/`）  
- **デプロイ**: 静的出力想定（任意で Cloudflare Pages 等に配置）  
- **備考**: オーディオプレーヤー無し／`audioSample` 等の特殊メタ不要

---

## 1. 前提環境

| ツール | バージョン |
|-------|-----------|
| Node.js | 20 LTS |
| pnpm   | 9 以上 |
| Git    | GitHub / GitLab いずれか |
| Pagefind | 1.4 系（dev では不要、build 後に使用） |

---

## 2. セットアップ / 開発

```bash
pnpm i
pnpm dev   # http://localhost:1234 （astro.config.ts の設定）
```

- 検索（Pagefind）のインデックスは dev 中は生成されません。検証は以下で行います：

```bash
pnpm build     # astro check → astro build → （postbuild で pagefind 実行）
pnpm preview   # http://localhost:4321 で静的出力を確認
```

---

## 3. ディレクトリ構成（本プロジェクト）

```
audio-review/
├─ src/
│  ├─ pages/                        # トップ/一覧/詳細/タグ/著者など
│  ├─ components/                   # 再利用 UI（SearchModal ほか）
│  ├─ content/                      # MD/MDX コンテンツ
│  │  ├─ reviews/                   # レビュー記事（多数）
│  │  └─ columns/                   # コラム記事
│  ├─ assets/
│  │  └─ images/{hero,contents}/    # 記事用画像（Astro アセット経由）
│  ├─ lib/                          # ヘルパ・定数
│  └─ content.config.ts             # Content Collections スキーマ
├─ public/                           # 静的アセット（favicons, 配布用画像等）
├─ scripts/                          # メンテスクリプト（optimize-images.js）
├─ doc/                              # ドキュメント
└─ astro.config.ts                   # サイト設定（port=1234, sitemap 等）
```

---

## 4. `src/content.config.ts` の実スキーマ（抜粋）

```ts
import { glob } from 'astro/loaders'
import { defineCollection, z } from 'astro:content'

const reviews = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/reviews' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      updatedAt: z.coerce.date().optional(),
      brand: z.string().optional(),
      model: z.string().optional(),
      category: z
        .enum(['スピーカー','ヘッドホン','イヤホン','デジタルプレーヤー','DAC','パワーアンプ','プリアンプ','プリメインアンプ','ヘッドホンアンプ','アナログ','ケーブル','アクセサリ'])
        .optional(),
      tags: z.array(z.string()).optional(),
      heroImage: image().optional(),
      draft: z.boolean().optional().default(false),
      relatedArticles: z.array(z.object({ collection: z.enum(['reviews','columns']), id: z.string() })).optional(),
    }),
})

const columns = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/columns' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      updatedAt: z.coerce.date().optional(),
      category: z.enum(['オーディオ基礎知識','セットアップ','音質改善','業界動向','技術解説','エッセイ','購入ガイド','その他']).optional(),
      tags: z.array(z.string()).optional(),
      heroImage: image().optional(),
      draft: z.boolean().optional().default(false),
      relatedArticles: z.array(z.object({ collection: z.enum(['reviews','columns']), id: z.string() })).optional(),
    }),
})

export const collections = { reviews, columns }
```

---

## 5. 記事作成（reviews / columns）

1. **場所**: `src/content/reviews/` または `src/content/columns/`
2. **拡張子**: `.mdx` 推奨（コンポーネント利用のため）
3. **ファイル名**: URL スラッグ（必要なら front‑matter の `slug:` で上書き）

### フロントマター例（reviews）

```mdx
---
title: "Sennheiser HD 800 S レビュー：リファレンス級アイコンの再検証"
description: "包括的レビュー：空間表現と明瞭性、その長所と課題を検証"
date: "2025-08-31T18:00:00+09:00"
brand: "Sennheiser"
model: "HD 800 S"
category: "ヘッドホン"
tags: ["Sennheiser","ダイナミック型"]
heroImage: "@assets/images/hero/sennheiser-hd800s.jpg"
relatedArticles:
  - collection: reviews
    id: yamaha-yh5000se
  - collection: columns
    id: sound-quality-evaluation-guide
draft: false
---
本文は **MDX**。`ImageWithCitation` や `RelatedArticlesGrid` 等のコンポーネントを併用できます。
```

### フロントマター例（columns）

```mdx
---
title: "音質評価ガイド — クリティカルリスニングの技術"
description: "測定では捉えにくい差異の読み解きと用語の整理"
date: "2025-08-05T09:00:00"
category: "オーディオ基礎知識"
tags: ["音質評価"]
heroImage: "@assets/images/hero/default.jpg"
draft: false
---
```

---

## 6. 画像 & アセット管理

| 用途          | 置き場所                                      | 記述例                                                  |
| ----------- | ----------------------------------------- | ----------------------------------------------------- |
| hero 画像     | `src/assets/images/hero/...`               | `heroImage: "@assets/images/hero/xxx.jpg"`      |
| 記事内図版       | `src/assets/images/contents/...` または記事近傍 | `![図版](@assets/images/contents/graph.png)`     |
| 公開用DL/固定物   | `public/files/...`, `public/images/...`      | `<a href="/files/spec.pdf">ダウンロード</a>`         |

メモ：`src/assets` 配下は Astro のアセット最適化の対象です。配布前処理が必要な場合は `scripts/optimize-images.js` を利用して `public/` に出力してください。

---

## 7. UI/スタイル（本プロジェクトの前提）

- **Tailwind CSS v4**（Vite プラグイン経由）
- **Radix UI** + `lucide-react`（必要に応じて React 島で利用）
- **astro-expressive-code**（コードブロック装飾・見出しID等）
- **アイコン**: `astro-icon`

必要に応じて `src/components/` の既存 UI（`ReviewsCard.astro`, `RelatedArticlesGrid.astro`, `SearchModal.astro` など）を再利用してください。

---

## 8. 検索（Pagefind）

- 依存: `devDependencies` に `pagefind@^1.4.0`
- `package.json` の `postbuild` でインデックス生成（本リポジトリ既定）
  - 例: `pagefind --site dist --force-language ja --exclude-selectors "pre, code, .expressive-code, .ec-line, script, style, .pagefind-exclude"`
- 詳細は `doc/search-setup.md` を参照（`Ctrl/⌘+K` で `SearchModal` 起動）

---

## 9. ビルド & デプロイ

- ビルド: `pnpm build`（`astro check` 実行後に静的出力 → Pagefind）
- プレビュー: `pnpm preview`
- ホスティング: 任意の静的ホスティング（Cloudflare Pages 等）。
  - Cloudflare Pages の場合: Build command `pnpm run build`, Output `dist`。
  - 環境変数: `NODE_VERSION = 20` を推奨。

---

## 10. 運用のヒント

| 項目        | ツール例                                     |
| --------- | ---------------------------------------- |
| 自動デプロイ    | push → CI/Pages 等で再ビルド                     |
| 画像最適化     | `scripts/optimize-images.js`（必要時）         |
| コメント      | （未導入）必要なら Giscus / Utterances         |
| パフォーマンス計測 | Cloudflare Web Analytics + Lighthouse CI |

---

## 11. よくある質問

| Q                        | A                                                                  |
| ------------------------ | ------------------------------------------------------------------ |
| **記事を下書きにするには？**       | front‑matter に `draft: true`。ビルド時自動除外                              |
| **日本語ファイル名は？**         | URL がエンコードされるため推奨しない                                             |
| **タグ／カテゴリページの作成**      | `src/pages/tags/...` に実装済み。`getCollection('reviews')` 等でフィルタ         |
| **MDX で別フレームワークは？**    | 本プロジェクトは React 島前提。Svelte/Vue は未統合。                           |

---

## 12. まとめ

1. 依存をインストールし、`pnpm dev`（port 1234）で開発
2. 記事は `src/content/{reviews,columns}/**/*.mdx` に追加（スキーマ準拠）
3. 画像は `src/assets/images/{hero,contents}` を利用
4. `pnpm build && pnpm preview` で検索含め最終確認 → デプロイ

これで **軽量・高速・型安全** なオーディオレビューサイトの運用土台が整います。🎧

