# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

オーディオ機器レビューとコラムサイト。Astroとastro-eruditeテンプレートを使用したシンプルで高速、カスタマイズ可能なブログシステム。機器レビューと技術解説コラムの両方を提供。

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
npx astro preview           # ビルド結果のプレビュー

# Cloudflareアダプター追加（SSR/ODR用）
pnpm astro add cloudflare

# shadcn/uiコンポーネント追加
npx shadcn-ui@latest add badge accordion tabs
```

## プロジェクト構造

```
src/
├── content/
│   ├── reviews/            # オーディオ機器レビュー（md/mdxファイル）
│   ├── columns/            # オーディオコラム（md/mdxファイル）
│   └── content.config.ts   # コンテンツスキーマ定義
└── pages/                  # ルートページ

public/
├── images/                 # 静的画像（ヒーロー画像等）
└── files/                  # ダウンロード可能ファイル
```

## コンテンツスキーマ

`src/content/content.config.ts`でコンテンツ用メタデータを定義：

### reviewsコレクション（オーディオ機器レビュー）
- `title`: 文字列（必須）
- `description`: 文字列（必須）
- `date`: 日付（必須）
- `brand`: 文字列（オプション）- 機器ブランド
- `model`: 文字列（オプション）- 機器モデル
- `category`: 列挙型（オプション）- 'スピーカー','ヘッドホン','イヤホン','デジタルプレーヤー','DAC','パワーアンプ','プリアンプ','プリメインアンプ','ヘッドホンアンプ','アナログ','ケーブル','アクセサリ'
- `tags`: 文字列配列（オプション）
- `heroImage`: image（オプション）- ヒーロー画像
- `draft`: 真偽値（オプション、デフォルト: false）- 下書き状態

### columnsコレクション（オーディオコラム）
- `title`: 文字列（必須）
- `description`: 文字列（必須）
- `date`: 日付（必須）
- `category`: 列挙型（オプション）- 'オーディオ基礎知識','セットアップ','音楽論','業界動向','技術解説','エッセイ','その他'
- `tags`: 文字列配列（オプション）
- `heroImage`: image（オプション）- ヒーロー画像
- `draft`: 真偽値（オプション、デフォルト: false）- 下書き状態

## コンテンツ作成

- **レビュー記事**: `src/content/reviews/`に配置
- **コラム記事**: `src/content/columns/`に配置
- `.md`または`.mdx`拡張子を使用
- ファイル名がURLスラッグになる
- ヒーロー画像：`src/assets/images/hero/`（astro:assets最適化対応）
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
- **オーディオ機器レビュー専用reviewsコレクション**
- **オーディオコラム専用columnsコレクション**
- **PC/モバイル対応TOC（目次）機能**
- **前後記事ナビゲーション**
- **日本語フォント（Noto Sans JP）対応**
- **複数コレクション対応の汎用コンポーネント設計**
- **統合RSSフィード（reviews/columns/blog）**

## 実装状況（2025-07-25現在）

### ✅ 完了済み
- [x] astro-eruditeテンプレートベースの初期セットアップ
- [x] reviewsコレクションスキーマ設計・実装
- [x] サンプルオーディオ機器レビュー記事作成（4記事）
- [x] reviews一覧ページ（年別グループ化、ページネーション）
- [x] reviews詳細ページ（blogと同等機能）
- [x] TOC機能（PC: サイドバー、モバイル: ヘッダー）
- [x] 前後記事ナビゲーション
- [x] Noto Sans JP Variable Font設定
- [x] プロジェクトドキュメント整備
- [x] 画像管理用ディレクトリ構造の設定
- [x] astro:assets画像最適化の実装（WebP自動変換）
- [x] **columnsコレクション設計・実装（オーディオコラム機能）**
- [x] **columns一覧ページ・詳細ページの作成**
- [x] **メニューナビゲーションへのcolumns追加**
- [x] **BlogCard.astroの汎用化（blog/reviews/columns対応）**
- [x] **読書時間計算の修正（コレクション別対応）**
- [x] **RSSフィードへのcolumns統合**
- [x] **トップページに最新コラム表示追加**
- [x] **日本語読書時間計算の文字数ベース対応**

### 🔄 保留中
- [ ] shadcn/uiコンポーネント追加（accordion, tabs等）
- [ ] Cloudflare Pagesデプロイ設定

## 技術的知見・重要な発見

### Astro v5 Content Loader API
- **重要**: 新しいContent Loader APIでは`review.slug`ではなく`review.id`を使用
- `getStaticPaths()`で`params: { id: review.id }`を設定
- URLパスとして`/reviews/${review.id}`形式になる

### reviewsコレクション実装
```typescript
// src/content.config.ts
const reviews = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/reviews' }),
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
// reviews用TOC関数
export async function getReviewTOCSections(reviewId: string): Promise<TOCSection[]> {
  const reviews = await getCollection('reviews')
  const review = reviews.find((r) => r.id === reviewId)
  const { headings } = await render(review)
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

### 1. reviewsコレクション読み込み問題
**問題**: 初期設定でreviewsが認識されない
**解決**: `src/content.config.ts`（`config.ts`でなく`content.config.ts`）に正しく設定

### 2. 404エラー（review.slug問題）
**問題**: `review.slug`使用でページが見つからない
**解決**: Astro v5では`review.id`を使用するよう修正

### 3. Sharp依存関係エラー
**問題**: 画像最適化でビルド失敗
**解決**: `pnpm add sharp`で依存関係追加

### 4. TOC表示問題
**問題**: PCでTOCが表示されない（TOCHeaderをモバイル用に実装していた）
**解決**: blogと同じTOCSidebar（PC用）とTOCHeader（モバイル用）両方実装

### 5. ビルドコマンド問題
**問題**: `pnpm run build`が動作しない
**解決**: `npx astro build`が正しいコマンド

### 6. astro:assets画像最適化が機能しない問題
**問題**: `npx astro build`してもWebP画像が生成されない
**解決**: 
1. `src/content.config.ts`のreviewsコレクションで`heroImage: image().optional()`に変更
2. 画像を`public/images/`から`src/assets/images/`に移動
3. MDXファイルでエイリアス+パス（`@assets/images/hero/taiko-olympus.jpg`）を使用
4. コンポーネントで`<img>`タグを`<Image>`コンポーネント（astro:assetsから）に変更
5. **効果**: 119KB → 9KB（92%削減）のWebP自動生成に成功

### 7. 引用番号のリンク化作業での見落とし問題（2025-01-25）
**問題**: 本文中の引用番号（1、2、5等）を引用文献へのリンク化する際、一部の箇所を見落とした
**原因**: 
- 検索パターン `\s\d{1,2}[。]` では句読点「、」や引用符「」」後の数字を捉えきれなかった
- 「Varèseは 12、」や「なかった」5。」のような形式を見逃した
- 段階的処理で一部の箇所が漏れた
- 最終確認の不足

**解決策**: 
1. **包括的検索パターンの実装**:
   ```regex
   # 基本パターン: スペース + 数字 + 句読点
   [^#\[\]]\s*[0-9]{1,2}[。、]
   # 引用符パターン: 引用符 + 数字 + 句読点  
   」\s*[0-9]{1,2}[。、)]
   # 一般的な文字 + 数字パターン
   [^#\[\]ref-][0-9]{1,2}[。、）]
   ```
2. **体系的な作業フロー**:
   - TodoWriteツールによる作業管理とタスク追跡
   - 複数パターンでの包括的検索
   - セクション別の段階的処理と確認
   - 各編集後の該当範囲再確認
   - 最終的な全体検証（全パターンでのチェック）

**教訓**: 
- 大規模な一括編集作業では体系的な管理が不可欠
- 検索パターンは複数角度から検討し、テストが必要
- TodoWriteツールの活用で作業漏れを防止できる
- 段階的確認と最終検証の両方が重要

### 8. columnsコレクション追加時の読書時間計算問題（2025-07-25）
**問題**: BlogCard.astroでcolumnsが常に「1 min read」と表示される
**原因**: 
- BlogCard.astroが`getCombinedReadingTime()`（blog専用）を使用
- columns用の読書時間計算関数が存在しない
- `readingTime(0)`が返されて最低値の「1 min read」が固定表示

**解決策**:
1. **コレクション別読書時間計算関数の実装**:
   ```typescript
   export async function getColumnReadingTime(columnId: string): Promise<string> {
     const column = await getColumnById(columnId)
     if (!column) return readingTime(0)
     const wordCount = calculateWordCountFromHtml(column.body)
     return readingTime(wordCount)
   }
   ```
2. **BlogCard.astroの汎用化**:
   ```typescript
   // コレクション種別に応じた読書時間計算
   let readTime: string
   if (entry.collection === 'columns') {
     readTime = await getColumnReadingTime(entry.id)
   } else if (entry.collection === 'reviews') {
     readTime = await getReviewReadingTime(entry.id)
   } else {
     readTime = await getCombinedReadingTime(entry.id)
   }
   ```
3. **型定義の拡張**: `entry: CollectionEntry<'blog'> | CollectionEntry<'columns'> | CollectionEntry<'reviews'>`

**教訓**:
- 新しいコレクション追加時は既存コンポーネントの対応確認が必要
- 型安全性とコレクション別処理を両立させる設計が重要
- 汎用コンポーネントは段階的拡張を前提とした設計にすべき

### 9. 日本語読書時間計算問題（2025-07-25）
**問題**: 日本語コンテンツの読書時間が大幅に短く表示される（8000文字のコラムが4分）
**原因**: 
- 英語向けの「語数」ベース計算（200語/分）を使用
- 日本語は単語間にスペースがないため`split(/\s+/)`で正確にカウントできない
- `calculateWordCountFromHtml()`が日本語文章を適切に分析できない

**解決策**:
1. **日本語文字数ベース計算の実装**:
   ```typescript
   export function calculateCharCountFromHtml(html: string | null | undefined): number {
     if (!html) return 0
     const textOnly = html.replace(/<[^>]+>/g, '')
     // 改行、タブ、余分な空白を除去して文字数をカウント
     return textOnly.replace(/\s+/g, '').length
   }
   ```
2. **読書速度の調整**:
   ```typescript
   export function readingTime(charCount: number): string {
     // 日本語文字数基準：1000文字/分で計算（読みやすいコラム・記事想定）
     const readingTimeMinutes = Math.max(1, Math.round(charCount / 1000))
     return `${readingTimeMinutes} min read`
   }
   ```
3. **全関数の文字数ベース対応**: data-utils.tsの全読書時間計算関数を更新

**効果**: 
- 8000文字のコラム: 4分 → 16-17分（実感に近い表示）
- 日本語コンテンツに適した正確な読書時間表示

**教訓**:
- 多言語対応では言語特性を考慮した実装が必要
- 英語向けライブラリ・アルゴリズムの日本語適用時は検証が重要
- 読書速度は言語・ジャンル・想定読者層により大きく異なる
- ユーザーテストによる実感値との照合が重要

### 11. canonical link設定問題（2025-07-25）
**問題**: Lighthouse SEO監査で「Document does not have a valid rel=canonical」警告が発生
**原因**: 
- PostHead.astroで全ページのcanonical linkがホームページ（`SITE.href`）を指していた
- 各記事ページは自身のURLを指すべきなのに、間違った設定となっていた
- SEO的に問題のある重複コンテンツの可能性を示唆

**解決策**:
1. **canonical linkの修正**:
   ```astro
   // 修正前（ホームページを指していた）
   <link rel="canonical" href={SITE.href} />
   
   // 修正後（現在のページを指すように）
   <link rel="canonical" href={Astro.url} />
   ```
2. **型定義の汎用化**:
   ```typescript
   // 修正前（blogのみ対応）
   post: CollectionEntry<'blog'>
   
   // 修正後（全コレクション対応）
   post: CollectionEntry<'blog'> | CollectionEntry<'reviews'> | CollectionEntry<'columns'>
   ```

**効果**:
- **blog記事**: `/blog/記事名/` の正しいcanonical link
- **reviews記事**: `/reviews/記事名/` の正しいcanonical link  
- **columns記事**: `/columns/記事名/` の正しいcanonical link
- Lighthouse SEO警告の解消
- 検索エンジンへの正しいURL情報伝達

**教訓**:
- canonical linkは各ページが自身のURLを指すのが基本
- SEOコンポーネントは全コレクション対応の汎用設計が重要
- Lighthouseによる定期的なSEO監査の実施が有効
- astro-eruditeテンプレートの初期設定も検証が必要

## 詳細ファイル構造

```
src/
├── assets/
│   └── images/
│       └── hero/                   # ヒーロー画像（astro:assets管理）
│           └── taiko-olympus.jpg
├── content/
│   ├── reviews/                    # オーディオ機器レビュー
│   │   ├── sennheiser-hd600-review.mdx
│   │   ├── topping-d90se-review.mdx
│   │   ├── kef-ls50-meta-review.mdx
│   │   └── taikoaudio-olympus.mdx
│   ├── columns/                    # オーディオコラム
│   │   └── absorber-vs-diffuser.mdx
│   ├── blog/                       # 既存ブログ記事
│   ├── authors/                    # 著者情報
│   └── content.config.ts           # 全コレクション定義
├── components/
│   ├── BlogCard.astro             # 汎用カード（blog/reviews/columns対応）
│   ├── ReviewsNavigation.astro    # reviews用前後ナビゲーション
│   ├── ColumnsNavigation.astro    # columns用前後ナビゲーション
│   ├── TOCSidebar.astro           # PC用TOC
│   └── TOCHeader.astro            # モバイル用TOC
├── pages/
│   ├── reviews/
│   │   ├── [...id].astro          # reviews詳細ページ
│   │   └── [...page].astro        # reviews一覧ページ
│   └── columns/
│       ├── [...id].astro          # columns詳細ページ
│       └── [...page].astro        # columns一覧ページ
├── lib/
│   └── data-utils.ts
│       ├── getAllReviews()        # reviews取得
│       ├── getAllColumns()        # columns取得
│       ├── getAdjacentReviews()   # 前後記事取得（reviews）
│       ├── getAdjacentColumns()   # 前後記事取得（columns）
│       ├── getReviewTOCSections() # reviews用TOC
│       ├── getColumnTOCSections() # columns用TOC
│       ├── getReviewReadingTime() # reviews読書時間
│       └── getColumnReadingTime() # columns読書時間
└── styles/
    └── global.css                 # Noto Sans JP設定
```

## 今後の課題・改善点

### 機能拡張
- [x] 画像管理の最適化（WebP変換実装済み、遅延読み込みは未実装）
- [x] RSS feedにreviews/columns追加
- [ ] 検索機能の実装
- [ ] カテゴリ・タグページの充実
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

### astro:assets画像最適化
- **画像配置**: `src/assets/images/`に配置（publicフォルダではなく）
- **スキーマ定義**: `content.config.ts`で`image()`ヘルパーを使用
- **自動変換**: JPG/PNG → WebP自動変換（92%以上のサイズ削減）
- **レスポンシブ対応**: 複数サイズの画像を自動生成
- **Imageコンポーネント**: `<img>`の代わりに`<Image>`を使用
- **相対パス使用**: MDXから`@assets/images/`形式で参照

### MDXファイルでの引用リンク実装
- **リンク形式**: `[1](#ref-1)` でページ内リンクを作成
- **アンカー形式**: `<span id="ref-1">1</span>` で引用文献にIDを付与
- **検索・置換の課題**: 複数の正規表現パターンが必要
  - 基本形: `[^#\[\]]\s*[0-9]{1,2}[。、]`
  - 引用符後: `」\s*[0-9]{1,2}[。、)]`
  - 文字後: `[^#\[\]ref-][0-9]{1,2}[。、）]`
- **作業管理**: TodoWriteツールによる段階的タスク管理が効果的
- **品質保証**: 複数検索パターンでの最終検証が必須（36箇所のリンクと42個の引用文献の整合性確認）

### 複数コレクション対応の設計パターン
- **汎用コンポーネント設計**: BlogCard.astroのように、複数のコレクション型をUnion typeで受け入れる設計
- **コレクション別処理の分岐**: `entry.collection`プロパティによる条件分岐で適切な処理を選択
- **読書時間計算の標準化**: 200語/分基準で`calculateWordCountFromHtml()`→`readingTime()`の統一パターン
- **画像フィールド正規化**: blogは`image`、reviews/columnsは`heroImage`の差異への対応
- **著者情報の条件付き表示**: blogのみauthorsフィールドを持つ設計への対応
- **ナビゲーション設計**: コレクション専用ナビゲーションコンポーネント（ReviewsNavigation/ColumnsNavigation）
- **RSSフィード統合**: 全コレクションを日付順ソートで統一配信する設計

### コンテンツ管理のベストプラクティス
- **コレクション追加の標準手順**:
  1. `content.config.ts`でスキーマ定義
  2. data-utils.tsに専用関数群追加（get, getBy, getAdjacent, getTOC, getReadingTime）
  3. pages/[collection]/[...page].astroで一覧ページ
  4. pages/[collection]/[...id].astroで詳細ページ
  5. 専用ナビゲーションコンポーネント作成
  6. 既存汎用コンポーネントの対応確認・拡張
  7. RSSフィード・メニューへの追加

### 日本語読書時間計算
- **計算方式**: 文字数ベース（1000文字/分）
- **実装理由**: 日本語は単語間スペースがなく、英語の「語数」カウントが不適切
- **HTMLテキスト抽出**: `html.replace(/<[^>]+>/g, '')` でタグ除去後、`replace(/\s+/g, '')` で空白除去
- **読書速度設定**: 
  - 技術記事・コラム想定で1000文字/分
  - 一般的な日本語読書速度（400-600文字/分）より速めに設定
  - オーディオ愛好者の専門知識・読書習慣を考慮
- **ユーザー体験**: 実際の読書時間との一致を重視したチューニング