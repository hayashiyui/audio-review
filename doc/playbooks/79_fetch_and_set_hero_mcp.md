目的:
- {{FILES}}（.md / .mdx）の各記事について、公式サイトから**ヒーロー画像**を自動収集し、
  `src/assets/images/hero/<slug>.<ext>` として**元バイナリのまま保存**（再エンコード禁止）。
- 保存後、frontmatter の `heroImage` を **ダウンロードした拡張子に合わせて** `"/assets/images/hero/<slug>.<ext>"` に更新（最小差分）。
- 冪等: 同一バイトの既存画像があれば上書きせず、frontmatter も変更多発を避ける。

前提/依存:
- Codex から chrome-devtools-mcp が使用可能（`browser_navigate` / `browser_evaluate` / `page.request.get` 等）。
- ファイル書き込みは Codex のファイルツール（write_file/replace 等）を使用。
- 保存先: `src/assets/images/hero/`

入力対象:
- {{FILES}} の .md / .mdx
- frontmatter（YAML または `export const frontmatter = {...}`）は編集対象。それ以外の本文は**変更禁止**。

手順（ファイルごと／冪等であること）:

1) slug の決定
- `frontmatter.slug` を優先。無ければファイル名から kebab-case で生成。

2) 公式URLの取得
- `frontmatter.links.officialUrl` があれば採用。
- 無い場合、本文の Overview や末尾の引用文献リストから公式URLを推定。

3) ヒーロー候補の収集（chrome-devtools-mcp）
- `navigate_page(公式URL)` → DOM 安定待ち。
- 候補要素列挙: `img`, `picture source`, `figure img`, `main img`, `article img` に加え、
  `meta[property="og:image"], meta[name="og:image"], meta[name="twitter:image"]` の URL。
- 各候補について:
  - URL を絶対化（`currentSrc` / `srcset` 最大解像度 / `data-src` 等も考慮）。
  - `boundingBox` 面積（px^2）、アスペクト比、alt/title、近傍の `figcaption` テキストを取得。

4) スコアリング（最大 1 枚選択）
- ベース: `score = log(1 + area)`（面積が大きいほど高スコア）。
- 加点: `hero|product|packshot|keyvisual` 等、製品のメイン画像を示唆するテキストが URL/alt/title/キャプションに含む → +400。
- 画像拡張子が `.png|.jpg|.jpeg|.webp` → +50。
- 減点: アスペクト比が極端（w/h < 0.5 or > 2.4） → −100。最小辺 < 400px → 除外。
- 同点時: PNG > JPEG > WebP を優先。
- 候補が 0 の場合はスキップ。

5) ダウンロード
- chrome-devtools-mcp のツールを使用して画像をダウンロード
- ダウンロードに失敗した場合は curl コマンド等の代替手段を使用
- Content-Type または URL から拡張子を決定（`.png|.jpg|.jpeg|.webp|.svg`）。不明は `.png`。
- 出力先: `src/assets/images/hero/<slug>.<ext>`。

6) 冪等比較と保存
- 既存ファイルがある場合はバイトのハッシュ（sha256）比較。一致なら保存スキップ（状態 `already`）。
- 不一致／未存在なら **そのまま**書き込み（再圧縮・再エンコード禁止）。

7) frontmatter の `heroImage` を更新（最小差分）
- 設定値は `"@assets/images/hero/<slug>.<ext>"`。
- 既に同一値なら変更しない。
- 値が異なる/未設定なら **frontmatterのみ**更新。
  - YAML の場合: `heroImage: "@assets/images/hero/<slug>.<ext>"` を追加/置換。
  - MDX の `export const frontmatter = {...}` の場合: `heroImage` プロパティを追加/置換（末尾カンマやインデントは現状に合わせ、差分最小）。

8) 出力（ログ）
- 各ファイルについて `status: ok:written | ok:already | skip:<理由>`, `heroPath`, `srcUrl` を要約。

禁止/安全:
- 本文のテキスト本文・見出し・リンクは**変更しない**（frontmatter以外タッチ禁止）。
- 画像は**再圧縮しない**（取得したバイト列をそのまま書き込む）。SVG はテキストのまま保存。
- 例外や失敗はそのファイルのみスキップし、他ファイル処理は続行。

検査:
- 画像保存後、frontmatter.heroImage が拡張子込みの正しいパスに更新されている。
- 既存と同一画像なら保存がスキップされ frontmatter も不要更新なし（冪等）。
