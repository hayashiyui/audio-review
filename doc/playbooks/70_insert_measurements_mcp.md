目的:
- 対象 MDX（{{FILES}}）の「測定系セクション」に、引用先ページから**元画像をそのまま**保存して差し込みます
- **有用と判断できる場合は 1セクションにつき最大3枚**まで挿入（デフォルト上限=3、重複や冗長は避ける）
- 優先規則: **FRは Raw を Calibrated より優先**。さらに **category が 'headphone' | 'earphone' の場合は Target Curve 併記のグラフを優先**
- **JS描画（canvas / SVG / CSS背景）も対象**。Chromeで“保存可能”なら拾う

対象:
- {{FILES}}（**.mdxのみ**）。frontmatter（YAML/MDXオブジェクト）は読み取り専用
- 画像保存先: `src/assets/images/contents/`

依存（MCP）:
- Playwright MCP（ブラウズ・DOM探索・HTTP取得）
- Filesystem MCP（base64 書き込み）
- いずれも Codex から利用可能であること

セクション検出:
- 本文を見出しで分割し、見出しに以下を含むものを測定系とみなす:
  - FR系: `周波数特性|frequency response|FR`
  - NC系: `ノイズ|ANC|noise (attenuation|isolation)`
  - その他: `測定|計測|measurement`
- 各測定系セクションの**先頭段落の直後**に挿入。すでに同一画像が挿入済みならスキップ（冪等）

引用 → URL 抽出:
- 当該セクション内（前方優先。無ければ直後〜同章末）に現れる `[n](#ref-n)` を最大3件収集
- 末尾「引用文献/参考文献/References」で `<a id="ref-n"></a>` を持つ項目から、最初の `http/https` URL を取得
- URLが取れないセクションはスキップ（本文改変禁止）

候補画像の収集（Playwright MCP）:
- `browser_navigate(url)` → DOM安定待ち（必要に応じて小休止）
- **候補要素**を広く列挙:
  1) `<img>`（`currentSrc` / `srcset` 最大解像度、`data-src` 等の遅延属性も見る）
  2) `<picture><source>`（`srcset` を解決）
  3) **CSS背景**（`getComputedStyle(el).backgroundImage` の `url(...)` から実URL抽出）
  4) **<canvas>**（`toDataURL('image/png',1.0)` で生PNGを取得）
  5) **<svg>**（`outerHTML` を直接 `.svg` として保存可能）
- それぞれについて**“元データ”を優先**:
  - 第一: **HTTPバイナリ取得**（`context.request.get(imgUrl)` or `page.request.get(imgUrl)`）→ **ボディをそのまま base64 化**（再エンコード禁止）
  - 第二: ページ内 `fetch(imgUrl)` → ArrayBuffer → base64（第一が不可のとき）
  - 第三（最終手段）: **要素スクリーンショット**（PNG, 品質=高）。※HTTP取得できた場合は**使わない**
  - `<canvas>` は `toDataURL` を**第一手段**とみなし、PNGをそのまま base64 化
  - `<svg>` は `outerHTML` を**そのまま** `.svg` として保存（テキスト）

メタ情報とラベリング:
- naturalWidth/Height, alt, title, 周辺の `figcaption`/近傍テキストを取得して正規化（小文字化・記号除去）
- **カテゴリ分類**（FR / NC / MISC）を alt/title/src/caption のキーワードで判定
  - FR: `frequency response|freq response|response|FR|F/R`
  - NC: `noise attenuation|isolation|ANC|cancel`
  - MISC: 上記以外
- **Raw/Calibrated/Target**の判定語:
  - Raw: `raw|uncompensated|no compensation|unequalized|uneq|un-EQ`
  - Calibrated: `calibrated|compensated|compensation|EQ compensated`
  - Target: `target|Harman|DF target|target curve|vs target`
- frontmatter.category が `headphone|earphone` の場合、Target 併記（判定語含む）に**加点**

スコアリング（“有用性” + “多様性”）:
- 基本スコア: `area = naturalWidth * naturalHeight`（小画像は除外: min(width,height) < 240 → −∞）
- キーワード加点:
  - FR系候補: +40、NC系候補: +40、THD/歪み: +20
- Raw/Calibrated/Target ルール（FR候補のみ）:
  - Raw: +35、Calibrated: −15
  - （categoryが headphone/earphone のとき Target 併記）: +25
- 形状ヒューリスティック:
  - ほぼ正方で小面積 → −30、極端比率（w/h>6 or h/w>6） → −20
- 形式優先（同点時）: PNG/SVG > JPEG > WebP
- **多様性ボーナス**（2枚目以降を選ぶ際）:
  - 既選択と **カテゴリが異なる**（FR vs NC vs MISC）: +30
  - 既選択FRと **Raw/Target 属性が異なる**: +20
  - **同一src/同一ハッシュ**は除外（重複防止）

選択数:
- 1セクションあたり **最大3枚**（上限は必要に応じて下げても良い）
- 合計スコア上位から順に、上記“多様性ボーナス”込みで貪欲選択
- スコアが低すぎる（小サイズ/ロゴ類）場合は 0〜1枚に留める

保存（中身は無変換 / 名前のみ変更）:
- frontmatter.slug を S（無ければファイル名から kebab-case）
- 拡張子は **レスポンスの Content-Type or URL** から決定（`.png|.jpg|.jpeg|.webp|.svg` など）。不明は `.png`
- ファイル名（例）:
  - FR: `src/assets/images/contents/${S}-fr-raw-1.<ext>` / `...-fr-target-1.<ext>` / `...-fr-cal-1.<ext>`
  - NC: `src/assets/images/contents/${S}-nc-1.<ext>`
  - MISC: `src/assets/images/contents/${S}-misc-1.<ext>`
  - 2枚目以降は `-2`, `-3` と連番
- **ハッシュ（SHA-256等）で同一バイトを検出** → 既存があればスキップ。異なるが同名の場合は連番で回避

MDXへの挿入（1セクションあたり選択枚数分）:
- 冒頭(frontmatter直後)に `import ImageWithCitation from '@/components/ImageWithCitation.astro';` を**1回だけ**追加
- 各画像を `import measurementFR1 from '@assets/images/contents/<filename>'` のように変数化
  - 変数名は `measurementFR1|measurementFR2|measurementNC1|measurementMisc1...` とカテゴリ＋通番で命名
- 当該セクションの適切な位置に、選択した枚数分の `<ImageWithCitation ... />` を挿入
