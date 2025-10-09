目的:
- 対象 MDX（{{FILES}}）の適切な箇所に公式サイトから画像を保存して差し込みます
- **有用と判断できる場合は 1セクションにつき最大1枚**まで挿入（デフォルト上限=1、重複や冗長は避ける）
- **JS描画（canvas / SVG / CSS背景）も対象**。Chromeで“保存可能”なら拾う

対象:
- {{FILES}}（**.mdxのみ**）
- 画像保存先: `src/assets/images/contents/`

依存（MCP）:
- chrome-devtools-mcp（ブラウズ・DOM探索・HTTP取得）
- Filesystem MCP（書き込み）

画像候補の収集
- 記事本文と公式サイトの画像を照らし合わせて、画像を挿入することで読者にとって有用な効果がある場合のみ、画像をダウンロードして挿入する
- それぞれの画像について**"元データ"を優先**:
  - 第一: **HTTPバイナリ取得**（`context.request.get(imgUrl)` or `page.request.get(imgUrl)`）
  - 第二: curlコマンドによる直接取得
    ```bash
    # サンプル: User-Agentヘッダーを付与して元画像を取得
    curl -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
      "https://www.stereophile.com/images/0324-BW801fig4-600.jpg" \
      -o src/assets/images/contents/bowers-and-wilkins-801d4-fr-1.jpg
    ```
  - 第三: ページ内 `fetch(imgUrl)`
  - 第四（最終手段）: **要素スクリーンショット**（PNG, 品質=高）。※HTTP取得できた場合は**使わない**
  - `<canvas>` は `toDataURL` を**第一手段**とみなし、PNGをそのまま
  - `<svg>` は `outerHTML` を**そのまま** `.svg` として保存（テキスト）

MDXへの挿入:
- 冒頭(frontmatter直後)に `import { Picture } from 'astro:assets';';` を**1回だけ**追加
- 各画像を `import imagePath from '@assets/images/contents/<filename>'` のように変数化
- 当該セクションの適切な位置にPictureタグを挿入
例）
<Picture src={imagePath} formats={['avif', 'webp']} alt={altText} decoding="async" loading="lazy" />
