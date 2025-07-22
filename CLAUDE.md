# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

オーディオ機器レビューブログ。Astroとastro-eruditeテンプレートを使用したシンプルで高速、カスタマイズ可能なブログシステム。

## 技術スタック

- **フレームワーク**: Astro v5.x + astro-eruditeテンプレート
- **パッケージマネージャー**: pnpm (9以上)
- **Node.js**: 20 LTS
- **スタイリング**: Tailwind CSS 4 + shadcn/ui
- **コンテンツ**: Content Collections + MDX
- **デプロイ**: Cloudflare Pages（静的 or SSR/ODR）

## 初期セットアップコマンド

【完了】プロジェクトが未初期化の場合：
```bash
pnpm create astro -- --template jktrn/astro-erudite
cd astro-erudite
pnpm install
```

## 開発用コマンド

```bash
# 開発サーバー起動
pnpm dev                    # http://localhost:4321

# ビルド関連
npx astro build             # 本番用ビルド
pnpm run preview            # ビルド結果のプレビュー

# Cloudflareアダプター追加（SSR/ODR用）
pnpm astro add cloudflare

# shadcn/uiコンポーネント追加
npx shadcn-ui@latest add badge accordion tabs
```

## プロジェクト構造

```
src/
├── content/
│   ├── posts/              # ブログ記事（md/mdxファイル）
│   └── content.config.ts   # コンテンツスキーマ定義
└── pages/                  # ルートページ

public/
├── images/                 # 静的画像（ヒーロー画像等）
└── files/                  # ダウンロード可能ファイル
```

## コンテンツスキーマ

`src/content/content.config.ts`でオーディオ機器レビュー用メタデータを定義：

- `title`: 文字列（必須）
- `date`: 日付（必須）
- `brand`: 文字列（オプション）- 機器ブランド
- `model`: 文字列（オプション）- 機器モデル
- `category`: 列挙型（オプション）- ヘッドホン、DAC、アンプ、アクセサリ
- `tags`: 文字列配列（オプション）
- `heroImage`: 文字列（オプション）- ヒーロー画像パス
- `draft`: 真偽値（オプション）- 下書き状態

## コンテンツ作成

- ブログ記事は`src/content/posts/`に配置
- `.md`または`.mdx`拡張子を使用
- ファイル名がURLスラッグになる
- ヒーロー画像：`public/images/hero/`
- 下書き記事：フロントマターで`draft: true`

## デプロイ

### Cloudflare Pages（Git連携）
1. GitHub/GitLabにプッシュ
2. Cloudflare PagesでリポジトリをConnect
3. Framework preset: Astro
4. Build command: `npx astro build`
5. Output directory: `dist`
6. 環境変数でNODE_VERSION=20を設定

### 手動デプロイ
```bash
npm install -D wrangler
npx astro build
npx wrangler pages deploy ./dist
```

## カスタマイズのポイント

- **カラー**: `tailwind.config.ts`でブランドカラー変更
- **フォント**: Tailwind設定でフォントファミリー変更
- **コンポーネント**: 必要に応じてshadcn/uiコンポーネント追加
- **スタイリング**: カスタムデザイン用Tailwindクラス拡張

## 主要機能

- Content Collectionsによる型安全なコンテンツ管理
- 静的およびSSRデプロイモード対応
- Tailwind CSS 4 + shadcn/uiコンポーネント
- インタラクティブコンポーネント用MDXサポート
- Astro画像コンポーネントによる画像最適化
- スムーズなナビゲーション用View Transitions
- **オーディオ機器レビュー専用postsコレクション**
- **PC/モバイル対応TOC（目次）機能**
- **前後記事ナビゲーション**
- **日本語フォント（Noto Sans JP）対応**

## 実装状況（2025-01-22現在）

### ✅ 完了済み
- [x] astro-eruditeテンプレートベースの初期セットアップ
- [x] postsコレクションスキーマ設計・実装
- [x] サンプルオーディオ機器レビュー記事作成（4記事）
- [x] posts一覧ページ（年別グループ化、ページネーション）
- [x] posts詳細ページ（blogと同等機能）
- [x] TOC機能（PC: サイドバー、モバイル: ヘッダー）
- [x] 前後記事ナビゲーション
- [x] Noto Sans JP Variable Font設定
- [x] プロジェクトドキュメント整備
- [x] 画像管理用ディレクトリ構造の設定

### 🔄 保留中
- [ ] shadcn/uiコンポーネント追加（accordion, tabs等）
- [ ] Cloudflare Pagesデプロイ設定

## 技術的知見・重要な発見

### Astro v5 Content Loader API
- **重要**: 新しいContent Loader APIでは`post.slug`ではなく`post.id`を使用
- `getStaticPaths()`で`params: { id: post.id }`を設定
- URLパスとして`/posts/${post.id}`形式になる

### postsコレクション実装
```typescript
// src/content.config.ts
const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    brand: z.string().optional(),
    model: z.string().optional(),
    category: z.enum(['スピーカー', 'ヘッドホン', ...]).optional(),
    // ...
  }),
})
```

