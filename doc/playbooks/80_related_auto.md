目的:
- {{FILES}} の各記事について関連記事を自動選定し、
  1) frontmatter.relatedArticles（1〜9件）を最小差分で設定・補完
  2) .mdx のみ本文に <RelatedArticlesGrid /> を文脈に沿って 0〜4 箇所挿入
- 文章本文は改変しない（Grid挿入以外は編集禁止）、処理は完全冪等

前提:
- `.cache/catalog.json` が存在し、各記事に {collection, slug, title, brand, model, category, price, tags, internalLinks} を含む
- Grid 用コンポーネントは '@/components/RelatedArticlesGrid.astro'

## step1: frontmatter.relatedArticles設定
対象:
- .md / .mdx（frontmatter が YAML または `export const frontmatter = {...}`）

候補データ:
- `.cache/catalog.json` を読み込む（存在必須）
- 各レコード: {collection, slug, title, brand, model, category, price, tags, internalLinks}

選定ルール（スコア）:
- 同ブランド: +40
- 同カテゴリ（headphone/earphone/etc）: +25
- 本文相互言及（対象記事がその候補に内部リンク、または候補が対象に内部リンク）: +25
- 価格帯近似（±25% 以内）: +15（price が無い場合は0）
- モデル/シリーズ一致（WH-1000XM6 vs XM5 など部分一致）: +10
- 既に frontmatter.relatedArticles に含まれているものは **固定**（順序維持）、不足分だけ補完
- 自分自身は除外、下書き/非公開（draft: true 等）は除外（可能なら）

出力形式:
- frontmatter.relatedArticles = 
```
relatedArticles:
- collection: <reviews|columns>
id: <slug>
- ...
```
- 既存があれば順序維持＋重複排除しながら最大9件まで

---

## step2: RelatedArticlesGrid挿入
対象:
- **.mdx のみ**（.md はスキップ）
- frontmatter は読み取り専用。本文のみ編集（最小差分）

前提:
- `.cache/catalog.json` を読み込み、frontmatter.brand/model/category/price/tags を参照して関連記事候補のベースとする
- 必要なら `import RelatedArticlesGrid from '@/components/RelatedArticlesGrid.astro'` を冒頭に 1 回だけ追加

文脈検出（挿入ポイント）:
- 本文を読んで最適な関連記事の挿入ポイントを探す
- 基本的に挿入は章(h2)ごとに1つまで

関連記事の候補選定:
- 挿入する文脈に対して関連性の高い記事を1-4個選定

出力（MDX）:
- 冒頭import（無ければ追加）
```
import RelatedArticlesGrid from '@/components/RelatedArticlesGrid.astro'
```
- 挿入するブロック:
```
<RelatedArticlesGrid
articles={[
{ collection: "<reviews|columns>", id: "<slug1>" },
{ collection: "<reviews|columns>", id: "<slug2>" },
{ collection: "<reviews|columns>", id: "<slug3>" },
{ collection: "<reviews|columns>", id: "<slug4>" },
]}
columns={4}
title="関連記事"
/>
```
- 件数が1-2なら `columns={2}`、件数が3なら `columns={3}`、件数が4以上なら `columns={4}`、タイトルは既定「関連記事」、または文脈に応じて設定。既に同等の Grid が直近にある場合は挿入しない
- 大きな意義がない限りは基本的に1つの章(h2)内に挿入するRelatedArticlesGridは1つまでとする

安全・禁止:
- 本文の既存テキストは改変禁止
- コードブロック/既存の JSX/他のコンポーネント内は触らない
- 2回目以降の実行で差分が出ないこと（冪等）

検査:
- 適切なセクション直後に Grid が 0〜4 箇所挿入
- import は 1 回のみ
- 自分自身や重複 slug は含まれない
