# Astro × Cloudflare Pages  
## **シンプルでカスタマイズ最強**なオーディオ系ブログ構築手順書  
（2025‑07‑22 時点 / Astro v5 系）

---

## 0. 概要

- **テンプレート**: [astro‑erudite] — 余計な装飾ゼロ、Tailwind 4・shadcn/ui 同梱  
- **デプロイ**: Cloudflare Pages（静的出力 or SSR/ODR どちらも可）  
- **オーディオプレーヤーなし**／`audioSample` メタデータ不要  
- **記事管理**: Content Collections + MDX

---

## 1. 前提環境

| ツール | バージョン |
|-------|-----------|
| Node.js | 20 LTS |
| pnpm   | 9 以上 |
| Git    | GitHub / GitLab いずれか |
| Cloudflare アカウント | Pages 有効化済み |

---

## 2. プロジェクト作成

```bash
pnpm create astro -- --template jktrn/astro-erudite
cd astro-erudite
pnpm dev        # http://localhost:4321
````

---

## 3. ディレクトリ構成

```
your-project/
├─ src/
│  ├─ content/
│  │  ├─ posts/               # ★記事ファイル (md/mdx)
│  │  └─ content.config.ts    # ★スキーマ
│  └─ pages/                  # 一覧・個別ページ
└─ public/
   └─ images/                 # heroImage 等の静的アセット
```

---

## 4. `content.config.ts` ― スキーマ例

```ts
import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  schema: z.object({
    title: z.string(),
    date: z.date(),
    brand: z.string().optional(),
    model: z.string().optional(),
    category: z.enum(['スピーカー','ヘッドホン','デジタルプレーヤー','DAC','パワーアンプ','プリアンプ','プリメインアンプ','アナログ','ケーブル','アクセサリ']).optional(),
    tags: z.array(z.string()).optional(),
    heroImage: z.string().optional(),
  }),
});

export const collections = { posts };
```

---

## 5. 記事ファイルの作り方

1. **場所** `src/content/posts/` （サブフォルダ自由）
2. **拡張子** `.md` または `.mdx`
3. **ファイル名** = URL スラッグ（変えたい場合は `slug:` を front‑matter へ）

### フロントマター完全サンプル

```mdx
---
title: "Sennheiser HD‑600 レビュー"
date: 2025-07-15
brand: "Sennheiser"
model: "HD‑600"
category: "ヘッドホン"
tags: ["開放型","定番"]
heroImage: "/images/hd600.jpg"
draft: false        # 下書きは true
---
本文を **Markdown** で執筆。  
<CustomComponent /> を使いたいときは .mdx にする。
```

---

## 6. 画像 & アセット管理

| 用途          | 置き場所                     | 記述例                                   |
| ----------- | ------------------------ | ------------------------------------- |
| hero 画像     | `public/images/hero/...` | `heroImage: "/images/hero/hd600.jpg"` |
| 記事内図版       | 記事フォルダ or `public/`      | `![図版](./img.png)`                    |
| その他 DL ファイル | `public/files/...`       | `<a href="/files/doc.pdf">ダウンロード</a>` |

---

## 7. デザインカスタマイズ

```ts
// tailwind.config.ts
export default {
  content: ['src/**/*.{astro,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: { brand: '#0f766e' },   // ブランドカラー
      fontFamily: { heading: ['Inter', 'sans-serif'] },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
```

* **shadcn/ui** で追加パーツ

  ```bash
  npx shadcn-ui@latest add badge accordion tabs
  ```
* **View Transitions**

  ```astro
  <a astro-transition href={post.slug}>続きを読む</a>
  ```
* **ダークモード** : shadcn のテーマトグルを流用

---

## 8. ビルド設定

### 8‑1 静的サイト（デフォルト）

* 追加アダプター不要。`astro.config.mjs` はそのまま。

### 8‑2 SSR / ODR（任意）

```bash
pnpm astro add cloudflare      # adapter-cloudflare を追加
```

---

## 9. Cloudflare Pages へデプロイ

### A. Git 連携（推奨）

1. リポジトリを GitHub / GitLab へ push
2. Cloudflare → **Workers & Pages** → **Create Pages**
3. リポジトリ選択 → **Framework preset** = `Astro`
4. Build command `pnpm run build`, Output `dist`
5. **Save and Deploy**

### B. Wrangler CLI（手動）

```bash
npm install -D wrangler
pnpm run build          # dist/ 生成
npx wrangler pages dev ./dist        # ローカルプレビュー
npx wrangler pages deploy ./dist     # 本番公開
```

> **Node バージョン固定**
> Pages 設定 → Environment Variables → `NODE_VERSION = 20`

---

## 10. 運用のヒント

| 項目        | ツール例                                     |
| --------- | ---------------------------------------- |
| 自動デプロイ    | push → Cloudflare が再ビルド                  |
| 画像最適化     | `astro add image` + Cloudflare Images    |
| コメント      | Giscus / Utterances                      |
| パフォーマンス計測 | Cloudflare Web Analytics + Lighthouse CI |

---

## 11. よくある質問

| Q                    | A                                                                  |
| -------------------- | ------------------------------------------------------------------ |
| **記事を下書きにするには？**     | front‑matter に `draft: true`。ビルド時自動除外                              |
| **日本語ファイル名は？**       | URL がエンコードされるので推奨しない                                               |
| **タグ／カテゴリページの作成**    | `src/pages/tags/[tag].astro` 等を追加し `getCollection('posts')` でフィルター |
| **MDX で React 以外は？** | Svelte・Vue なども `<svelte:component>` 等で使用可（要統合プラグイン）                |

---

## 12. まとめ

1. **astro‑erudite** を clone
2. **記事** は `src/content/posts/**/*.mdx` に置くだけ
3. **静的 or SSR** を選び、Cloudflare Pages へデプロイ
4. Tailwind & shadcn/ui で **無限に拡張**

これで **軽量・高速・型安全** なオーディオブログが完成。
あとはレビュー記事を追加してコンテンツを育てましょう！ 🎧