### TOC機能の実装パターン
```typescript
// posts用TOC関数
export async function getPostTOCSections(postId: string): Promise<TOCSection[]> {
  const posts = await getCollection('posts')
  const post = posts.find((p) => p.id === postId)
  const { headings } = await render(post)
  // headingsをTOCSection形式に変換
}
```

### レスポンシブレイアウト構造
```astro
<!-- blogと同じグリッドレイアウト -->
<section class="grid grid-cols-[minmax(0px,1fr)_min(calc(var(--breakpoint-md)-2rem),100%)_minmax(0px,1fr)] gap-y-6">
  <!-- PC: TOCSidebar、モバイル: TOCHeader -->
  <TOCSidebar sections={tocSections} />
  <article class="prose col-start-2">...</article>
</section>
```

### 日本語フォント設定
```css
/* Variable Font版を使用 */
@font-face {
  font-family: 'Noto Sans JP';
  src: url('/fonts/NotoSansJP-VariableFont_wght.ttf') format('truetype-variations');
  font-weight: 100 900;
}

--font-sans: 'Noto Sans JP', Geist, ui-sans-serif, system-ui, sans-serif;
```

## 遭遇した問題と解決方法

### 1. postsコレクション読み込み問題
**問題**: 初期設定でpostsが認識されない
**解決**: `src/content.config.ts`（`config.ts`でなく`content.config.ts`）に正しく設定

### 2. 404エラー（post.slug問題）
**問題**: `post.slug`使用でページが見つからない
**解決**: Astro v5では`post.id`を使用するよう修正

### 3. Sharp依存関係エラー
**問題**: 画像最適化でビルド失敗
**解決**: `pnpm add sharp`で依存関係追加

### 4. TOC表示問題
**問題**: PCでTOCが表示されない（TOCHeaderをモバイル用に実装していた）
**解決**: blogと同じTOCSidebar（PC用）とTOCHeader（モバイル用）両方実装

### 5. ビルドコマンド問題
**問題**: `pnpm run build`が動作しない
**解決**: `npx astro build`が正しいコマンド

## 詳細ファイル構造

```
src/
├── content/
│   ├── posts/                      # オーディオ機器レビュー
│   │   ├── sennheiser-hd600-review.mdx
│   │   ├── topping-d90se-review.mdx
│   │   ├── kef-ls50-meta-review.mdx
│   │   └── taikoaudio-olympus.mdx
│   ├── blog/                       # 既存ブログ記事
│   ├── authors/                    # 著者情報
│   └── content.config.ts           # 全コレクション定義
├── components/
│   ├── PostsCard.astro            # posts用カード（BlogCardベース）
│   ├── PostsNavigation.astro      # posts用前後ナビゲーション
│   ├── TOCSidebar.astro           # PC用TOC
│   └── TOCHeader.astro            # モバイル用TOC
├── pages/
│   └── posts/
│       ├── [...id].astro          # posts詳細ページ
│       └── [...page].astro        # posts一覧ページ
├── lib/
│   └── data-utils.ts
│       ├── getAllReviews()        # posts取得
│       ├── getAdjacentReviews()   # 前後記事取得
│       └── getPostTOCSections()   # posts用TOC
└── styles/
    └── global.css                 # Noto Sans JP設定
```

## 今後の課題・改善点

### 機能拡張
- [ ] 画像管理の最適化（WebP変換、遅延読み込み）
- [ ] 検索機能の実装
- [ ] カテゴリ・タグページの充実
- [ ] RSS feedにposts追加
- [ ] SEO最適化（構造化データ）

### コンテンツ
- [ ] より多くのサンプル記事追加
- [ ] 製品画像の体系的整理
- [ ] レビューテンプレートの標準化

### デプロイ・運用
- [ ] Cloudflare Pages自動デプロイ設定
- [ ] パフォーマンス最適化
- [ ] アナリティクス設定

## 学習メモ

### Astro v5の特徴
- Content Loader APIの活用でより柔軟なコンテンツ管理
- View Transitionsによるスムーズなページ遷移
- 静的サイト生成とSSRの両対応

### astro-eruditeテンプレートの利点
- shadcn/ui統合による一貫したデザインシステム
- Tailwind CSS 4対応
- TOC、ナビゲーション等の高度な機能が標準装備
- TypeScript完全対応

### 日本語サイト構築のポイント
- Variable Fontの活用による容量最適化
- 適切なfont-displayによる表示最適化
- CJK文字対応フォントの重要性

### 画像管理システム
- **シンプルなディレクトリ構造**: フラットな製品画像管理（/products/直下）
- **ProductImageコンポーネント**: レスポンシブ画像、WebP自動変換、カテゴリ別最適化
- **画像ユーティリティ関数**: パス生成、alt属性自動生成、メタデータ管理
- **最適化スクリプト**: ImageMagick活用の自動画像最適化（scripts/optimize-images.js）
- **命名規則の標準化**: {brand}-{model}-{type}.{ext}形式（カテゴリ分けなし）
- **設計思想**: 過度な分類を避け、ファイル名による識別を優先