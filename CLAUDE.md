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