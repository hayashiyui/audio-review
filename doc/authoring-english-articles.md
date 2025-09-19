# 英語版記事追加ハンドブック（Authoring EN Articles）

最終更新: 2025-09-14

本書は、既存の日本語サイトに英語版記事（/en/ 配下）を追加・公開するための実務手順です。現行実装は Astro v5 + Content Collections（`reviews`/`columns`）+ Pagefind を前提としています。

---

## 前提と重要ポイント

- 生成対象コレクションは `reviews` と `columns`。
- 英語記事は、`en/` サブディレクトリに配置し、ファイル名は元記事と同一にします。
  - 例（レビュー）: `src/content/reviews/en/hifiman-susvara.mdx`
  - 例（コラム）: `src/content/columns/en/sound-quality-evaluation-guide.mdx`
- Frontmatter に `locale: en` を必ず追加します（既定は `ja`）。
- `translationKey` は今後の `hreflang` 相互リンクで使用するため、付与してください（推奨規約: `{collection}-{slug}` 例: `reviews-hifiman-susvara`）。
- 検索（Pagefind）は `<html lang>` に基づき言語別インデックスが自動生成されます。`/` は日本語のみ、`/en/` は英語のみがヒットします。

### 画像の参照ルール（重要）

- 画像は `src/assets/images/{hero,contents}` を共用し、参照は Vite エイリアス `@assets` を使います。
  - Frontmatter: `heroImage: "@assets/images/hero/<file>.jpg"`
  - 本文: `import img from "@assets/images/contents/<file>.png"`
    - 画像を表示する際は、MDX なので `<img src={img} alt="..." />` もしくは既存の `ImageWithCitation` を使用してください。
- Markdown の素の画像記法（`![...](../../assets/...)`）は、`@assets` の解決対象外になることがあります。可能な限り `import` 方式に統一してください。

---

## 作業フロー（最小）

1) 元記事を複製して `en/` に配置（ファイル名は同一）
- 例（レビュー）: `src/content/reviews/hifiman-susvara.mdx` → `src/content/reviews/en/hifiman-susvara.mdx`
- 例（コラム）: `src/content/columns/sound-quality-evaluation-guide.mdx` → `src/content/columns/en/sound-quality-evaluation-guide.mdx`

2) Frontmatter を英語化（日本語側にも同一 translationKey を追記）
- 最低限の変更項目
  - `locale: en`（必須）
  - `title` / `description`（英語に）
  - `translationKey: reviews-hifiman-susvara`（推奨）
  - `tags`（英語に。EN タグだけで EN 側のタグ一覧が生成されます）
- そのほか（必要に応じて）
  - `brand` `model` は機種名表記を維持
  - `heroImage` はそのまま再利用（相対パス: `@assets/images/hero/...`）

補足: 対になる日本語記事（例: `src/content/reviews/hifiman-susvara.mdx`）にも、同じ `translationKey` を追記してください。
```mdx
---
locale: ja
translationKey: reviews-hifiman-susvara
---
```

3) 本文を翻訳
- 内部リンクは `/en/...` に差し替え（EN 記事へのリンク）。
- 日本語記事へ意図的に誘導したい場合はそのまま `/reviews/...` 等を使用可。
- MDX コンポーネント（`ImageWithCitation` 等）はそのまま利用できます。
- **省略せず全文を翻訳すること!!**

補足（内部リンクの作法）
- EN 詳細ページの URL は `/en/reviews/<slug>` / `/en/columns/<slug>` です。
- 対応する `id` は Content Collection 上では `en/<slug>` ですが、リンク先は `<slug>` のみで問題ありません。

4) ビルド確認（任意）
```bash
pnpm build
# http://localhost:4321/en/ へアクセス
```
- `/en/` トップに EN の最新 Column/Review が並ぶ
- `/en/reviews/...` と `/en/columns/...` が表示される
- `⌘/Ctrl + K` の検索は EN ページ内では英語結果のみ

---

## テンプレ（Frontmatter）

レビュー（`src/content/reviews/en/*.mdx`）
```mdx
---
locale: en
translationKey: reviews-hifiman-susvara

title: "HiFiMAN Susvara Review: Pursuing the Truth in Sound"
description: "A deep-dive into the planar flagship's technical prowess and musicality, contextualized among today's top competitors."
date: "2025-09-11T05:00:00+09:00"
brand: "HiFiMAN"
model: "Susvara"
category: "Headphones"
tags: ["planar magnetic", "flagship", "China"]
heroImage: "@assets/images/hero/hifiman-susvara.jpg"
relatedArticles:
  - collection: reviews
    id: hifiman-susvara-unveiled
  - collection: columns
    id: sound-quality-evaluation-guide
---

<!-- 本文（英語） -->
```

コラム（`src/content/columns/en/*.mdx`）
```mdx
---
locale: en
translationKey: columns-sound-quality-evaluation-guide

title: "A Practical Guide to Critical Listening"
description: "Shared vocabulary, listening techniques, and the science behind differences you feel but can't always measure."
date: "2025-08-05T09:00:00"
category: "Basics"
tags: ["listening", "evaluation"]
heroImage: "@assets/images/hero/default.jpg"
---

<!-- 本文（英語） -->
```

---

## 表記ガイド（要点）

- 製品名はメーカー公式表記を優先（例: "HiFiMAN"）。和文カタカナは英語表記へ。
- 技術用語は一般的な英語表現に統一（"planar magnetic", "dynamic driver" 等）。
- 数字・単位は SI/IEEE 表記（例: 1 kHz, 83 dB）。
- 地の文は能動態・簡潔・並行構造を意識（サイト全体のトーンを維持）。
- ドル記号"$"や"<"はエスケープ"\"すること
- 引用文献のリストは改行されるように注意（マークダウンでスペース2つ）
- 英語圏ユーザーにとって興味の対象になりにくい日本国内価格や日本国内向けの情報は省略する

---

## よくある質問（EN 追加）

- Q: `translationKey` は必須？
  - A: 必須です。
- Q: タグは英語にすべき？
  - A: EN ページのタグ一覧は EN 記事のタグだけで生成されます。英語タグ必須です（JA 側とは独立運用）。
- Q: 画像は別に用意する？
  - A: 既存の `src/assets/images/{hero,contents}` を共有してください。必要に応じて差し替え可。
  - 備考: `@assets` エイリアスで参照してください。相対パス（`../../assets/...`）は使用しません。

---

## トラブルシューティング（よくあるミス）

- ImageNotFound / 参照解決エラー
  - `heroImage` や本文の画像が相対パスのままになっていないか確認（`@assets` に修正）。
  - Markdown 直書きの画像は `import` 方式へ置換。
- タグ/カテゴリが表示されない
  - タグは EN 側は英語推奨。カンマ区切りのスペルミスに注意。

---

## 仕上げチェックリスト

- [ ] `src/content/{reviews,columns}/en/*.mdx` が正しい場所にあり、`locale: en` が設定されている
- [ ] `title`/`description`/本文が英語化されている
- [ ] 内部リンクは `/en/...` へ向いている（意図があれば JA でも可）
- [ ] `pnpm build` で `/en/` 配下のページ表示と検索を確認

---

## 参考

- 多言語設計の全体計画: `doc/multilanguage-implementation-plan.mdx`
- 実装ガイド（本リポジトリ版）: `doc/implementation_guide.md`
