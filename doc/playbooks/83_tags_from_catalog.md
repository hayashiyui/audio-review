目的:
- {{FILES}} の各記事の frontmatter.tags を `.cache/catalog.json` の“タグ出現頻度”に基づいて再構成する
- 既存の tags は **上書き**。最大 **7件**、人気タグを優先してセット
- frontmatter 以外の本文は変更しない。差分は最小

前提:
- `.cache/catalog.json` が存在し、各レコードは少なくとも:
  { collection, slug, title, brand, model, category, price, tags }
- 対象は .md / .mdx（YAML または `export const frontmatter = {...}`）

グローバル集計（人気タグの定義）:
- catalog の全記事から `tags` を収集し、頻度表を作る
- 長さ0のものは除外。重複は1度のみカウント
- **人気度** = 出現記事数（doc frequency）
- **優先順位** = 人気度降順 → 文字列の昇順（安定ソート）

各対象記事でのタグ決定:
1) 候補集合A（必須タグ）
   - 国、ブランド名を必須タグとして追加
2) 候補集合B（人気タグからの引き当て）
   - 対象記事の本文**関連語**を抽出・正規化し、人気タグ群と照合してマッチしたものを候補にする
   - 関連語の例:
     - 機能語（本文/既存メタから推定）: `anc`, `ldac`, `aptx`, `aptx-adaptive`, `lc3`, `multipoint`, `usb-dac`, `hi-res`, `ipx*`, など
     - 価格帯（任意）: `budget`, `midrange`, `premium`（price があれば自動分類）
3) フィルタ:
   - frontmatterのcategoryやmodel(機種名)は除外
   - 自記事の slug/id を想起させるタグ（完全一致）は除外
   - 1文字タグ、数字のみタグは除外（`"ldac"`, `"aptx"` はOK）
   - 完全重複は除去
4) 上限:
   - 先の優先順位（人気度降順→文字列昇順）で **最大7件**に切り詰め
5) 出力:
   - frontmatter.tags を **配列で上書き**

安全・冪等:
- frontmatter 以外は編集しない
- 2回目以降の実行で差分が出ない（同じ入力なら同じ並び）
- YAML/MDX オブジェクト構文を壊さない（インデント/カンマは現状を尊重）

検査:
- `.cache/catalog.json` の人気タグが反映され、各記事の tags が**最大7件の人気順**で上書きされている
- 無関係・短すぎる・重複タグが混じっていない
